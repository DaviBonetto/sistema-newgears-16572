import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, Search, Lightbulb, XCircle, CheckCircle, 
  ArrowRight, Star, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeMachineEvent } from "@/hooks/useTimeMachine";

interface SolutionEvolutionProps {
  events: TimeMachineEvent[];
}

interface EvolutionStep {
  id: string;
  type: 'problem' | 'research' | 'solution' | 'failure' | 'improvement' | 'final';
  title: string;
  description?: string;
  date: string;
  relatedEvents: TimeMachineEvent[];
}

const stepConfig = {
  problem: { 
    icon: AlertCircle, 
    color: "bg-red-500", 
    borderColor: "border-red-500",
    label: "Problema" 
  },
  research: { 
    icon: Search, 
    color: "bg-blue-500", 
    borderColor: "border-blue-500",
    label: "Pesquisa" 
  },
  solution: { 
    icon: Lightbulb, 
    color: "bg-yellow-500", 
    borderColor: "border-yellow-500",
    label: "Solução" 
  },
  failure: { 
    icon: XCircle, 
    color: "bg-orange-500", 
    borderColor: "border-orange-500",
    label: "Falha" 
  },
  improvement: { 
    icon: CheckCircle, 
    color: "bg-green-500", 
    borderColor: "border-green-500",
    label: "Melhoria" 
  },
  final: { 
    icon: Star, 
    color: "bg-purple-500", 
    borderColor: "border-purple-500",
    label: "Versão Final" 
  }
};

export function SolutionEvolution({ events }: SolutionEvolutionProps) {
  const evolutionSteps = useMemo<EvolutionStep[]>(() => {
    const steps: EvolutionStep[] = [];
    
    // Find problem definition events
    const problemEvents = events.filter(e => 
      e.event_category === 'inovacao' && 
      (e.title.toLowerCase().includes('problema') || e.metadata?.section === 'problem')
    );
    if (problemEvents.length > 0) {
      steps.push({
        id: 'problem-1',
        type: 'problem',
        title: 'Problema Identificado',
        description: problemEvents[0].description,
        date: problemEvents[0].created_at,
        relatedEvents: problemEvents
      });
    }

    // Find research events
    const researchEvents = events.filter(e => 
      e.event_category === 'inovacao' && 
      (e.title.toLowerCase().includes('pesquisa') || 
       e.title.toLowerCase().includes('especialista') ||
       e.metadata?.section === 'research_sources' ||
       e.metadata?.section === 'expert_conversations')
    );
    if (researchEvents.length > 0) {
      steps.push({
        id: 'research-1',
        type: 'research',
        title: 'Pesquisa Realizada',
        description: `${researchEvents.length} fontes consultadas`,
        date: researchEvents[0].created_at,
        relatedEvents: researchEvents
      });
    }

    // Find prototype events (first solution)
    const prototypeEvents = events.filter(e => 
      e.event_category === 'prototipo' || 
      (e.event_category === 'inovacao' && e.metadata?.section === 'prototyping')
    );
    if (prototypeEvents.length > 0) {
      steps.push({
        id: 'solution-1',
        type: 'solution',
        title: 'Primeira Versão da Solução',
        description: prototypeEvents[0].description,
        date: prototypeEvents[0].created_at,
        relatedEvents: [prototypeEvents[0]]
      });
    }

    // Find test failures (events with "falha" or negative test results)
    const failureEvents = events.filter(e => 
      e.event_category === 'teste' && 
      (e.title.toLowerCase().includes('falha') || 
       e.title.toLowerCase().includes('erro') ||
       e.metadata?.success === false)
    );
    if (failureEvents.length > 0) {
      steps.push({
        id: 'failure-1',
        type: 'failure',
        title: 'Falhas Encontradas',
        description: `${failureEvents.length} teste(s) com falhas identificadas`,
        date: failureEvents[0].created_at,
        relatedEvents: failureEvents
      });
    }

    // Find iteration/improvement events
    const iterationEvents = events.filter(e => 
      e.event_category === 'iteracao' ||
      (e.event_category === 'inovacao' && e.metadata?.section === 'solution_evolution')
    );
    if (iterationEvents.length > 0) {
      steps.push({
        id: 'improvement-1',
        type: 'improvement',
        title: 'Melhorias Implementadas',
        description: `${iterationEvents.length} iteração(ões) realizadas`,
        date: iterationEvents[0].created_at,
        relatedEvents: iterationEvents
      });
    }

    // Find final version (most recent prototype or solution event)
    if (prototypeEvents.length > 1) {
      const latestPrototype = prototypeEvents[prototypeEvents.length - 1];
      steps.push({
        id: 'final-1',
        type: 'final',
        title: 'Versão Final',
        description: latestPrototype.description,
        date: latestPrototype.created_at,
        relatedEvents: [latestPrototype]
      });
    }

    return steps.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [events]);

  if (evolutionSteps.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Nenhuma evolução de solução registrada ainda.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Registre eventos no Projeto de Inovação para ver a evolução aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Evolução da Solução
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border" />

            <div className="space-y-6">
              {evolutionSteps.map((step, index) => {
                const config = stepConfig[step.type];
                const Icon = config.icon;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex gap-4"
                  >
                    {/* Icon */}
                    <div className={cn(
                      "relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                      config.color
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className={cn(
                      "flex-1 p-4 rounded-lg border-l-4 bg-muted/30",
                      config.borderColor
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(step.date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <h4 className="font-semibold">{step.title}</h4>
                      {step.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {step.description}
                        </p>
                      )}
                      {step.relatedEvents.length > 1 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          {step.relatedEvents.length} eventos relacionados
                        </div>
                      )}
                    </div>

                    {/* Arrow to next */}
                    {index < evolutionSteps.length - 1 && (
                      <div className="absolute left-6 -bottom-3 transform translate-y-1/2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">
              {events.filter(e => e.event_category === 'iteracao').length}
            </p>
            <p className="text-sm text-muted-foreground">Iterações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">
              {events.filter(e => e.event_category === 'teste').length}
            </p>
            <p className="text-sm text-muted-foreground">Testes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">
              {events.filter(e => e.event_category === 'feedback').length}
            </p>
            <p className="text-sm text-muted-foreground">Feedbacks</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}