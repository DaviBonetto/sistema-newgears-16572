import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { User, Upload, Plus, X, Target, Calendar, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [personalGoals, setPersonalGoals] = useState<any[]>([]);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [viewingGoal, setViewingGoal] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchPersonalGoals();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data);
    setLoading(false);
  };

  const fetchPersonalGoals = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("personal_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setPersonalGoals(data || []);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.get("full_name") as string,
        shift: formData.get("shift") as string,
        role: formData.get("role") as string,
        strengths: formData.get("strengths") as string,
        improvements: formData.get("improvements") as string,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao atualizar perfil");
    } else {
      toast.success("Perfil atualizado!");
      fetchProfile();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao fazer upload");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao atualizar avatar");
    } else {
      toast.success("Foto atualizada!");
      fetchProfile();
    }

    setUploading(false);
  };

  const handleAddTag = async () => {
    if (!user || !newTag.trim()) return;

    const currentTags = profile?.tags || [];
    if (currentTags.includes(newTag.trim())) {
      toast.error("Tag já existe");
      return;
    }

    const updatedTags = [...currentTags, newTag.trim()];

    const { error } = await supabase
      .from("profiles")
      .update({ tags: updatedTags })
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao adicionar tag");
    } else {
      toast.success("Tag adicionada!");
      setNewTag("");
      fetchProfile();
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!user) return;

    const updatedTags = (profile?.tags || []).filter((tag: string) => tag !== tagToRemove);

    const { error } = await supabase
      .from("profiles")
      .update({ tags: updatedTags })
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao remover tag");
    } else {
      toast.success("Tag removida!");
      fetchProfile();
    }
  };

  const handleGoalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const goalData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      status: formData.get("status") as string,
      target_date: formData.get("target_date") as string || null,
      user_id: user.id,
    };

    if (editingGoal) {
      const { error } = await supabase
        .from("personal_goals")
        .update(goalData)
        .eq("id", editingGoal.id);

      if (error) {
        toast.error("Erro ao atualizar meta");
      } else {
        toast.success("Meta atualizada!");
        setIsGoalDialogOpen(false);
        setEditingGoal(null);
        fetchPersonalGoals();
      }
    } else {
      const { error } = await supabase
        .from("personal_goals")
        .insert(goalData);

      if (error) {
        toast.error("Erro ao criar meta");
      } else {
        toast.success("Meta criada!");
        setIsGoalDialogOpen(false);
        fetchPersonalGoals();
      }
    }
  };


  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;

    const { error } = await supabase
      .from("personal_goals")
      .delete()
      .eq("id", goalToDelete);

    if (error) {
      toast.error("Erro ao excluir meta");
    } else {
      toast.success("Meta excluída!");
      fetchPersonalGoals();
    }
    
    setDeleteDialogOpen(false);
    setGoalToDelete(null);
  };

  const getGoalStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: "default",
      in_progress: "secondary",
      pending: "outline",
    };
    const labels: Record<string, string> = {
      completed: "✅ Concluído",
      in_progress: "🕓 Em andamento",
      pending: "📌 Pendente",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações e metas pessoais</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Foto de Perfil</p>
                  <p className="text-xs text-muted-foreground">
                    {uploading ? "Enviando..." : "Clique no ícone para fazer upload"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={profile?.full_name}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shift">Turno</Label>
                  <Select name="shift" defaultValue={profile?.shift}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manhã">Manhã</SelectItem>
                      <SelectItem value="Tarde">Tarde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Input
                    id="role"
                    name="role"
                    defaultValue={profile?.role}
                    placeholder="Ex: Programador, Designer..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags Personalizadas</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(profile?.tags || []).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: Robô, Projeto, Líder..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strengths">Pontos Fortes</Label>
                <Textarea
                  id="strengths"
                  name="strengths"
                  defaultValue={profile?.strengths}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="improvements">Pontos a Melhorar</Label>
                <Textarea
                  id="improvements"
                  name="improvements"
                  defaultValue={profile?.improvements}
                  rows={3}
                />
              </div>

              <Button type="submit">Salvar Alterações</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Minhas Metas Pessoais (Privadas)
            </CardTitle>
            <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingGoal(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Meta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingGoal ? "Editar Meta" : "Nova Meta Pessoal"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleGoalSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={editingGoal?.title}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingGoal?.description}
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue={editingGoal?.status || "pending"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">📌 Pendente</SelectItem>
                          <SelectItem value="in_progress">🕓 Em andamento</SelectItem>
                          <SelectItem value="completed">✅ Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="target_date">Data Alvo</Label>
                      <Input
                        id="target_date"
                        name="target_date"
                        type="date"
                        defaultValue={editingGoal?.target_date}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingGoal ? "Atualizar" : "Criar"} Meta
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsGoalDialogOpen(false);
                        setEditingGoal(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {personalGoals.map((goal) => (
                <Card 
                  key={goal.id} 
                  className="border-l-4 border-l-primary hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setViewingGoal(goal)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{goal.title}</h4>
                        {getGoalStatusBadge(goal.status)}
                      </div>
                      <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGoal(goal);
                            setIsGoalDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGoalToDelete(goal.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {goal.description}
                      </p>
                    )}
                    {goal.target_date && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(goal.target_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {personalGoals.length === 0 && (
                <p className="text-center text-muted-foreground py-8 col-span-2">
                  Nenhuma meta pessoal ainda. Comece adicionando uma!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Metas Pessoais</p>
                <p className="text-2xl font-bold">
                  {personalGoals.filter((g) => g.status === "completed").length} / {personalGoals.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Evidências Criadas</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Missões Executadas</p>
                <p className="text-2xl font-bold">--</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Goal Details Dialog */}
        <Dialog open={!!viewingGoal} onOpenChange={(open) => !open && setViewingGoal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {viewingGoal?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <div className="mt-1">
                  {viewingGoal && getGoalStatusBadge(viewingGoal.status)}
                </div>
              </div>

              {viewingGoal?.description && (
                <div>
                  <Label className="text-sm text-muted-foreground">Descrição</Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{viewingGoal.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {viewingGoal?.target_date && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Data Alvo</Label>
                    <p className="mt-1 text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(viewingGoal.target_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-sm text-muted-foreground">Criado em</Label>
                  <p className="mt-1 text-sm">
                    {viewingGoal && format(new Date(viewingGoal.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Última atualização</Label>
                <p className="mt-1 text-sm">
                  {viewingGoal && format(new Date(viewingGoal.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setEditingGoal(viewingGoal);
                    setViewingGoal(null);
                    setIsGoalDialogOpen(true);
                  }}
                >
                  Editar Meta
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setGoalToDelete(viewingGoal?.id);
                    setViewingGoal(null);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setGoalToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteGoal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
