import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to storage
    const filename = `${user.id}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from("ai-documents")
      .upload(filename, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from("ai-documents")
      .getPublicUrl(filename);

    // Extract text based on file type
    let textContent = "";
    const fileType = file.type;

    if (fileType.includes("text")) {
      textContent = await file.text();
    } else if (fileType.includes("pdf") || fileType.includes("image")) {
      // For PDFs and images, we would need OCR/parsing
      // For now, just store metadata
      textContent = `[${fileType}] File uploaded: ${file.name}`;
    } else if (fileType.includes("csv")) {
      const csvText = await file.text();
      textContent = csvText.slice(0, 5000); // First 5000 chars
    }

    // Save document metadata
    const { data: document, error: dbError } = await supabaseClient
      .from("ingested_documents")
      .insert({
        filename: file.name,
        file_url: publicUrl,
        text_content: textContent,
        metadata: {
          file_type: fileType,
          file_size: file.size,
        },
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({
        document_id: document.id,
        summary: textContent.slice(0, 400),
        chunks_count: Math.ceil(textContent.length / 1000),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Document ingestion error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
