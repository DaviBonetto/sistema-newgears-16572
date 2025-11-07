import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, StickyNote, Trash2, Edit2, Save, Paperclip, X, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  attachments?: { name: string; url: string; size: number }[];
}

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar anotações");
      return;
    }

    setNotes(data as Note[] || []);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<{ name: string; url: string; size: number }[]> => {
    if (!user || uploadedFiles.length === 0) return [];

    setUploading(true);
    const uploadedAttachments: { name: string; url: string; size: number }[] = [];

    for (const file of uploadedFiles) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("note-attachments")
        .upload(fileName, file);

      if (uploadError) {
        toast.error(`Erro ao enviar ${file.name}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("note-attachments")
        .getPublicUrl(fileName);

      uploadedAttachments.push({
        name: file.name,
        url: publicUrl,
        size: file.size,
      });
    }

    setUploading(false);
    return uploadedAttachments;
  };

  const handleSaveNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    
    // Upload files first
    const newAttachments = await uploadFiles();
    const existingAttachments = editingNote?.attachments || [];
    
    const noteData = {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      user_id: user.id,
      attachments: [...existingAttachments, ...newAttachments],
    };

    if (editingNote) {
      const { error } = await supabase
        .from("notes")
        .update(noteData)
        .eq("id", editingNote.id);

      if (error) {
        toast.error("Erro ao atualizar anotação");
      } else {
        toast.success("Anotação atualizada!");
        setIsDialogOpen(false);
        setEditingNote(null);
        setUploadedFiles([]);
        fetchNotes();
      }
    } else {
      const { error } = await supabase
        .from("notes")
        .insert(noteData);

      if (error) {
        toast.error("Erro ao criar anotação");
      } else {
        toast.success("Anotação criada!");
        setIsDialogOpen(false);
        setUploadedFiles([]);
        fetchNotes();
      }
    }
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteToDelete);

    if (error) {
      toast.error("Erro ao excluir anotação");
    } else {
      toast.success("Anotação excluída!");
      fetchNotes();
      if (selectedNote?.id === noteToDelete) {
        setSelectedNote(null);
      }
    }

    setDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Minhas Anotações</h1>
            <p className="text-muted-foreground">Guarde suas ideias e observações importantes</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingNote(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Anotação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingNote ? "Editar Anotação" : "Nova Anotação"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveNote} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingNote?.title}
                    placeholder="Digite o título da anotação"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo</Label>
                  <Textarea
                    id="content"
                    name="content"
                    defaultValue={editingNote?.content}
                    placeholder="Digite o conteúdo da anotação..."
                    rows={8}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attachments">Anexos</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="attachments"
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="flex-1"
                    />
                    <Button type="button" size="icon" variant="outline">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                        >
                          <span className="truncate">{file.name}</span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={uploading}>
                    <Save className="mr-2 h-4 w-4" />
                    {uploading ? "Enviando..." : editingNote ? "Atualizar" : "Criar"} Anotação
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingNote(null);
                      setUploadedFiles([]);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Notes List */}
          <div className="md:col-span-1 space-y-3">
            <h2 className="text-lg font-semibold">Todas as Anotações ({notes.length})</h2>
            {notes.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                <StickyNote className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>Nenhuma anotação ainda</p>
                <p className="text-sm mt-1">Crie sua primeira anotação!</p>
              </Card>
            ) : (
              notes.map((note) => (
                <Card
                  key={note.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedNote?.id === note.id ? "border-primary shadow-md" : ""
                  }`}
                  onClick={() => setSelectedNote(note)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm line-clamp-1">{note.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.updated_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {note.content}
                    </p>
                    {note.attachments && note.attachments.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        {note.attachments.length} arquivo(s)
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Note Detail */}
          <div className="md:col-span-2">
            {selectedNote ? (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl">{selectedNote.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Atualizado {formatDistanceToNow(new Date(selectedNote.updated_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setEditingNote(selectedNote);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => {
                        setNoteToDelete(selectedNote.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap mb-4">{selectedNote.content}</div>
                  
                  {selectedNote.attachments && selectedNote.attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h3 className="font-semibold text-sm">Anexos</h3>
                      <div className="space-y-2">
                        {selectedNote.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded border hover:bg-muted transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="text-sm flex-1 truncate">{attachment.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {(attachment.size / 1024).toFixed(0)} KB
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="p-12 text-center text-muted-foreground">
                <StickyNote className="mx-auto h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg">Selecione uma anotação para visualizar</p>
                <p className="text-sm mt-2">Ou crie uma nova anotação clicando no botão acima</p>
              </Card>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta anotação? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteNote} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
