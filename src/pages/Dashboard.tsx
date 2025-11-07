import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Trophy, Upload, Calendar as CalendarIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState("");
  const [tasksStats, setTasksStats] = useState({ done: 0, total: 0 });
  const [urgentTasks, setUrgentTasks] = useState<any[]>([]);
  const [weeklyRanking, setWeeklyRanking] = useState<any[]>([]);
  const [recentEvidences, setRecentEvidences] = useState<any[]>([]);
  const [recentMissions, setRecentMissions] = useState<any[]>([]);

  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const targetDate = new Date("2025-12-16T00:00:00");
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown("Evento finalizado!");
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
          countdownInterval.current = null;
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
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
    const fetchData = async () => {
      // Fetch tasks stats
      const { data: tasks } = await supabase.from("tasks").select("status");
      if (tasks) {
        const done = tasks.filter((t) => t.status === "done").length;
        setTasksStats({ done, total: tasks.length });
      }

      // Fetch urgent tasks
      const { data: urgent } = await supabase
        .from("tasks")
        .select("*, responsible:responsible_id(*)")
        .eq("priority", "urgent")
        .neq("status", "done")
        .limit(5);
      setUrgentTasks(urgent || []);

      // Fetch ranking (all time completed tasks)
      const { data: completedTasksCount } = await supabase
        .from("tasks")
        .select("responsible_id, status")
        .eq("status", "done");

      if (completedTasksCount) {
        // Count completed tasks per user
        const tasksByUser = completedTasksCount.reduce((acc: any, task: any) => {
          if (task.responsible_id) {
            acc[task.responsible_id] = (acc[task.responsible_id] || 0) + 1;
          }
          return acc;
        }, {});

        // Get profiles for users with completed tasks
        const userIds = Object.keys(tasksByUser);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", userIds);

          if (profiles) {
            const ranked = profiles
              .map((profile) => ({
                ...profile,
                completedTasks: tasksByUser[profile.id] || 0,
              }))
              .sort((a, b) => b.completedTasks - a.completedTasks)
              .slice(0, 3);
            
            setWeeklyRanking(ranked);
          }
        } else {
          setWeeklyRanking([]);
        }
      }

      // Fetch recent evidences
      const { data: evidences } = await supabase
        .from("evidences")
        .select("*, creator:created_by(*)")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentEvidences(evidences || []);

      // Fetch recent mission runs
      const { data: missions } = await supabase
        .from("mission_runs")
        .select("*, executor:executed_by(*)")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentMissions(missions || []);
    };

    fetchData();

    // Setup realtime subscriptions for auto-refresh
    const tasksChannel = supabase
      .channel('dashboard-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchData)
      .subscribe();

    const evidencesChannel = supabase
      .channel('dashboard-evidences')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evidences' }, fetchData)
      .subscribe();

    const missionsChannel = supabase
      .channel('dashboard-missions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_runs' }, fetchData)
      .subscribe();

    // Fallback polling every 10 seconds
    const pollInterval = setInterval(fetchData, 10000);

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(evidencesChannel);
      supabase.removeChannel(missionsChannel);
      clearInterval(pollInterval);
    };
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard - System GEARS</h1>
          <p className="text-muted-foreground">Visão geral do progresso da equipe</p>
        </div>

        {/* Countdown Card */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Contagem Regressiva
            </CardTitle>
            <CardDescription>Tempo até 16/12/2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{countdown}</div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Metas Concluídas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasksStats.done}</div>
              <Progress value={(tasksStats.done / tasksStats.total) * 100} className="mt-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {tasksStats.done} de {tasksStats.total} metas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tarefas Urgentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{urgentTasks.length}</div>
              <p className="mt-2 text-xs text-muted-foreground">Requerem atenção imediata</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Upload Rápido</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate("/evidences")}
              >
                <Upload className="mr-2 h-4 w-4" />
                Nova Evidência
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Ranking Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-secondary" />
                <span className="text-sm font-medium">
                  {weeklyRanking[0]?.full_name || "Nenhum dado"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Urgent Tasks */}
        {urgentTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Tarefas Urgentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {urgentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.responsible?.full_name || "Sem responsável"}
                      </p>
                    </div>
                    {task.deadline && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(task.deadline), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Two Column Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Weekly Ranking */}
          <Card>
            <CardHeader>
              <CardTitle>Top 3 - Metas Concluídas</CardTitle>
              <CardDescription>Membros com mais metas concluídas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyRanking.length > 0 ? (
                  weeklyRanking.map((profile, index) => (
                    <div key={profile.id} className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                          index === 0
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{profile.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.completedTasks} {profile.completedTasks === 1 ? "meta" : "metas"} concluída{profile.completedTasks === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma meta concluída ainda
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Evidences */}
          <Card>
            <CardHeader>
              <CardTitle>Últimas Evidências</CardTitle>
              <CardDescription>Enviadas recentemente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEvidences.map((evidence) => (
                  <div key={evidence.id} className="border-b border-border pb-2 last:border-0">
                    <p className="font-medium">{evidence.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Por {evidence.creator?.full_name} •{" "}
                      {formatDistanceToNow(new Date(evidence.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                ))}
                {recentEvidences.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma evidência ainda</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Mission Runs */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Execuções de Missões</CardTitle>
            <CardDescription>Histórico de performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium">{mission.mission_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {mission.executor?.full_name} • {mission.mission_points} pontos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {mission.execution_time_seconds.toFixed(1)}s
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ideal: {mission.ideal_time_seconds.toFixed(1)}s
                    </p>
                  </div>
                </div>
              ))}
              {recentMissions.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma missão registrada ainda</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
