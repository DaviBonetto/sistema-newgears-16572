import { useMemo, useState } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Download, RefreshCw, Users, Clock, 
  Target, CheckSquare, Beaker, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import type { TimeMachineEvent } from "@/hooks/useTimeMachine";

interface AutoReportsProps {
  events: TimeMachineEvent[];
}

export function AutoReports({ events }: AutoReportsProps) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const sortedEvents = useMemo(() => 
    [...events].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  [events]);

  const projectDuration = useMemo(() => {
    if (sortedEvents.length < 2) return 0;
    const first = parseISO(sortedEvents[0].created_at);
    const last = parseISO(sortedEvents[sortedEvents.length - 1].created_at);
    return differenceInDays(last, first) + 1;
  }, [sortedEvents]);

  // Generate Iteration History Report
  const iterationReport = useMemo(() => {
    const iterations = events.filter(e => 
      e.event_category === 'iteracao' || 
      e.event_type === 'iteracao'
    );
    
    const tests = events.filter(e => e.event_category === 'teste');
    const feedbacks = events.filter(e => e.event_category === 'feedback');

    return {
      title: "Histórico de Iteração",
      description: "Detalhamento de todas as iterações, testes e feedbacks do projeto",
      icon: RefreshCw,
      stats: [
        { label: "Iterações", value: iterations.length },
        { label: "Testes", value: tests.length },
        { label: "Feedbacks", value: feedbacks.length }
      ],
      content: [...iterations, ...tests, ...feedbacks]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    };
  }, [events]);

  // Generate Development History Report
  const developmentReport = useMemo(() => {
    const prototypes = events.filter(e => e.event_category === 'prototipo');
    const evidences = events.filter(e => e.event_category === 'evidencia');
    const decisions = events.filter(e => e.event_category === 'decisao');

    return {
      title: "Histórico de Desenvolvimento",
      description: "Cronologia completa do desenvolvimento do projeto",
      icon: Clock,
      stats: [
        { label: "Dias de Projeto", value: projectDuration },
        { label: "Protótipos", value: prototypes.length },
        { label: "Evidências", value: evidences.length }
      ],
      content: sortedEvents
    };
  }, [events, sortedEvents, projectDuration]);

  // Generate Member Participation Report
  const participationReport = useMemo(() => {
    const memberCounts: Record<string, { name: string; count: number }> = {};
    
    events.forEach(e => {
      if (e.user_id && e.user) {
        if (!memberCounts[e.user_id]) {
          memberCounts[e.user_id] = { name: e.user.full_name, count: 0 };
        }
        memberCounts[e.user_id].count++;
      }
    });

    const members = Object.values(memberCounts).sort((a, b) => b.count - a.count);
    const totalParticipants = members.length;
    const totalActions = events.length;

    return {
      title: "Participação por Membro",
      description: "Contribuições individuais de cada membro da equipe",
      icon: Users,
      stats: [
        { label: "Membros Ativos", value: totalParticipants },
        { label: "Total de Ações", value: totalActions },
        { label: "Média por Membro", value: totalParticipants > 0 ? Math.round(totalActions / totalParticipants) : 0 }
      ],
      members
    };
  }, [events]);

  // Generate Timeline Summary Report
  const timelineSummary = useMemo(() => {
    const metas = events.filter(e => e.event_category === 'meta');
    const metasCompleted = metas.filter(e => e.event_type === 'conclusao').length;
    const tasks = events.filter(e => e.event_category === 'tarefa');
    const tasksCompleted = tasks.filter(e => e.event_type === 'conclusao').length;

    // Group by week
    const weeklyGroups: Record<string, number> = {};
    events.forEach(e => {
      const weekKey = format(parseISO(e.created_at), "'Semana' w 'de' yyyy", { locale: ptBR });
      weeklyGroups[weekKey] = (weeklyGroups[weekKey] || 0) + 1;
    });

    return {
      title: "Linha do Tempo Resumida",
      description: "Visão geral condensada da evolução do projeto",
      icon: Target,
      stats: [
        { label: "Metas Concluídas", value: `${metasCompleted}/${metas.length}` },
        { label: "Tarefas Concluídas", value: `${tasksCompleted}/${tasks.length}` },
        { label: "Semanas Ativas", value: Object.keys(weeklyGroups).length }
      ],
      weeklyGroups
    };
  }, [events]);

  const reports = [
    { id: 'iteration', ...iterationReport },
    { id: 'development', ...developmentReport },
    { id: 'participation', ...participationReport },
    { id: 'timeline', ...timelineSummary }
  ];

  const handleExport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    // Generate text content for export
    let content = `${report.title}\n${'='.repeat(50)}\n\n`;
    content += `${report.description}\n\n`;
    content += `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n\n`;
    
    content += `ESTATÍSTICAS\n${'-'.repeat(30)}\n`;
    report.stats.forEach(stat => {
      content += `${stat.label}: ${stat.value}\n`;
    });
    content += '\n';

    if ('content' in report && report.content) {
      content += `EVENTOS\n${'-'.repeat(30)}\n`;
      report.content.forEach((event: TimeMachineEvent) => {
        content += `[${format(parseISO(event.created_at), "dd/MM/yyyy HH:mm")}] ${event.title}\n`;
        if (event.description) content += `   ${event.description}\n`;
      });
    }

    if ('members' in report && report.members) {
      content += `PARTICIPAÇÃO\n${'-'.repeat(30)}\n`;
      report.members.forEach((member: any, i: number) => {
        content += `${i + 1}. ${member.name}: ${member.count} ações\n`;
      });
    }

    if ('weeklyGroups' in report && report.weeklyGroups) {
      content += `ATIVIDADE SEMANAL\n${'-'.repeat(30)}\n`;
      Object.entries(report.weeklyGroups).forEach(([week, count]) => {
        content += `${week}: ${count} eventos\n`;
      });
    }

    // Create download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Relatório "${report.title}" exportado!`);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report, index) => {
          const Icon = report.icon;
          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="cursor-pointer hover:border-primary transition-all"
                onClick={() => setSelectedReport(report.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{report.title}</CardTitle>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExport(report.id);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-xs">
                    {report.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {report.stats.map((stat, i) => (
                      <div key={i} className="text-center flex-1">
                        <p className="text-xl font-bold text-primary">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Report Preview */}
      {selectedReport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {reports.find(r => r.id === selectedReport)?.title}
                </CardTitle>
                <Button onClick={() => handleExport(selectedReport)}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar TXT
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {selectedReport === 'iteration' && (
                  <div className="space-y-2 pr-4">
                    {iterationReport.content.map((event) => (
                      <div key={event.id} className="p-2 rounded bg-muted/50 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{event.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(event.created_at), "dd/MM/yyyy")}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedReport === 'development' && (
                  <div className="space-y-2 pr-4">
                    {developmentReport.content.slice(0, 50).map((event) => (
                      <div key={event.id} className="p-2 rounded bg-muted/50 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{event.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(event.created_at), "dd/MM/yyyy HH:mm")}
                          </span>
                        </div>
                      </div>
                    ))}
                    {developmentReport.content.length > 50 && (
                      <p className="text-sm text-muted-foreground text-center">
                        ... e mais {developmentReport.content.length - 50} eventos
                      </p>
                    )}
                  </div>
                )}

                {selectedReport === 'participation' && (
                  <div className="space-y-2 pr-4">
                    {participationReport.members.map((member, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">{i + 1}.</span>
                          <span>{member.name}</span>
                        </div>
                        <span className="font-medium">{member.count} ações</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedReport === 'timeline' && (
                  <div className="space-y-2 pr-4">
                    {Object.entries(timelineSummary.weeklyGroups).map(([week, count], i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span>{week}</span>
                        <span className="font-medium">{count} eventos</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}