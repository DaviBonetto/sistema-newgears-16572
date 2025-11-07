import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Download, Link as LinkIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Attachment {
  url: string;
  name: string;
  type: string;
}

interface MultiUploadProps {
  bucket: string;
  attachments: Attachment[];
  onUpdate: (attachments: Attachment[]) => void;
  userId: string;
}

export function MultiUpload({ bucket, attachments, onUpdate, userId }: MultiUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [linkName, setLinkName] = useState("");

  const handleFileUpload = async (files: FileList) => {
    if (!userId) return;

    setUploading(true);
    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}-${i}.${fileExt}`;

      const { error, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) {
        toast.error(`Erro ao enviar ${file.name}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      newAttachments.push({
        url: publicUrl,
        name: file.name,
        type: file.type,
      });
    }

    onUpdate([...attachments, ...newAttachments]);
    setUploading(false);
    toast.success(`${newAttachments.length} arquivo(s) enviado(s)!`);
  };

  const handleAddLink = () => {
    if (!newLink) {
      toast.error("Digite uma URL válida");
      return;
    }

    const linkObj: Attachment = {
      url: newLink,
      name: linkName || newLink,
      type: "link",
    };

    onUpdate([...attachments, linkObj]);
    setNewLink("");
    setLinkName("");
    toast.success("Link adicionado!");
  };

  const handleRemove = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    onUpdate(updated);
    toast.success("Anexo removido!");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.accept = "image/*,video/*,.pdf,.doc,.docx";
            input.onchange = (e: any) => {
              if (e.target.files) handleFileUpload(e.target.files);
            };
            input.click();
          }}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Enviando..." : "Upload Arquivos"}
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <LinkIcon className="mr-2 h-4 w-4" />
              Adicionar Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Link (opcional)</Label>
                <Input
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  placeholder="Drive, YouTube, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <Button onClick={handleAddLink} className="w-full">
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid de Anexos */}
      <div className="grid gap-2 sm:grid-cols-2">
        {attachments.map((att, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-lg border bg-card"
          >
            {att.type === "link" ? (
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 hover:bg-muted"
              >
                <ExternalLink className="h-4 w-4 text-primary" />
                <span className="flex-1 truncate text-sm">{att.name}</span>
              </a>
            ) : att.type.startsWith("image/") ? (
              <div className="relative">
                <img
                  src={att.url}
                  alt={att.name}
                  className="h-32 w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="truncate text-xs text-white">{att.name}</p>
                </div>
              </div>
            ) : att.type.startsWith("video/") ? (
              <video
                src={att.url}
                className="h-32 w-full object-cover"
                controls
              />
            ) : (
              <div className="flex items-center gap-2 p-3">
                <Download className="h-4 w-4 text-primary" />
                <span className="flex-1 truncate text-sm">{att.name}</span>
              </div>
            )}

            <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {att.type !== "link" && (
                <a
                  href={att.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-background p-1.5 shadow-md hover:bg-muted"
                >
                  <Download className="h-3 w-3" />
                </a>
              )}
              <button
                onClick={() => handleRemove(index)}
                className="rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-md hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
