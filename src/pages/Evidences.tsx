import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, FileText, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Evidences() {
  const { user } = useAuth();
  const [evidences, setEvidences] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchEvidences();
  }, []);

  const fetchEvidences = async () => {
    const { data } = await supabase
      .from("evidences")
      .select("*, creator:created_by(*), task:task_id(*)")
      .order("created_at", { ascending: false });
    setEvidences(data || []);
  };

  const handleUploadFile = async (file: File) => {
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from("evidences")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Erro ao fazer upload do arquivo");
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("evidences")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleCreateEvidence = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setUploading(true);
    const formData = new FormData(e.currentTarget);
    const file = (formData.get("file") as File);

    if (!file || file.size === 0) {
      toast.error("Por favor, selecione um arquivo");
      setUploading(false);
      return;
    }

    const summary = formData.get("summary") as string;
    if (summary.length < 50) {
      toast.error("O resumo deve ter pelo menos 50 caracteres");
      setUploading(false);
      return;
    }

    const fileUrl = await handleUploadFile(file);
    if (!fileUrl) {
      setUploading(false);
      return;
    }

    const { error } = await supabase.from("evidences").insert({
      title: formData.get("title") as string,
      summary: summary,
      file_url: fileUrl,
      file_type: file.type,
      created_by: user.id,
    });

    if (error) {
      toast.error("Erro ao criar evidência");
    } else {
      toast.success("Evidência criada com sucesso!");
      setIsCreateOpen(false);
      fetchEvidences();
    }
    setUploading(false);
  };

  const handleDeleteEvidence = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta evidência?")) return;

    const { error } = await supabase
      .from("evidences")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir evidência");
    } else {
      toast.success("Evidência excluída!");
      fetchEvidences();
    }
  };

  const filteredEvidences = evidences.filter((evidence) =>
    evidence.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evidence.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evidence.creator?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Caderno de Evidências</h1>
            <p className="text-muted-foreground">Documentação e registros do time</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Evidência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Evidência</DialogTitle>
                <DialogDescription>
                  Adicione documentação com arquivo obrigatório
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateEvidence} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" name="title" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Resumo (mínimo 50 caracteres)</Label>
                  <Textarea
                    id="summary"
                    name="summary"
                    rows={4}
                    minLength={50}
                    required
                    placeholder="Descreva a evidência em detalhes..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Arquivo (obrigatório)</Label>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept="image/*,video/*,.pdf"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: Imagens, vídeos ou PDF
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={uploading}>
                    {uploading ? "Salvando..." : "Criar Evidência"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar evidências..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvidences.map((evidence) => (
            <Card key={evidence.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex gap-1">
                    <a
                      href={evidence.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    {user?.id === evidence.created_by && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDeleteEvidence(evidence.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{evidence.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground line-clamp-3">
                  {evidence.summary}
                </p>
                <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                  <p>Por: {evidence.creator?.full_name}</p>
                  <p>
                    {formatDistanceToNow(new Date(evidence.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                  {evidence.task && <p>Tarefa: {evidence.task.title}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredEvidences.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhuma evidência encontrada" : "Ainda não há evidências"}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
