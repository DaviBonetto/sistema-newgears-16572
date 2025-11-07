import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy, Clock, Target, AlertCircle, TrendingUp, Users, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TVMode() {
  const [countdown, setCountdown] = useState("");
  const [topContributors, setTopContributors] = useState<any[]>([]);
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [avgMissionTime, setAvgMissionTime] = useState<number>(0);
  const [urgentTasks, setUrgentTasks] = useState<any[]>([]);
  const [taskProgress, setTaskProgress] = useState({ done: 0, total: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
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
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setCountdown(`${days}D ${hours}H ${minutes}M`);
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
    dataInterval.current = setInterval(fetchData, 20000);
    
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
    }, 10000);
    
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

    const [profilesData, nextEventData, missionsData, tasksData, allTasksData, activityData] = await Promise.all([
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
      supabase.from("tasks").select("status"),
      supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
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

    if (allTasksData.data) {
      const done = allTasksData.data.filter((t) => t.status === "done").length;
      setTaskProgress({ done, total: allTasksData.data.length });
    }

    if (activityData.data) {
      setRecentActivity(activityData.data);
    }
  };

  const progressPercentage = taskProgress.total > 0
    ? (taskProgress.done / taskProgress.total) * 100
    : 0;

  const cards = [
    {
      title: "TOP 3 DA SEMANA",
      icon: Trophy,
      gradient: "from-secondary/20 to-secondary/5",
      content: (
        <div className="space-y-4">
          {topContributors.map((contributor, index) => (
            <div
              key={contributor.id}
              className="flex items-center gap-4 rounded-xl bg-background/80 backdrop-blur p-4 border border-primary/20 hover:border-primary/40 transition-all"
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold shadow-lg ${
                  index === 0
                    ? "bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground animate-pulse"
                    : index === 1
                    ? "bg-gradient-to-br from-primary/60 to-primary/40 text-primary-foreground"
                    : "bg-gradient-to-br from-muted to-muted/60 text-muted-foreground"
                }`}
              >
                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">{contributor.full_name}</p>
                <p className="text-lg text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-secondary" />
                  {contributor.score} contribuições
                </p>
              </div>
            </div>
          ))}
          {topContributors.length === 0 && (
            <p className="text-center text-muted-foreground py-12 text-xl">
              Nenhuma contribuição esta semana
            </p>
          )}
        </div>
      ),
    },
    {
      title: "PRÓXIMO EVENTO",
      icon: Clock,
      gradient: "from-primary/20 to-primary/5",
      content: nextEvent ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-8 border-2 border-primary/30 shadow-xl">
            <h3 className="text-4xl font-bold mb-3 text-primary">{nextEvent.title}</h3>
            {nextEvent.description && (
              <p className="text-xl text-muted-foreground mb-6">
                {nextEvent.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-3xl font-bold text-primary">
              <Clock className="h-8 w-8" />
              {formatDistanceToNow(new Date(nextEvent.event_date), {
                addSuffix: true,
                locale: ptBR,
              })}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12 text-xl">
          Nenhum evento próximo agendado
        </p>
      ),
    },
    {
      title: "TAREFAS URGENTES",
      icon: AlertCircle,
      gradient: "from-destructive/20 to-destructive/5",
      content: (
        <div className="space-y-3">
          {urgentTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border-2 border-destructive/30 bg-destructive/10 p-5 hover:bg-destructive/15 transition-all"
            >
              <p className="text-2xl font-bold mb-2 text-destructive">{task.title}</p>
              <p className="text-lg text-muted-foreground flex items-center gap-2">
                <Users className="h-5 w-5" />
                {task.responsible?.full_name || "Sem responsável"}
              </p>
            </div>
          ))}
          {urgentTasks.length === 0 && (
            <p className="text-center text-muted-foreground py-12 text-xl">
              ✅ Nenhuma tarefa urgente no momento
            </p>
          )}
        </div>
      ),
    },
    {
      title: "PROGRESSO DE TAREFAS",
      icon: TrendingUp,
      gradient: "from-green-500/20 to-green-500/5",
      content: (
        <div className="space-y-6 py-8">
          <div className="text-center">
            <p className="text-7xl font-bold text-primary mb-2">
              {taskProgress.done}/{taskProgress.total}
            </p>
            <p className="text-2xl text-muted-foreground">tarefas concluídas</p>
          </div>
          <div className="space-y-3 px-8">
            <Progress value={progressPercentage} className="h-6" />
            <p className="text-center text-3xl font-bold text-primary">
              {progressPercentage.toFixed(1)}% completo
            </p>
          </div>
        </div>
      ),
    },
  ];

  const CurrentCardComponent = cards[currentCard];
  const IconComponent = CurrentCardComponent.icon;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 text-foreground p-8"
      style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 600,
        letterSpacing: "-0.05em",
      }}
    >
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-primary/30 pb-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all hover:scale-105">
            <ArrowLeft className="h-6 w-6" />
            <span className="text-lg">Voltar para o Dashboard</span>
          </Link>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            SYSTEM GEARS - MODO TV
          </h1>
          <div className="w-32" />
        </div>

        {/* Countdown */}
        <div className="rounded-3xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 p-10 text-center border-4 border-primary shadow-2xl">
          <p className="text-lg text-muted-foreground mb-3 uppercase tracking-wider">
            Contagem Regressiva para o Campeonato
          </p>
          <p className="text-8xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent tracking-tight mb-3 transition-all duration-500">
            {countdown}
          </p>
          <p className="text-2xl text-muted-foreground font-semibold">
            16 de Dezembro de 2025
          </p>
        </div>

        {/* Rotating Card */}
        <Card className={`border-4 border-primary shadow-2xl bg-gradient-to-br ${CurrentCardComponent.gradient} animate-scale-in`}>
          <CardContent className="p-10">
            <div className="mb-8 flex items-center gap-4">
              <div className="rounded-2xl bg-primary/20 p-4">
                <IconComponent className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-4xl font-bold">
                {CurrentCardComponent.title}
              </h2>
            </div>
            {CurrentCardComponent.content}
          </CardContent>
        </Card>

        {/* Footer with Activity Indicators */}
        <div className="border-t-2 border-primary/30 pt-6 space-y-4">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span>Ao vivo</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Atualiza a cada 20s</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>Cards trocam a cada 10s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
