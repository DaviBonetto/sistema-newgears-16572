import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useScrollPersistence } from "@/hooks/useScrollPersistence";
import { MultiUpload } from "@/components/MultiUpload";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, FileText, Download, Trash2, Edit, Eye } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Evidences() {
  const { user } = useAuth();
  const [evidences, setEvidences] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<any>(null);
  const [viewingEvidence, setViewingEvidence] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  useScrollPersistence();

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

    const { error } = await supabase.from("evidences").insert({
      title: formData.get("title") as string,
      summary: formData.get("summary") as string,
      file_url: attachments[0]?.url || "",
      file_type: attachments[0]?.type || "link",
      attachments: attachments,
      created_by: user.id,
    });

    if (error) {
      toast.error("Erro ao criar evidência");
    } else {
      toast.success("Evidência criada com sucesso!");
      setIsCreateOpen(false);
      setAttachments([]);
      fetchEvidences();
    }
    setUploading(false);
  };

  const handleEditEvidence = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEvidence) return;

    setUploading(true);
    const formData = new FormData(e.currentTarget);

    const { error } = await supabase
      .from("evidences")
      .update({
        title: formData.get("title") as string,
        summary: formData.get("summary") as string,
        attachments: attachments,
      })
      .eq("id", editingEvidence.id);

    if (error) {
      toast.error("Erro ao atualizar evidência");
    } else {
      toast.success("Evidência atualizada!");
      setIsEditOpen(false);
      setEditingEvidence(null);
      setAttachments([]);
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
                  <Label htmlFor="summary">Resumo</Label>
                  <Textarea
                    id="summary"
                    name="summary"
                    rows={4}
                    required
                    placeholder="Descreva a evidência em detalhes..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Anexos e Links</Label>
                  <MultiUpload
                    bucket="evidences"
                    attachments={attachments}
                    onUpdate={setAttachments}
                    userId={user?.id || ""}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={uploading}>
                    {uploading ? "Salvando..." : "Criar Evidência"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateOpen(false);
                      setAttachments([]);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Evidência</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditEvidence} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Título</Label>
                  <Input
                    id="edit-title"
                    name="title"
                    defaultValue={editingEvidence?.title}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-summary">Resumo</Label>
                  <Textarea
                    id="edit-summary"
                    name="summary"
                    rows={4}
                    defaultValue={editingEvidence?.summary}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Anexos e Links</Label>
                  <MultiUpload
                    bucket="evidences"
                    attachments={attachments}
                    onUpdate={setAttachments}
                    userId={user?.id || ""}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={uploading}>
                    {uploading ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditOpen(false);
                      setEditingEvidence(null);
                      setAttachments([]);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{viewingEvidence?.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">Resumo</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {viewingEvidence?.summary}
                  </p>
                </div>

                {viewingEvidence?.attachments && viewingEvidence.attachments.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-semibold">Anexos</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {viewingEvidence.attachments.map((att: any, idx: number) => (
                        <div key={idx} className="overflow-hidden rounded-lg border">
                          {att.type.startsWith("image/") ? (
                            <img
                              src={att.url}
                              alt={att.name}
                              className="h-48 w-full object-cover"
                            />
                          ) : att.type.startsWith("video/") ? (
                            <video src={att.url} className="w-full" controls />
                          ) : (
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 hover:bg-muted"
                            >
                              <FileText className="h-5 w-5" />
                              <span className="flex-1 truncate">{att.name}</span>
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 text-sm text-muted-foreground">
                  <p>Criado por: {viewingEvidence?.creator?.full_name}</p>
                  <p>
                    Em:{" "}
                    {viewingEvidence?.created_at &&
                      formatDistanceToNow(new Date(viewingEvidence.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                  </p>
                </div>
              </div>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setViewingEvidence(evidence);
                        setIsViewOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {user?.id === evidence.created_by && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setEditingEvidence(evidence);
                            setAttachments(evidence.attachments || []);
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDeleteEvidence(evidence.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
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
