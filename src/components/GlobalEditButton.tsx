import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit3, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ExternalLink {
  id: string;
  name: string;
  url: string;
}

/**
 * Componente de botão flutuante para edição global
 * Permite adicionar links externos relevantes à página atual
 */
export function GlobalEditButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState<ExternalLink[]>(() => {
    const saved = localStorage.getItem("global-external-links");
    return saved ? JSON.parse(saved) : [];
  });

  const saveLinks = (newLinks: ExternalLink[]) => {
    setLinks(newLinks);
    localStorage.setItem("global-external-links", JSON.stringify(newLinks));
  };

  const handleAddLink = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const url = formData.get("url") as string;

    if (!name || !url) return;

    const newLink: ExternalLink = {
      id: Date.now().toString(),
      name,
      url,
    };

    saveLinks([...links, newLink]);
    toast.success("Link adicionado!");
    e.currentTarget.reset();
  };

  const handleDeleteLink = (id: string) => {
    saveLinks(links.filter((link) => link.id !== id));
    toast.success("Link removido!");
  };

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        onClick={() => setIsOpen(true)}
      >
        <Edit3 className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Links Externos Rápidos</DialogTitle>
            <DialogDescription>
              Adicione links úteis para acesso rápido (Google Drive, Figma, Trello, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <form onSubmit={handleAddLink} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ex: Drive do Projeto"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    placeholder="https://..."
                    required
                  />
                </div>
              </div>
              <Button type="submit" size="sm" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Link
              </Button>
            </form>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Links Salvos</h4>
              {links.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum link adicionado ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm flex-1 hover:text-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="font-medium">{link.name}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {link.url}
                        </span>
                      </a>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteLink(link.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
