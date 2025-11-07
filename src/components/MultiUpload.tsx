import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Download, Link as LinkIcon, ExternalLink, RefreshCw, AlertCircle, FileImage, FileVideo, FileText, File } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
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

interface MultiUploadProps {
  bucket: string;
  attachments: Attachment[];
  onUpdate: (attachments: Attachment[]) => void;
  userId: string;
  maxFileSize?: number; // em bytes, default 20MB
  acceptedTypes?: string[];
}

const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const DEFAULT_ACCEPTED_TYPES = [
  'image/*',
  'video/*',
  '.pdf',
  '.doc',
  '.docx',
  '.csv',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv'
];

export function MultiUpload({ 
  bucket, 
  attachments, 
  onUpdate, 
  userId,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES
}: MultiUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [linkName, setLinkName] = useState("");
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Verificar tamanho
    if (file.size > maxFileSize) {
      return { 
        valid: false, 
        error: `Arquivo ${file.name} excede o limite de ${maxFileSize / (1024 * 1024)}MB` 
      };
    }

    // Verificar tipo MIME
    const fileType = file.type;
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileExtension === type.substring(1);
      }
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.replace('/*', ''));
      }
      return fileType === type;
    });

    if (!isValidType) {
      return { 
        valid: false, 
        error: `Tipo de arquivo não permitido: ${file.name}` 
      };
    }

    return { valid: true };
  };

  const uploadFile = async (file: File, attachmentId: string): Promise<Attachment | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload com progress tracking
      const { error, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        id: attachmentId,
        url: publicUrl,
        name: file.name,
        type: file.type,
        size: file.size,
        status: 'completed' as const,
        progress: 100,
        storagePath: filePath
      };
    } catch (error: any) {
      console.error(`Erro ao fazer upload de ${file.name}:`, error);
      return {
        id: attachmentId,
        url: '',
        name: file.name,
        type: file.type,
        size: file.size,
        status: 'error' as const,
        progress: 0,
        error: error.message || 'Erro ao fazer upload'
      };
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!userId) {
      toast.error("Usuário não autenticado");
      return;
    }

    setUploading(true);
    
    // Criar array de attachments iniciais
    const newAttachments: Attachment[] = [];
    const filesToUpload: { file: File; attachmentId: string }[] = [];

    // Validar todos arquivos primeiro
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file);
      const attachmentId = `file-${Date.now()}-${i}`;

      if (!validation.valid) {
        newAttachments.push({
          id: attachmentId,
          url: '',
          name: file.name,
          type: file.type,
          size: file.size,
          status: 'error',
          progress: 0,
          error: validation.error
        });
      } else {
        newAttachments.push({
          id: attachmentId,
          url: '',
          name: file.name,
          type: file.type,
          size: file.size,
          status: 'pending',
          progress: 0
        });
        filesToUpload.push({ file, attachmentId });
      }
    }

    // Adicionar attachments pendentes à lista
    onUpdate([...attachments, ...newAttachments]);

    // Upload sequencial com controle
    let completedUploads = 0;
    const totalUploads = filesToUpload.length;

    for (const { file, attachmentId } of filesToUpload) {
      // Atualizar status para uploading
      const uploadingAttachment = newAttachments.find(a => a.id === attachmentId);
      if (uploadingAttachment) {
        uploadingAttachment.status = 'uploading';
        uploadingAttachment.progress = 0;
        onUpdate([...attachments, ...newAttachments]);
      }

      const uploadedAttachment = await uploadFile(file, attachmentId);
      
      if (uploadedAttachment) {
        // Substituir o attachment temporário pelo completo
        const index = newAttachments.findIndex(a => a.id === attachmentId);
        if (index !== -1) {
          newAttachments[index] = uploadedAttachment;
        }
        completedUploads++;
        
        // Atualizar progresso geral
        setOverallProgress(Math.round((completedUploads / totalUploads) * 100));
      }

      // Atualizar lista final
      onUpdate([...attachments, ...newAttachments]);
    }

    setUploading(false);
    setOverallProgress(0);

    // Notificar resultado
    const successfulUploads = newAttachments.filter(a => a.status === 'completed').length;
    const failedUploads = newAttachments.filter(a => a.status === 'error').length;

    if (successfulUploads > 0) {
      toast.success(`${successfulUploads} arquivo(s) enviado(s) com sucesso!`);
    }
    if (failedUploads > 0) {
      toast.error(`${failedUploads} arquivo(s) falharam. Clique em retry para tentar novamente.`);
    }
  };

  const handleRetryUpload = async (attachment: Attachment) => {
    if (!attachment.error) return;

    // Recriar o file input para selecionar o mesmo arquivo
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptedTypes.join(',');
    input.onchange = async (e: any) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.name === attachment.name && file.size === attachment.size) {
          // Atualizar status para uploading
          const updatedAttachments = attachments.map(a => 
            a.id === attachment.id 
              ? { ...a, status: 'uploading' as const, progress: 0, error: undefined }
              : a
          );
          onUpdate(updatedAttachments);

          const uploadedAttachment = await uploadFile(file, attachment.id);
          if (uploadedAttachment) {
            const finalAttachments = updatedAttachments.map(a => 
              a.id === attachment.id ? uploadedAttachment : a
            );
            onUpdate(finalAttachments);
            toast.success(`${attachment.name} enviado com sucesso!`);
          }
        } else {
          toast.error('Por favor, selecione o mesmo arquivo novamente');
        }
      }
    };
    input.click();
  };

  const handleAddLink = () => {
    if (!newLink) {
      toast.error("Digite uma URL válida");
      return;
    }

    const linkObj: Attachment = {
      id: `link-${Date.now()}`,
      url: newLink,
      name: linkName || newLink,
      type: "link",
      size: 0,
      status: 'completed',
      progress: 100
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

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="h-4 w-4" />;
    if (type.startsWith('video/')) return <FileVideo className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const totalProgress = attachments.reduce((acc, att) => {
    if (att.status === 'uploading') return acc + att.progress;
    if (att.status === 'completed') return acc + 100;
    return acc;
  }, 0) / Math.max(attachments.filter(a => a.status !== 'link').length, 1);

  return (
    <div className="space-y-4">
      {/* Progresso geral */}
      {uploading && attachments.some(a => a.status === 'uploading') && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Enviando arquivos...</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>
      )}

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
            input.accept = acceptedTypes.join(',');
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
      <div className="grid gap-3 sm:grid-cols-2">
        {attachments.map((att, index) => (
          <div
            key={att.id}
            className={cn(
              "group relative overflow-hidden rounded-lg border bg-card",
              att.status === 'error' && "border-destructive",
              att.status === 'uploading' && "border-primary"
            )}
          >
            {/* Status do upload */}
            {att.status === 'uploading' && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                <div className="text-center space-y-2">
                  <div className="text-sm font-medium">Enviando...</div>
                  <Progress value={att.progress} className="h-2 w-24" />
                </div>
              </div>
            )}

            {att.status === 'error' && (
              <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center z-10">
                <div className="text-center space-y-2 p-4">
                  <AlertCircle className="h-6 w-6 text-destructive mx-auto" />
                  <div className="text-sm text-destructive font-medium">Erro</div>
                  <div className="text-xs text-destructive">{att.error}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetryUpload(att)}
                    className="text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            )}

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
                  <p className="text-xs text-white/80">
                    {(att.size / 1024 / 1024).toFixed(1)}MB
                  </p>
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
                {getFileIcon(att.type)}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm">{att.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(att.size / 1024 / 1024).toFixed(1)}MB
                  </p>
                </div>
              </div>
            )}

            <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {att.type !== "link" && att.status === 'completed' && (
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
                type="button"
                onClick={() => handleRemove(index)}
                className="rounded-full bg-background p-1.5 shadow-md hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {attachments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum arquivo anexado ainda</p>
          <p className="text-sm">Clique em "Upload Arquivos" para começar</p>
        </div>
      )}
    </div>
  );
}
