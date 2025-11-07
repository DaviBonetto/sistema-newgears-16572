import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, Upload, MessageSquare, Edit, Trash2, ChevronRight, Tv } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface TimelineEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  status: string;
  responsible_ids: string[] | null;
  progress: number;
  attachments: any;
  comments: any;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export default function Timeline() {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [eventsData, profilesData] = await Promise.all([
      supabase.from("timeline_events").select("*").order("event_date", { ascending: true }),
      supabase.from("profiles").select("*"),
    ]);

    setEvents(eventsData.data || []);
    setProfiles(profilesData.data || []);
    setLoading(false);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const eventData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      event_date: formData.get("event_date") as string,
      end_date: formData.get("end_date") as string || null,
      status: formData.get("status") as string,
      progress: parseInt(formData.get("progress") as string) || 0,
      responsible_ids: formData.get("responsible_ids") ? [formData.get("responsible_ids") as string] : null,
    };

    if (editingEvent) {
      const { error } = await supabase
        .from("timeline_events")
        .update(eventData)
        .eq("id", editingEvent.id);

      if (error) {
        toast.error("Erro ao atualizar evento");
      } else {
        toast.success("Evento atualizado!");
        setIsDialogOpen(false);
        setEditingEvent(null);
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from("timeline_events")
        .insert({ ...eventData, created_by: user.id });

      if (error) {
        toast.error("Erro ao criar evento");
      } else {
        toast.success("Evento criado!");
        setIsDialogOpen(false);
        fetchData();
      }
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;

    const { error } = await supabase
      .from("timeline_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      toast.error("Erro ao excluir evento");
    } else {
      toast.success("Evento excluído!");
      fetchData();
    }
  };

  const handleFileUpload = async (eventId: string, file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${eventId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("timeline-attachments")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Erro ao fazer upload");
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("timeline-attachments")
      .getPublicUrl(filePath);

    const event = events.find((e) => e.id === eventId);
    const attachments = event?.attachments || [];
    attachments.push({ url: publicUrl, name: file.name });

    const { error } = await supabase
      .from("timeline_events")
      .update({ attachments })
      .eq("id", eventId);

    if (error) {
      toast.error("Erro ao salvar anexo");
    } else {
      toast.success("Arquivo anexado!");
      fetchData();
    }
  };

  const handleAddComment = async (eventId: string, comment: string) => {
    if (!user) return;

    const event = events.find((e) => e.id === eventId);
    const comments = event?.comments || [];
    comments.push({
      text: comment,
      user_id: user.id,
      created_at: new Date().toISOString(),
    });

    const { error } = await supabase
      .from("timeline_events")
      .update({ comments })
      .eq("id", eventId);

    if (error) {
      toast.error("Erro ao adicionar comentário");
    } else {
      toast.success("Comentário adicionado!");
      fetchData();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      completed: { variant: "default", label: "✅ Concluído" },
      in_progress: { variant: "secondary", label: "🕓 Em andamento" },
      delayed: { variant: "destructive", label: "❗Atrasado" },
      pending: { variant: "outline", label: "📌 Pendente" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-accent";
    if (progress >= 50) return "bg-primary";
    return "bg-secondary";
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Linha do Tempo GEARS</h1>
            <p className="text-muted-foreground">Planejamento até 16/12/2025</p>
          </div>
          <div className="flex gap-2">
            <Link to="/timeline-tv">
              <Button variant="outline">
                <Tv className="mr-2 h-4 w-4" />
                Modo TV
              </Button>
            </Link>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingEvent(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingEvent ? "Editar Evento" : "Novo Evento"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={editingEvent?.title}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingEvent?.description || ""}
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="event_date">Data de Início</Label>
                      <Input
                        id="event_date"
                        name="event_date"
                        type="date"
                        defaultValue={editingEvent?.event_date}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_date">Data de Término</Label>
                      <Input
                        id="end_date"
                        name="end_date"
                        type="date"
                        defaultValue={editingEvent?.end_date || ""}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue={editingEvent?.status || "pending"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">📌 Pendente</SelectItem>
                          <SelectItem value="in_progress">🕓 Em andamento</SelectItem>
                          <SelectItem value="completed">✅ Concluído</SelectItem>
                          <SelectItem value="delayed">❗Atrasado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="progress">Progresso (%)</Label>
                      <Input
                        id="progress"
                        name="progress"
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={editingEvent?.progress || 0}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsible_ids">Responsável</Label>
                    <Select
                      name="responsible_ids"
                      defaultValue={editingEvent?.responsible_ids?.[0]}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingEvent ? "Atualizar" : "Criar"} Evento
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingEvent(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-4">
          {events.map((event) => {
            const isExpanded = expandedEventId === event.id;
            const responsible = profiles.find((p) => event.responsible_ids?.includes(p.id));

            return (
              <Card
                key={event.id}
                className="overflow-hidden border-l-4 border-l-primary transition-all hover:shadow-md"
              >
                <CardContent className="p-0">
                  <div
                    className="flex cursor-pointer items-center justify-between p-6"
                    onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold">{event.title}</h3>
                        {getStatusBadge(event.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-semibold text-primary">
                          {format(new Date(event.event_date), "dd/MM/yyyy", { locale: ptBR })}
                          {event.end_date && ` - ${format(new Date(event.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
                        </span>
                        {responsible && (
                          <span className="text-muted-foreground">
                            👤 {responsible.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-6 w-6 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-6 space-y-4">
                      {event.description && (
                        <div>
                          <p className="text-sm font-medium mb-1">Descrição:</p>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Progresso: {event.progress}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                          <div
                            className={`h-full transition-all ${getProgressColor(event.progress)}`}
                            style={{ width: `${event.progress}%` }}
                          />
                        </div>
                      </div>

                      {event.attachments && event.attachments.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Anexos:</p>
                          <div className="space-y-1">
                            {event.attachments.map((att: any, idx: number) => (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-sm text-primary hover:underline"
                              >
                                📎 {att.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {event.comments && event.comments.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Comentários:</p>
                          <div className="space-y-2">
                            {event.comments.map((comment: any, idx: number) => {
                              const commentUser = profiles.find((p) => p.id === comment.user_id);
                              return (
                                <div key={idx} className="rounded-lg bg-background p-3 text-sm">
                                  <p className="font-medium">{commentUser?.full_name}</p>
                                  <p className="text-muted-foreground">{comment.text}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEvent(event);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const input = document.createElement("input");
                            input.type = "file";
                            input.onchange = (e: any) => {
                              const file = e.target.files[0];
                              if (file) handleFileUpload(event.id, file);
                            };
                            input.click();
                          }}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Anexar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const comment = prompt("Digite seu comentário:");
                            if (comment) handleAddComment(event.id, comment);
                          }}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Comentar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(event.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {events.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum evento na linha do tempo ainda</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
