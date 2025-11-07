import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MultiUpload } from "@/components/MultiUpload";
import { Plus, Edit, Trash2, Calendar, User, AlertCircle, Loader2, Save, X, ArrowLeft, Home } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Attachment {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  storagePath?: string;
  error?: string;
}

interface Evidence {
  id: string;
  title: string;
  description: string;
  attachments: Attachment[];
  created_at: string;
  created_by: string;
  project_id: string;
  user: {
    name: string;
    email: string;
  };
}

interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  user: {
    name: string;
    email: string;
  };
}

export function Evidences() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    attachments: [] as Attachment[]
  });
  const [draftAttachments, setDraftAttachments] = useState<Attachment[]>([]);

  // Carregar evidências - removemos restrição de projeto para acesso universal
  useEffect(() => {
    loadEvidences();
    // Removemos a verificação de permissões para permitir acesso universal
    // checkProjectPermissions();
  }, [user]); // Removido projectId da dependência

  // Restaurar rascunho de anexos do localStorage
  useEffect(() => {
    if (user?.id) {
      const draftKey = projectId ? `evidence_draft_${projectId}_${user.id}` : `evidence_draft_global_${user.id}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.attachments && draft.attachments.length > 0) {
            setDraftAttachments(draft.attachments);
            toast.info("Rascunho de anexos restaurado. Você pode continuar de onde parou.");
          }
        } catch (error) {
          console.error("Erro ao restaurar rascunho:", error);
        }
      }
    }
  }, [projectId, user]);

  // Salvar rascunho de anexos no localStorage
  useEffect(() => {
    if (projectId && user?.id && draftAttachments.length > 0) {
      const draftKey = `evidence_draft_${projectId}_${user.id}`;
      localStorage.setItem(draftKey, JSON.stringify({
        attachments: draftAttachments,
        savedAt: new Date().toISOString()
      }));
    }
  }, [draftAttachments, projectId, user]);

  const loadEvidences = async () => {
    try {
      let query = supabase
        .from('evidences')
        .select(`
          *,
          user:users!evidences_created_by_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      // Se houver projectId, filtra por projeto, senão mostra todas as evidências
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvidences(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar evidências:", error);
      toast.error("Erro ao carregar evidências");
    } finally {
      setLoading(false);
    }
  };

  const checkProjectPermissions = async () => {
    if (!projectId || !user?.id) return;

    try {
      // Verificar se é membro do projeto
      const { data: memberData } = await supabase
        .from('project_members')
        .select('role, user_id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      setIsMember(!!memberData);
      setIsAdmin(memberData?.role === 'admin' || memberData?.role === 'owner');

      // Carregar membros do projeto
      const { data: members } = await supabase
        .from('project_members')
        .select(`
          *,
          user:users!project_members_user_id_fkey(name, email)
        `)
        .eq('project_id', projectId);

      setProjectMembers(members || []);
    } catch (error: any) {
      console.error("Erro ao verificar permissões:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    // Validar se todos os anexos foram enviados com sucesso
    const pendingAttachments = formData.attachments.filter(att => att.status !== 'completed');
    if (pendingAttachments.length > 0) {
      toast.error("Aguarde o envio de todos os anexos antes de salvar");
      return;
    }

    setSaving(true);

    try {
      // Validar dados obrigatórios
      if (!formData.title.trim()) {
        throw new Error("Título é obrigatório");
      }

      // Preparar anexos válidos
      const validAttachments = formData.attachments
        .filter(att => att.status === 'completed' && att.url && att.name)
        .map(att => ({
          id: att.id,
          url: att.url,
          name: att.name,
          type: att.type,
          size: att.size,
          storagePath: att.storagePath || null
        }));

      // Iniciar transação manual
      const evidenceData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || "",
        project_id: projectId || null, // Permite evidências sem projeto
        created_by: user.id,
        attachments: validAttachments
      };

      let evidenceId: string;

      if (editingEvidence) {
        // Atualizar evidência existente
        const { error: updateError } = await supabase
          .from('evidences')
          .update(evidenceData)
          .eq('id', editingEvidence.id);

        if (updateError) throw updateError;
        evidenceId = editingEvidence.id;
      } else {
        // Criar nova evidência
        const { data: newEvidence, error: createError } = await supabase
          .from('evidences')
          .insert(evidenceData)
          .select()
          .single();

        if (createError) throw createError;
        evidenceId = newEvidence.id;
      }

      // Limpar rascunho após salvar com sucesso
      if (user?.id) {
        const draftKey = projectId ? `evidence_draft_${projectId}_${user.id}` : `evidence_draft_global_${user.id}`;
        localStorage.removeItem(draftKey);
        setDraftAttachments([]);
      }

      toast.success(editingEvidence ? "Evidência atualizada!" : "Evidência criada!");
      
      // Resetar formulário e fechar dialog
      resetForm();
      setShowDialog(false);
      
      // Recarregar evidências
      await loadEvidences();
      
    } catch (error: any) {
      console.error("Erro ao salvar evidência:", error);
      toast.error(`Erro ao salvar evidência: ${error.message}`);
      
      // Em caso de erro, manter os dados do formulário para retry
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (evidenceId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta evidência?")) return;

    try {
      // Buscar a evidência para obter os anexos
      const { data: evidence } = await supabase
        .from('evidences')
        .select('attachments')
        .eq('id', evidenceId)
        .single();

      if (evidence?.attachments) {
        // Deletar arquivos do storage
        const deletePromises = evidence.attachments
          .filter((att: any) => att.storagePath)
          .map((att: any) => 
            supabase.storage.from('evidences').remove([att.storagePath])
          );

        await Promise.all(deletePromises);
      }

      // Deletar evidência do banco
      const { error } = await supabase
        .from('evidences')
        .delete()
        .eq('id', evidenceId);

      if (error) throw error;

      toast.success("Evidência excluída!");
      loadEvidences();
    } catch (error: any) {
      console.error("Erro ao excluir evidência:", error);
      toast.error("Erro ao excluir evidência");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      attachments: []
    });
    setEditingEvidence(null);
  };

  const openEditDialog = (evidence: Evidence) => {
    setEditingEvidence(evidence);
    setFormData({
      title: evidence.title,
      description: evidence.description,
      attachments: evidence.attachments || []
    });
    setShowDialog(true);
  };

  const openNewDialog = () => {
    resetForm();
    // Usar rascunho se disponível
    if (draftAttachments.length > 0) {
      setFormData(prev => ({ ...prev, attachments: draftAttachments }));
    }
    setShowDialog(true);
  };

  const canEditEvidence = (evidence: Evidence) => {
    return isAdmin || evidence.created_by === user?.id;
  };

  const handleAttachmentUpdate = (attachments: Attachment[]) => {
    setFormData(prev => ({ ...prev, attachments }));
    setDraftAttachments(attachments);
    
    // Save draft to localStorage
    if (user?.id) {
      const draftKey = projectId ? `evidence_draft_${projectId}_${user.id}` : `evidence_draft_global_${user.id}`;
      localStorage.setItem(draftKey, JSON.stringify({ attachments }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Evidências do Projeto</h2>
          <p className="text-muted-foreground">
            Registre e compartilhe evidências do seu projeto de inovação
          </p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Evidência
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvidence ? "Editar Evidência" : "Nova Evidência"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Digite um título descritivo"
                required
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva a evidência e seu contexto"
                rows={4}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label>Anexos</Label>
              <MultiUpload
                bucket="evidences"
                attachments={formData.attachments}
                onUpdate={handleAttachmentUpdate}
                userId={user?.id || ""}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={saving}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || formData.attachments.some(att => att.status === 'uploading')}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingEvidence ? "Atualizar" : "Criar"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {evidences.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Calendar className="h-12 w-12 mx-auto mb-4" />
              <p>Nenhuma evidência registrada ainda</p>
              <p className="text-sm mt-2">
                Comece criando sua primeira evidência para documentar o progresso do projeto
              </p>
            </div>
            <Button onClick={openNewDialog} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Evidência
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {evidences.map((evidence) => (
            <Card key={evidence.id} className="overflow-hidden">
              {evidence.attachments?.[0]?.type?.startsWith('image/') && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={evidence.attachments[0].url}
                    alt={evidence.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{evidence.title}</CardTitle>
                  {canEditEvidence(evidence) && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(evidence)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(evidence.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardDescription className="line-clamp-3">
                  {evidence.description || "Sem descrição"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {evidence.attachments && evidence.attachments.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{evidence.attachments.length} anexo(s)</span>
                      {evidence.attachments.map((att, idx) => (
                        <span key={idx} className="text-xs">
                          {att.name.split('.').pop()?.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{evidence.user.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(evidence.created_at), "PPP", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export { Evidences as default };
