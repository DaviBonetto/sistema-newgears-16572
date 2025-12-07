import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, CheckSquare, FileText, Brain, Users, GitBranch,
  Beaker, MessageSquare, RefreshCw, Calendar, Clock,
  Lightbulb, Bot, BookOpen, Trophy, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeMachineEvent, EventCategory } from "@/hooks/useTimeMachine";

interface MemberActivityProps {
  events: TimeMachineEvent[];
}

interface MemberStats {
  id: string;
  full_name: string;
  avatar_url: string | null;
  totalEvents: number;
  metasCompleted: number;
  tasksCompleted: number;
  evidencesCreated: number;
  testsRun: number;
  feedbacksGiven: number;
  events: TimeMachineEvent[];
  categoryCounts: Record<EventCategory, number>;
}

const categoryConfig: Record<EventCategory, { icon: React.ElementType; color: string; label: string }> = {
  meta: { icon: Target, color: "bg-blue-500", label: "Metas" },
  tarefa: { icon: CheckSquare, color: "bg-green-500", label: "Tarefas" },
  evidencia: { icon: FileText, color: "bg-purple-500", label: "Evidências" },
  brainstorming: { icon: Brain, color: "bg-yellow-500", label: "Brainstorming" },
  reuniao: { icon: Users, color: "bg-pink-500", label: "Reuniões" },
  decisao: { icon: GitBranch, color: "bg-orange-500", label: "Decisões" },
  prototipo: { icon: Lightbulb, color: "bg-cyan-500", label: "Protótipos" },
  teste: { icon: Beaker, color: "bg-red-500", label: "Testes" },
  feedback: { icon: MessageSquare, color: "bg-indigo-500", label: "Feedbacks" },
  iteracao: { icon: RefreshCw, color: "bg-teal-500", label: "Iterações" },
  comentario: { icon: MessageSquare, color: "bg-gray-500", label: "Comentários" },
  cronograma: { icon: Calendar, color: "bg-amber-500", label: "Cronograma" },
  timeline: { icon: Clock, color: "bg-rose-500", label: "Timeline" },
  metodologia: { icon: BookOpen, color: "bg-lime-500", label: "Metodologias" },
  inovacao: { icon: Lightbulb, color: "bg-violet-500", label: "Inovação" },
  robot: { icon: Bot, color: "bg-emerald-500", label: "Robô" }
};

export function MemberActivity({ events }: MemberActivityProps) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const memberStats = useMemo<MemberStats[]>(() => {
    const stats: Record<string, MemberStats> = {};

    events.forEach(event => {
      if (!event.user_id || !event.user) return;

      if (!stats[event.user_id]) {
        stats[event.user_id] = {
          id: event.user_id,
          full_name: event.user.full_name,
          avatar_url: event.user.avatar_url,
          totalEvents: 0,
          metasCompleted: 0,
          tasksCompleted: 0,
          evidencesCreated: 0,
          testsRun: 0,
          feedbacksGiven: 0,
          events: [],
          categoryCounts: {} as Record<EventCategory, number>
        };
      }

      const memberStat = stats[event.user_id];
      memberStat.totalEvents++;
      memberStat.events.push(event);
      memberStat.categoryCounts[event.event_category] = 
        (memberStat.categoryCounts[event.event_category] || 0) + 1;

      // Count specific achievements
      if (event.event_category === 'meta' && event.event_type === 'conclusao') {
        memberStat.metasCompleted++;
      }
      if (event.event_category === 'tarefa' && event.event_type === 'conclusao') {
        memberStat.tasksCompleted++;
      }
      if (event.event_category === 'evidencia') {
        memberStat.evidencesCreated++;
      }
      if (event.event_category === 'teste') {
        memberStat.testsRun++;
      }
      if (event.event_category === 'feedback') {
        memberStat.feedbacksGiven++;
      }
    });

    return Object.values(stats).sort((a, b) => b.totalEvents - a.totalEvents);
  }, [events]);

  const selectedMemberData = selectedMember 
    ? memberStats.find(m => m.id === selectedMember)
    : null;

  const maxEvents = memberStats[0]?.totalEvents || 1;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="ranking" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="space-y-4">
          {memberStats.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Nenhum dado de membros disponível</p>
              </CardContent>
            </Card>
          ) : (
            memberStats.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary",
                    selectedMember === member.id && "border-primary bg-primary/5"
                  )}
                  onClick={() => setSelectedMember(member.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0",
                        index === 0 ? "bg-yellow-500" : 
                        index === 1 ? "bg-gray-400" : 
                        index === 2 ? "bg-amber-700" : "bg-muted text-foreground"
                      )}>
                        {index === 0 ? <Trophy className="h-5 w-5" /> : index + 1}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback>{member.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{member.full_name}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            {member.totalEvents} ações
                          </Badge>
                          {member.metasCompleted > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {member.metasCompleted} metas
                            </Badge>
                          )}
                          {member.tasksCompleted > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {member.tasksCompleted} tarefas
                            </Badge>
                          )}
                        </div>
                        <Progress 
                          value={(member.totalEvents / maxEvents) * 100} 
                          className="h-1.5 mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="details">
          {selectedMemberData ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedMemberData.avatar_url || undefined} />
                    <AvatarFallback className="text-xl">
                      {selectedMemberData.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{selectedMemberData.full_name}</CardTitle>
                    <p className="text-muted-foreground">
                      {selectedMemberData.totalEvents} ações no projeto
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 rounded-lg bg-blue-500/10">
                    <p className="text-2xl font-bold text-blue-500">
                      {selectedMemberData.metasCompleted}
                    </p>
                    <p className="text-xs text-muted-foreground">Metas</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-500/10">
                    <p className="text-2xl font-bold text-green-500">
                      {selectedMemberData.tasksCompleted}
                    </p>
                    <p className="text-xs text-muted-foreground">Tarefas</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-purple-500/10">
                    <p className="text-2xl font-bold text-purple-500">
                      {selectedMemberData.evidencesCreated}
                    </p>
                    <p className="text-xs text-muted-foreground">Evidências</p>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Atividades por Categoria</p>
                  <div className="grid grid-cols-4 gap-1">
                    {Object.entries(selectedMemberData.categoryCounts).map(([cat, count]) => {
                      const config = categoryConfig[cat as EventCategory];
                      const Icon = config?.icon || FileText;
                      return (
                        <div 
                          key={cat}
                          className="flex items-center gap-1 p-1.5 rounded bg-muted/50"
                          title={config?.label || cat}
                        >
                          <div className={cn("p-1 rounded", config?.color || "bg-gray-500")}>
                            <Icon className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-xs font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Atividade Recente</p>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2 pr-4">
                      {selectedMemberData.events.slice(0, 20).map((event) => {
                        const config = categoryConfig[event.event_category];
                        const Icon = config?.icon || FileText;
                        return (
                          <div 
                            key={event.id}
                            className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30"
                          >
                            <div className={cn("p-1.5 rounded", config?.color || "bg-gray-500")}>
                              <Icon className="h-3 w-3 text-white" />
                            </div>
                            <span className="flex-1 truncate">{event.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(event.created_at), "dd/MM")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Selecione um membro na aba Ranking para ver detalhes
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}