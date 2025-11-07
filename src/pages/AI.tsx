import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, MessageSquare, Trash2, Edit2, Download, Loader2 } from "lucide-react";
import { PromptInputBox } from "@/components/PromptInputBox";
import ReactMarkdown from "react-markdown";

interface Session {
  id: string;
  name: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  attachments?: any[];
}

const generateSessionName = () => {
  const adjectives = ["Swift", "Sparrow", "Phoenix", "Quantum", "Stellar", "Cyber", "Nova", "Echo"];
  const numbers = Math.floor(Math.random() * 99) + 1;
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${numbers}`;
};

export default function AI() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeSession) {
      loadMessages(activeSession.id);
    }
  }, [activeSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("owner", user?.id)
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar sessões");
      return;
    }

    setSessions(data || []);
  };

  const loadMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar mensagens");
      return;
    }

    setMessages((data || []).map(msg => ({
      id: msg.id,
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
      created_at: msg.created_at,
      attachments: Array.isArray(msg.attachments) ? msg.attachments : []
    })));
  };

  const handleCreateSession = async () => {
    const name = newSessionName.trim() || generateSessionName();
    
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        name,
        owner: user?.id,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar sessão");
      return;
    }

    setSessions([data, ...sessions]);
    setActiveSession(data);
    setNewSessionName("");
    setShowCreateDialog(false);
    toast.success("Sessão criada com sucesso");
  };

  const handleRenameSession = async () => {
    if (!editingSession || !newSessionName.trim()) return;

    const { error } = await supabase
      .from("chat_sessions")
      .update({ name: newSessionName.trim() })
      .eq("id", editingSession.id);

    if (error) {
      toast.error("Erro ao renomear sessão");
      return;
    }

    setSessions(sessions.map(s => 
      s.id === editingSession.id ? { ...s, name: newSessionName.trim() } : s
    ));
    
    if (activeSession?.id === editingSession.id) {
      setActiveSession({ ...activeSession, name: newSessionName.trim() });
    }

    setEditingSession(null);
    setNewSessionName("");
    toast.success("Sessão renomeada");
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta sessão?")) return;

    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      toast.error("Erro ao excluir sessão");
      return;
    }

    setSessions(sessions.filter(s => s.id !== sessionId));
    if (activeSession?.id === sessionId) {
      setActiveSession(null);
      setMessages([]);
    }
    toast.success("Sessão excluída");
  };

  const handleSendMessage = async (message: string, files?: File[]) => {
    if (!activeSession) {
      toast.error("Selecione uma sessão primeiro");
      return;
    }

    setIsLoading(true);

    try {
      let attachments: any[] = [];

      // Upload files if any
      if (files && files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);

          const { data: docData } = await supabase.functions.invoke("ai-ingest-document", {
            body: formData,
          });

          if (docData) {
            attachments.push(docData.document_id);
          }
        }
      }

      // Add user message to UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        created_at: new Date().toISOString(),
        attachments,
      };
      setMessages(prev => [...prev, userMessage]);

      // Call chat endpoint with streaming
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            session_id: activeSession.id,
            message,
            attachments,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (reader) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);

        while (true) {
          const { done, value } = await reader.read();
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
                  assistantMessage += content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg.role === "assistant") {
                      lastMsg.content = assistantMessage;
                    }
                    return newMessages;
                  });
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }

      // Reload messages to get saved version
      await loadMessages(activeSession.id);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportSession = async () => {
    if (!activeSession) return;

    let markdown = `# ${activeSession.name}\n\n`;
    markdown += `Criado em: ${new Date(activeSession.created_at).toLocaleString()}\n\n`;
    markdown += "---\n\n";

    messages.forEach(msg => {
      const role = msg.role === "user" ? "👤 Usuário" : "🤖 Assistente";
      markdown += `## ${role}\n\n${msg.content}\n\n`;
    });

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeSession.name}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Sessão exportada");
  };

  if (!activeSession) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Assistente IA GEARS</h1>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Sessão
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Sessão</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome da Sessão (opcional)</Label>
                    <Input
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      placeholder={generateSessionName()}
                      onKeyPress={(e) => e.key === "Enter" && handleCreateSession()}
                    />
                  </div>
                  <Button onClick={handleCreateSession} className="w-full">
                    Criar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className="cursor-pointer transition-all hover:shadow-lg"
                onClick={() => setActiveSession(session)}
              >
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <CardTitle className="text-lg">{session.name}</CardTitle>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingSession(session);
                        setNewSessionName(session.name);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {new Date(session.updated_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {editingSession && (
            <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Renomear Sessão</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Novo Nome</Label>
                    <Input
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleRenameSession()}
                    />
                  </div>
                  <Button onClick={handleRenameSession} className="w-full">
                    Renomear
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="border-b p-4 flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveSession(null);
                setMessages([]);
              }}
            >
              ← Voltar
            </Button>
            <h2 className="text-xl font-bold">{activeSession.name}</h2>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportSession}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
                <p className="mt-2 text-xs opacity-70">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-4 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Pensando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4 bg-card">
          <PromptInputBox
            onSend={handleSendMessage}
            isLoading={isLoading}
            placeholder="Digite sua mensagem ou faça upload de arquivos..."
          />
        </div>
      </div>
    </Layout>
  );
}
