import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trophy, Clock, Target, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TVMode() {
  const [countdown, setCountdown] = useState("");
  const [topContributors, setTopContributors] = useState<any[]>([]);
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [avgMissionTime, setAvgMissionTime] = useState<number>(0);
  const [urgentTasks, setUrgentTasks] = useState<any[]>([]);
  const [currentCard, setCurrentCard] = useState(0);

  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const dataInterval = useRef<NodeJS.Timeout | null>(null);
  const cardInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const targetDate = new Date("2025-12-16T00:00:00");

    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown("🏆 DIA DO CAMPEONATO!");
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
          countdownInterval.current = null;
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      setCountdown(`${days} DIAS ${hours}H`);
    };

    updateCountdown();
    countdownInterval.current = setInterval(updateCountdown, 1000);
    
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
    };
  }, []);

  useEffect(() => {
    fetchData();
    dataInterval.current = setInterval(fetchData, 30000);
    
    return () => {
      if (dataInterval.current) {
        clearInterval(dataInterval.current);
        dataInterval.current = null;
      }
    };
  }, []);

  useEffect(() => {
    cardInterval.current = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % 4);
    }, 12000);
    
    return () => {
      if (cardInterval.current) {
        clearInterval(cardInterval.current);
        cardInterval.current = null;
      }
    };
  }, []);

  const fetchData = async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [profilesData, nextEventData, missionsData, tasksData] = await Promise.all([
      supabase
        .from("profiles")
        .select("*, tasks:tasks(status, updated_at), evidences:evidences(created_at)")
        .limit(3),
      supabase
        .from("calendar_events")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(1)
        .single(),
      supabase.from("mission_runs").select("execution_time_seconds"),
      supabase
        .from("tasks")
        .select("*, responsible:responsible_id(*)")
        .eq("priority", "urgent")
        .neq("status", "done")
        .limit(5),
    ]);

    if (profilesData.data) {
      const ranked = profilesData.data
        .map((profile) => ({
          ...profile,
          score:
            (profile.tasks?.filter(
              (t: any) =>
                t.status === "done" && new Date(t.updated_at) >= oneWeekAgo
            ).length || 0) +
            (profile.evidences?.filter(
              (e: any) => new Date(e.created_at) >= oneWeekAgo
            ).length || 0),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      setTopContributors(ranked);
    }

    if (nextEventData.data) {
      setNextEvent(nextEventData.data);
    }

    if (missionsData.data && missionsData.data.length > 0) {
      const avg =
        missionsData.data.reduce(
          (sum, m) => sum + Number(m.execution_time_seconds),
          0
        ) / missionsData.data.length;
      setAvgMissionTime(avg);
    }

    if (tasksData.data) {
      setUrgentTasks(tasksData.data);
    }
  };

  const cards = [
    {
      title: "TOP 3 DA SEMANA",
      icon: Trophy,
      content: (
        <div className="space-y-4">
          {topContributors.map((contributor, index) => (
            <div
              key={contributor.id}
              className="flex items-center gap-4 rounded-lg bg-background/50 p-4"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold ${
                  index === 0
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold">{contributor.full_name}</p>
                <p className="text-muted-foreground">
                  {contributor.score} contribuições esta semana
                </p>
              </div>
            </div>
          ))}
          {topContributors.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma contribuição esta semana
            </p>
          )}
        </div>
      ),
    },
    {
      title: "PRÓXIMO EVENTO",
      icon: Clock,
      content: nextEvent ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-primary/10 p-6 border border-primary/30">
            <h3 className="text-3xl font-bold mb-2">{nextEvent.title}</h3>
            <p className="text-xl text-muted-foreground mb-4">
              {nextEvent.description}
            </p>
            <p className="text-2xl font-bold text-primary">
              {formatDistanceToNow(new Date(nextEvent.event_date), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          Nenhum evento próximo agendado
        </p>
      ),
    },
    {
      title: "TEMPO MÉDIO DE MISSÕES",
      icon: Target,
      content: (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-7xl font-bold text-primary mb-4">
              {avgMissionTime > 0 ? avgMissionTime.toFixed(1) : "--"}
            </p>
            <p className="text-2xl text-muted-foreground">segundos</p>
          </div>
        </div>
      ),
    },
    {
      title: "TAREFAS URGENTES",
      icon: AlertCircle,
      content: (
        <div className="space-y-3">
          {urgentTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-lg border border-destructive/20 bg-destructive/5 p-4"
            >
              <p className="text-xl font-bold mb-1">{task.title}</p>
              <p className="text-muted-foreground">
                {task.responsible?.full_name || "Sem responsável"}
              </p>
            </div>
          ))}
          {urgentTasks.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma tarefa urgente no momento
            </p>
          )}
        </div>
      ),
    },
  ];

  const CurrentCardComponent = cards[currentCard];
  const IconComponent = CurrentCardComponent.icon;

  return (
    <div
      className="min-h-screen bg-background text-foreground p-8"
      style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 600,
        letterSpacing: "-0.07em",
      }}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <Link to="/dashboard">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">Voltar</span>
            </button>
          </Link>
          <h1 className="text-4xl font-bold">SYSTEM GEARS - MODO TV</h1>
          <div className="w-24" />
        </div>

        {/* Countdown */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 p-8 text-center border-2 border-primary">
          <p className="text-sm text-muted-foreground mb-2">
            CONTAGEM REGRESSIVA PARA O CAMPEONATO
          </p>
          <p className="text-6xl font-bold text-primary tracking-tight">
            {countdown}
          </p>
          <p className="text-lg text-muted-foreground mt-2">
            16 DE DEZEMBRO DE 2025
          </p>
        </div>

        {/* Rotating Card */}
        <Card className="border-2 border-primary">
          <CardContent className="p-8">
            <div className="mb-6 flex items-center gap-3">
              <IconComponent className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">
                {CurrentCardComponent.title}
              </h2>
            </div>
            {CurrentCardComponent.content}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Atualização automática a cada 30 segundos • Cards rotacionam a cada
            12 segundos
          </p>
        </div>
      </div>
    </div>
  );
}
