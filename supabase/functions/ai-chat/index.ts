import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o Assistente GEARS, especialista na rubrica FIRST/CORE e em projetos de inovação e design de robô. Sua missão: ajudar a equipe GEARS a preparar o projeto e a apresentação, diagnosticar pontos fracos, sugerir melhorias acionáveis e simular perguntas de juiz.

Regras principais:
1. Conhecimento da rubrica: sempre alinhe respostas à rubrica FIRST/CORE: Discovery (Descoberta), Innovation (Inovação), Impact (Impacto), Inclusion (Inclusão), Teamwork (Trabalho em equipe), Presentation (Apresentação). Quando sugerir ações, indique explicitamente qual valor da rubrica está sendo atendido.
2. Uso de evidências: ao responder sobre o projeto, priorize evidências já ingestadas (documentos, fotos, laudos, logs de teste). Se algo não estiver nos documentos, diga claramente que é suposição e sugira como coletar a evidência.
3. Interpretação de arquivos: você pode ler textos extraídos de PDFs, OCR de imagens e CSVs. Ao receber um arquivo, extraia, resuma em até 400 palavras e armazene como doc_summary ligado à sessão.
4. Memória por sessão: cada sessão tem memória persistente (resumos + decisões). Use essa memória para manter contexto entre conversas. Sempre que criar nova informação relevante (decisão, método, resultado de teste), pergunte se pode salvar como memória e, se autorizado, salve automaticamente.
5. Respostas e formato: seja objetivo. Prefira listas de ação (3–7 passos), checklist e exemplos concretos. Quando o usuário pedir, gere 3–5 perguntas prováveis de juiz, categorizadas por profundidade (baixo/médio/alto), e forneça respostas exemplo curtas.
6. Interação técnica: suporte prompts com uploads. Para documentos grandes, cite páginas/trechos e retorne links para o documento ingestado.
7. Privacidade e acesso: apenas membros GEARS têm acesso. Nunca vaze dados fora do ambiente.

Seja pró-ativo: se durante a conversa identificar lacuna crítica para a apresentação (ex: falta laudo, falta teste do robô), sugira o pedido de evidência exato a coletar (quem, quando, como) e proponha a forma de documentação para a rubrica.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { session_id, message, attachments } = await req.json();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save user message
    await supabaseClient.from("chat_messages").insert({
      session_id,
      author_id: user.id,
      role: "user",
      content: message,
      attachments: attachments || [],
    });

    // Get conversation history
    const { data: messages } = await supabaseClient
      .from("chat_messages")
      .select("*")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true })
      .limit(20);

    // Get session memory
    const { data: memory } = await supabaseClient
      .from("chat_memory")
      .select("*")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Build conversation context
    const conversationMessages = messages?.map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    // Add memory context if exists
    let systemPrompt = SYSTEM_PROMPT;
    if (memory) {
      systemPrompt += `\n\nMemória da sessão anterior: ${memory.memory_summary}`;
    }

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationMessages,
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Add credits to workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    // Stream response back
    const reader = aiResponse.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    let fullResponse = "";
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(encoder.encode(line + "\n\n"));
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
          
          // Save assistant response
          await supabaseClient.from("chat_messages").insert({
            session_id,
            role: "assistant",
            content: fullResponse,
          });

          // Update session summary every 5 messages
          const { count } = await supabaseClient
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("session_id", session_id);

          if (count && count % 5 === 0) {
            await supabaseClient.from("chat_memory").insert({
              session_id,
              memory_summary: `Resumo das últimas ${count} mensagens.`,
              metadata: { message_count: count },
            });
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
