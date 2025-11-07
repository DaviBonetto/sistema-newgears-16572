import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TimelineTV() {
  const [events, setEvents] = useState<any[]>([]);
  const [countdown, setCountdown] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const targetDate = new Date("2025-12-16T00:00:00");
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown("🏆 DIA DO CAMPEONATO!");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      setCountdown(`${days} DIAS ${hours}H`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (events.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [events.length]);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("timeline_events")
      .select("*")
      .order("event_date", { ascending: true });
    
    setEvents(data || []);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "text-accent",
      in_progress: "text-primary",
      delayed: "text-destructive",
      pending: "text-muted-foreground",
    };
    return colors[status] || colors.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: "✅ CONCLUÍDO",
      in_progress: "🕓 EM ANDAMENTO",
      delayed: "❗ ATRASADO",
      pending: "📌 PENDENTE",
    };
    return labels[status] || labels.pending;
  };

  const completedEvents = events.filter((e) => e.status === "completed").length;
  const inProgressEvents = events.filter((e) => e.status === "in_progress").length;
  const upcomingEvents = events
    .filter((e) => new Date(e.event_date) > new Date() && e.status === "pending")
    .slice(0, 3);

  const currentEvent = events[currentIndex];

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, letterSpacing: '-0.07em' }}>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <Link to="/timeline">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">Voltar</span>
            </button>
          </Link>
          <h1 className="text-4xl font-bold">LINHA DO TEMPO GEARS</h1>
          <div className="w-24" />
        </div>

        {/* Countdown */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 p-8 text-center border-2 border-primary">
          <p className="text-sm text-muted-foreground mb-2">CONTAGEM REGRESSIVA PARA O CAMPEONATO</p>
          <p className="text-6xl font-bold text-primary tracking-tight">{countdown}</p>
          <p className="text-lg text-muted-foreground mt-2">16 DE DEZEMBRO DE 2025</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-xl bg-accent/10 p-6 text-center border border-accent/30">
            <p className="text-5xl font-bold text-accent mb-2">{completedEvents}</p>
            <p className="text-sm text-muted-foreground">EVENTOS CONCLUÍDOS</p>
          </div>
          <div className="rounded-xl bg-primary/10 p-6 text-center border border-primary/30">
            <p className="text-5xl font-bold text-primary mb-2">{inProgressEvents}</p>
            <p className="text-sm text-muted-foreground">EM ANDAMENTO</p>
          </div>
          <div className="rounded-xl bg-muted p-6 text-center border border-border">
            <p className="text-5xl font-bold mb-2">{events.length}</p>
            <p className="text-sm text-muted-foreground">TOTAL DE EVENTOS</p>
          </div>
        </div>

        {/* Current Event */}
        {currentEvent && (
          <div className="rounded-2xl bg-card border-2 border-primary p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className={`text-xl font-bold ${getStatusColor(currentEvent.status)}`}>
                  {getStatusLabel(currentEvent.status)}
                </p>
                <h2 className="text-4xl font-bold">{currentEvent.title}</h2>
                <p className="text-2xl text-primary font-bold">
                  {format(new Date(currentEvent.event_date), "dd/MM/yyyy", { locale: ptBR })}
                  {currentEvent.end_date && ` - ${format(new Date(currentEvent.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-2">PROGRESSO</p>
                <p className="text-6xl font-bold text-primary">{currentEvent.progress}%</p>
              </div>
            </div>
            
            {currentEvent.description && (
              <p className="text-lg text-muted-foreground border-t border-border pt-4">
                {currentEvent.description}
              </p>
            )}

            <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${currentEvent.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">PRÓXIMOS EVENTOS</h2>
            <div className="grid gap-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-xl bg-card border border-border p-6"
                >
                  <div>
                    <p className="text-xl font-bold mb-1">{event.title}</p>
                    <p className="text-muted-foreground">{event.description}</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {format(new Date(event.event_date), "dd/MM", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Atualização automática a cada 30 segundos • Eventos rotacionam a cada 8 segundos
          </p>
        </div>
      </div>
    </div>
  );
}
