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
import { Plus, Lightbulb, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Methodologies() {
  const { user } = useAuth();
  const [methodologies, setMethodologies] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

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
            <h1 className="text-3xl font-bold">Metodologias do Time</h1>
            <p className="text-muted-foreground">
              Ferramentário visual e técnicas de trabalho
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
                <DialogTitle>Adicionar Metodologia</DialogTitle>
                <DialogDescription>
                  Documente uma técnica ou ferramenta visual do time
                </DialogDescription>
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
                  <Label htmlFor="origin">Origem/Referência</Label>
                  <Input
                    id="origin"
                    name="origin"
                    placeholder="Ex: Gerado no Napkin, Canva..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    placeholder="Organização, Prototipagem, Pesquisa..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Imagem Ilustrativa (opcional)</Label>
                  <Input id="image" name="image" type="file" accept="image/*" />
                  <p className="text-xs text-muted-foreground">
                    Upload manual de imagem criada em ferramentas externas
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={uploading}>
                    {uploading ? "Salvando..." : "Criar Metodologia"}
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {methodologies.map((methodology) => (
            <Card key={methodology.id} className="overflow-hidden">
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
                <div className="flex items-start justify-between">
                  <Lightbulb className="h-5 w-5 text-secondary" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMethodology(methodology.id, methodology.image_url)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg">{methodology.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  {methodology.description}
                </p>
                {methodology.origin && (
                  <p className="mb-3 text-xs text-muted-foreground">
                    Origem: {methodology.origin}
                  </p>
                )}
                {methodology.tags && methodology.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {methodology.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {methodologies.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <Lightbulb className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma metodologia cadastrada ainda</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
