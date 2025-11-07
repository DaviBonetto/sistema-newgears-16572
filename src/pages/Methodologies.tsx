import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTabPersistence } from "@/hooks/useTabPersistence";
import { useScrollPersistence } from "@/hooks/useScrollPersistence";
import { MultiUpload } from "@/components/MultiUpload";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, BookOpen, Edit, Eye, Trash2, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Methodologies() {
  const { user } = useAuth();
  const [methodologies, setMethodologies] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingMethodology, setEditingMethodology] = useState<any>(null);
  const [viewingMethodology, setViewingMethodology] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [attachments, setAttachments] = useState<any[]>([]);
  
  useTabPersistence("all");
  useScrollPersistence();

  useEffect(() => {
    fetchMethodologies();
  }, []);

  const fetchMethodologies = async () => {
    const { data } = await supabase
      .from("methodologies")
      .select("*, creator:created_by(*)")
      .order("created_at", { ascending: false });
    setMethodologies(data || []);
  };

  const getAllTags = () => {
    const tagsSet = new Set<string>();
    methodologies.forEach((m) => {
      m.tags?.forEach((tag: string) => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  };

  const handleCreateMethodology = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setUploading(true);
    const formData = new FormData(e.currentTarget);
    const tagsInput = formData.get("tags") as string;

    const { error } = await supabase.from("methodologies").insert({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      origin: formData.get("origin") as string,
      tags: tagsInput ? tagsInput.split(",").map((t) => t.trim()) : [],
      image_url: attachments.find((a) => a.type?.startsWith("image/"))?.url || null,
      attachments: attachments,
      created_by: user.id,
    });

    if (error) {
      toast.error("Erro ao criar metodologia");
    } else {
      toast.success("Metodologia criada!");
      setIsCreateOpen(false);
      setAttachments([]);
      fetchMethodologies();
    }
    setUploading(false);
  };

  const handleEditMethodology = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMethodology) return;

    setUploading(true);
    const formData = new FormData(e.currentTarget);
    const tagsInput = formData.get("tags") as string;

    const { error } = await supabase
      .from("methodologies")
      .update({
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        origin: formData.get("origin") as string,
        tags: tagsInput ? tagsInput.split(",").map((t) => t.trim()) : [],
        image_url: attachments.find((a) => a.type?.startsWith("image/"))?.url || editingMethodology.image_url,
        attachments: attachments,
      })
      .eq("id", editingMethodology.id);

    if (error) {
      toast.error("Erro ao atualizar metodologia");
    } else {
      toast.success("Metodologia atualizada!");
      setIsEditOpen(false);
      setEditingMethodology(null);
      setAttachments([]);
      fetchMethodologies();
    }
    setUploading(false);
  };

  const handleDeleteMethodology = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta metodologia?")) return;

    const { error } = await supabase.from("methodologies").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir metodologia");
    } else {
      toast.success("Metodologia excluída!");
      fetchMethodologies();
    }
  };

  const filteredMethodologies = methodologies.filter((m) => {
    const matchesSearch = !searchQuery || 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === "all" || m.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Metodologias</h1>
            <p className="text-muted-foreground">Banco de ferramentas e técnicas do time</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Metodologia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Metodologia</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateMethodology} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" rows={4} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origin">Origem/Rúbrica</Label>
                  <Input id="origin" name="origin" placeholder="Ex: FLL, Design Thinking" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input id="tags" name="tags" placeholder="pesquisa, inovação, robótica" />
                </div>
                <div className="space-y-2">
                  <Label>Imagens e Anexos</Label>
                  <MultiUpload
                    bucket="methodologies"
                    attachments={attachments}
                    onUpdate={setAttachments}
                    userId={user?.id || ""}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={uploading}>
                  {uploading ? "Salvando..." : "Criar Metodologia"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Metodologia</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditMethodology} className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input name="title" defaultValue={editingMethodology?.title} required />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea name="description" rows={4} defaultValue={editingMethodology?.description} required />
                </div>
                <div className="space-y-2">
                  <Label>Origem/Rúbrica</Label>
                  <Input name="origin" defaultValue={editingMethodology?.origin} />
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <Input name="tags" defaultValue={editingMethodology?.tags?.join(", ")} />
                </div>
                <div className="space-y-2">
                  <Label>Imagens e Anexos</Label>
                  <MultiUpload
                    bucket="methodologies"
                    attachments={attachments}
                    onUpdate={setAttachments}
                    userId={user?.id || ""}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={uploading}>
                    {uploading ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsEditOpen(false);
                    setEditingMethodology(null);
                    setAttachments([]);
                  }}>Cancelar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* View Dialog */}
          <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">{viewingMethodology?.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {viewingMethodology?.image_url && (
                  <img src={viewingMethodology.image_url} alt={viewingMethodology.title} className="h-64 w-full rounded-lg object-cover" />
                )}
                {viewingMethodology?.origin && (
                  <div>
                    <h3 className="font-semibold text-primary">Origem</h3>
                    <p className="text-sm">{viewingMethodology.origin}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">Descrição</h3>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{viewingMethodology?.description}</p>
                </div>
                {viewingMethodology?.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {viewingMethodology.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar metodologias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as tags</SelectItem>
              {getAllTags().map((tag) => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMethodologies.map((m) => (
            <Card key={m.id} className="group overflow-hidden transition-all hover:shadow-lg">
              {m.image_url && (
                <div className="relative h-48">
                  <img src={m.image_url} alt={m.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => { setViewingMethodology(m); setIsViewOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {user?.id === m.created_by && (
                      <>
                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => { setEditingMethodology(m); setAttachments(m.attachments || []); setIsEditOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDeleteMethodology(m.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{m.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">{m.description}</p>
                {m.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {m.tags.slice(0, 3).map((tag: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
