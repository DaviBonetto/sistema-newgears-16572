import { useState, useEffect, useRef, useCallback } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { 
  Play, Pause, SkipBack, SkipForward, FastForward, 
  Target, CheckSquare, FileText, Brain, Users, GitBranch,
  Beaker, MessageSquare, RefreshCw, Calendar, Clock,
  Lightbulb, Bot, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeMachineEvent, EventCategory } from "@/hooks/useTimeMachine";

interface ReplayModeProps {
  events: TimeMachineEvent[];
  onClose?: () => void;
}

const categoryConfig: Record<EventCategory, { icon: React.ElementType; color: string }> = {
  meta: { icon: Target, color: "bg-blue-500" },
  tarefa: { icon: CheckSquare, color: "bg-green-500" },
  evidencia: { icon: FileText, color: "bg-purple-500" },
  brainstorming: { icon: Brain, color: "bg-yellow-500" },
  reuniao: { icon: Users, color: "bg-pink-500" },
  decisao: { icon: GitBranch, color: "bg-orange-500" },
  prototipo: { icon: Lightbulb, color: "bg-cyan-500" },
  teste: { icon: Beaker, color: "bg-red-500" },
  feedback: { icon: MessageSquare, color: "bg-indigo-500" },
  iteracao: { icon: RefreshCw, color: "bg-teal-500" },
  comentario: { icon: MessageSquare, color: "bg-gray-500" },
  cronograma: { icon: Calendar, color: "bg-amber-500" },
  timeline: { icon: Clock, color: "bg-rose-500" },
  metodologia: { icon: BookOpen, color: "bg-lime-500" },
  inovacao: { icon: Lightbulb, color: "bg-violet-500" },
  robot: { icon: Bot, color: "bg-emerald-500" }
};

export function ReplayMode({ events, onClose }: ReplayModeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [displayedEvents, setDisplayedEvents] = useState<TimeMachineEvent[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const progress = sortedEvents.length > 0 
    ? ((currentIndex + 1) / sortedEvents.length) * 100 
    : 0;

  const startDate = sortedEvents[0]?.created_at 
    ? parseISO(sortedEvents[0].created_at)
    : new Date();
  const endDate = sortedEvents[sortedEvents.length - 1]?.created_at
    ? parseISO(sortedEvents[sortedEvents.length - 1].created_at)
    : new Date();
  const totalDays = differenceInDays(endDate, startDate) + 1;

  const currentEvent = sortedEvents[currentIndex];
  const currentDate = currentEvent?.created_at 
    ? parseISO(currentEvent.created_at)
    : new Date();

  const play = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= sortedEvents.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / speed);
    
    setIsPlaying(true);
  }, [sortedEvents.length, speed]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    pause();
    setCurrentIndex(0);
    setDisplayedEvents([]);
  }, [pause]);

  const skipToEnd = useCallback(() => {
    pause();
    setCurrentIndex(sortedEvents.length - 1);
  }, [pause, sortedEvents.length]);

  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < sortedEvents.length) {
      setDisplayedEvents(sortedEvents.slice(0, currentIndex + 1));
    }
  }, [currentIndex, sortedEvents]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Restart play with new speed when speed changes
  useEffect(() => {
    if (isPlaying) {
      play();
    }
  }, [speed, isPlaying, play]);

  const config = currentEvent ? categoryConfig[currentEvent.event_category] : null;
  const CurrentIcon = config?.icon || FileText;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
          </span>
          <span className="font-medium">
            Dia {Math.min(differenceInDays(currentDate, startDate) + 1, totalDays)} de {totalDays}
          </span>
          <span className="text-muted-foreground">
            {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Evento {currentIndex + 1} de {sortedEvents.length}</span>
          <span>{Math.round(progress)}% concluído</span>
        </div>
      </div>

      {/* Current Event Display */}
      <AnimatePresence mode="wait">
        {currentEvent && (
          <motion.div
            key={currentEvent.id}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-primary">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className={cn("p-4 rounded-xl", config?.color || "bg-gray-500")}
                    initial={{ rotate: -180 }}
                    animate={{ rotate: 0 }}
                    transition={{ duration: 0.5, type: "spring" }}
                  >
                    <CurrentIcon className="h-8 w-8 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <motion.p 
                      className="text-xl font-bold"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {currentEvent.title}
                    </motion.p>
                    {currentEvent.description && (
                      <motion.p 
                        className="text-muted-foreground mt-1"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {currentEvent.description}
                      </motion.p>
                    )}
                    <motion.div 
                      className="flex items-center gap-3 mt-3"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="text-sm text-muted-foreground">
                        {format(currentDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                      {currentEvent.user && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={currentEvent.user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {currentEvent.user.full_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{currentEvent.user.full_name}</span>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="icon" onClick={reset}>
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button 
          size="lg" 
          onClick={isPlaying ? pause : play}
          className="px-8"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button variant="outline" size="icon" onClick={skipToEnd}>
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Speed Control */}
      <div className="flex items-center gap-4">
        <FastForward className="h-4 w-4 text-muted-foreground" />
        <Slider
          value={[speed]}
          onValueChange={([value]) => setSpeed(value)}
          min={0.5}
          max={4}
          step={0.5}
          className="flex-1"
        />
        <span className="text-sm font-medium w-12">{speed}x</span>
      </div>

      {/* Event History */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Histórico ({displayedEvents.length} eventos)</h4>
        <div className="max-h-[200px] overflow-y-auto space-y-1 pr-2">
          {displayedEvents.slice().reverse().map((event, i) => {
            const evtConfig = categoryConfig[event.event_category];
            const EvtIcon = evtConfig?.icon || FileText;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50"
              >
                <div className={cn("p-1 rounded", evtConfig?.color || "bg-gray-500")}>
                  <EvtIcon className="h-3 w-3 text-white" />
                </div>
                <span className="flex-1 truncate">{event.title}</span>
                <span className="text-muted-foreground">
                  {format(parseISO(event.created_at), "dd/MM HH:mm")}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}