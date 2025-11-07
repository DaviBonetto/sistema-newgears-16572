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
import { Plus, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Calendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("calendar_events")
      .select("*, creator:created_by(*)")
      .order("event_date", { ascending: true });
    setEvents(data || []);
  };

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);

    const { error } = await supabase.from("calendar_events").insert({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      event_date: new Date(formData.get("event_date") as string).toISOString(),
      created_by: user.id,
    });

    if (error) {
      toast.error("Erro ao criar evento");
    } else {
      toast.success("Evento criado com sucesso!");
      setIsCreateOpen(false);
      fetchEvents();
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir evento");
    } else {
      toast.success("Evento excluído!");
      fetchEvents();
    }
  };

  const upcomingEvents = events.filter((e) => new Date(e.event_date) >= new Date());
  const pastEvents = events.filter((e) => new Date(e.event_date) < new Date());

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calendário</h1>
            <p className="text-muted-foreground">Treinos e atividades do time</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Evento</DialogTitle>
                <DialogDescription>
                  Adicione um treino ou atividade ao calendário
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" name="title" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_date">Data e Hora</Label>
                  <Input id="event_date" name="event_date" type="datetime-local" required />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Criar Evento
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Card key={event.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold">{event.title}</p>
                          {event.description && (
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          )}
                          <p className="mt-2 text-sm font-medium text-primary">
                            {format(new Date(event.event_date), "PPP 'às' p", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Criado por {event.creator?.full_name}
                          </p>
                        </div>
                        {user?.id === event.created_by && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {upcomingEvents.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Nenhum evento agendado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                Eventos Passados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastEvents.slice(0, 5).map((event) => (
                  <Card key={event.id} className="border-l-4 border-l-muted">
                    <CardContent className="p-4 opacity-75">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.event_date), "PPP", { locale: ptBR })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {pastEvents.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Nenhum evento passado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
