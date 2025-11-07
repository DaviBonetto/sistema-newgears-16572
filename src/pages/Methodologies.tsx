import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useScrollPersistence } from "@/hooks/useScrollPersistence";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Lightbulb, Trash2, Search, ExternalLink, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Methodologies() {
  const { user } = useAuth();
  const [methodologies, setMethodologies] = useState<any[]>([]);
  const [filteredMethodologies, setFilteredMethodologies] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  
  useScrollPersistence();

  useEffect(() => {
    fetchMethodologies();
  }, []);

  useEffect(() => {
    filterMethodologies();
  }, [methodologies, searchQuery, selectedTag]);

  const fetchMethodologies = async () => {
    const { data } = await supabase
      .from("methodologies")
      .select("*, creator:created_by(*)")
      .order("created_at", { ascending: false });
    setMethodologies(data || []);
  };

  const filterMethodologies = () => {
    let filtered = methodologies;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by tag
    if (selectedTag !== "all") {
      filtered = filtered.filter((m) => m.tags?.includes(selectedTag));
    }

    setFilteredMethodologies(filtered);
  };

  const getAllTags = () => {
    const tagsSet = new Set<string>();
    methodologies.forEach((m) => {
      m.tags?.forEach((tag: string) => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  };

  const handleUploadImage = async (file: File) => {
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("methodologies")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Erro ao fazer upload da imagem");
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("methodologies")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleCreateMethodology = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setUploading(true);
    const formData = new FormData(e.currentTarget);
    const file = formData.get("image") as File;

    let imageUrl = null;
    if (file && file.size > 0) {
      imageUrl = await handleUploadImage(file);
      if (!imageUrl) {
        setUploading(false);
        return;
      }
    }

    const tagsString = formData.get("tags") as string;
    const tags = tagsString.split(",").map((t) => t.trim()).filter((t) => t);

    const { error } = await supabase.from("methodologies").insert({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      image_url: imageUrl,
      origin: formData.get("origin") as string,
      tags: tags,
      created_by: user.id,
    });

    if (error) {
      toast.error("Erro ao criar metodologia");
    } else {
      toast.success("Metodologia criada com sucesso!");
      setIsCreateOpen(false);
      fetchMethodologies();
    }
    setUploading(false);
  };

  const handleDeleteMethodology = async (id: string, imageUrl?: string) => {
    if (!confirm("Tem certeza que deseja excluir esta metodologia?")) return;

    if (imageUrl) {
      const fileName = imageUrl.split("/").pop();
      if (fileName) {
        await supabase.storage.from("methodologies").remove([fileName]);
      }
    }

    const { error } = await supabase
      .from("methodologies")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir metodologia");
    } else {
      toast.success("Metodologia excluída!");
      fetchMethodologies();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Lightbulb className="h-8 w-8 text-secondary" />
              Metodologias
            </h1>
            <p className="text-muted-foreground">
              Banco de conhecimento de metodologias aplicadas
            </p>
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
                <DialogTitle>Adicionar Nova Metodologia</DialogTitle>
                <DialogDescription>
                  Registre uma nova metodologia aplicada no projeto
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMethodology} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" name="title" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="origin">Origem / Link Externo</Label>
                  <Input
                    id="origin"
                    name="origin"
                    type="url"
                    placeholder="https://exemplo.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Link para documentação ou fonte externa
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    placeholder="design thinking, prototipagem, teste"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Imagem (opcional)</Label>
                  <Input id="image" name="image" type="file" accept="image/*" />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={uploading}>
                    {uploading ? "Enviando..." : "Criar Metodologia"}
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

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="search">
                  <Search className="inline h-4 w-4 mr-2" />
                  Buscar
                </Label>
                <Input
                  id="search"
                  placeholder="Buscar metodologias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag-filter">
                  <Filter className="inline h-4 w-4 mr-2" />
                  Filtrar por Tag
                </Label>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger id="tag-filter">
                    <SelectValue placeholder="Todas as tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as tags</SelectItem>
                    {getAllTags().map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Methodologies Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMethodologies.map((methodology) => (
            <Card key={methodology.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {methodology.image_url && (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={methodology.image_url}
                    alt={methodology.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2">
                  <span className="line-clamp-2">{methodology.title}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      handleDeleteMethodology(methodology.id, methodology.image_url)
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {methodology.description}
                </p>

                {methodology.origin && (
                  <a
                    href={methodology.origin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver fonte externa
                  </a>
                )}

                {methodology.tags && methodology.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {methodology.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {methodology.creator && (
                  <p className="text-xs text-muted-foreground">
                    Por: {methodology.creator.full_name}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMethodologies.length === 0 && (
          <Card className="p-12 text-center">
            <Lightbulb className="mx-auto h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg text-muted-foreground">
              {searchQuery || selectedTag !== "all"
                ? "Nenhuma metodologia encontrada com esses filtros"
                : "Nenhuma metodologia cadastrada ainda"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchQuery || selectedTag !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Adicione a primeira metodologia ao banco de conhecimento!"}
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
}
