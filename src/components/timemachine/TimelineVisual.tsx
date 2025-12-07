import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, isSameDay, isSameMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Target, CheckSquare, FileText, Brain, Users, GitBranch, 
  Beaker, MessageSquare, RefreshCw, Calendar, Clock, 
  ChevronLeft, ChevronRight, Lightbulb, Bot, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeMachineEvent, EventCategory } from "@/hooks/useTimeMachine";

interface TimelineVisualProps {
  events: TimeMachineEvent[];
  onEventClick?: (event: TimeMachineEvent) => void;
  selectedCategories?: EventCategory[];
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

export function TimelineVisual({ events, onEventClick, selectedCategories }: TimelineVisualProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const filteredEvents = useMemo(() => {
    if (!selectedCategories || selectedCategories.length === 0) return events;
    return events.filter(e => selectedCategories.includes(e.event_category));
  }, [events, selectedCategories]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const weeksInMonth = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 0 });

  const eventsGroupedByDay = useMemo(() => {
    const grouped: Record<string, TimeMachineEvent[]> = {};
    filteredEvents.forEach(event => {
      const dateKey = format(parseISO(event.created_at), 'yyyy-MM-dd');
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [filteredEvents]);

  const dayEvents = selectedDay 
    ? eventsGroupedByDay[format(selectedDay, 'yyyy-MM-dd')] || []
    : [];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getEventCountForDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return eventsGroupedByDay[dateKey]?.length || 0;
  };

  const getCategoriesForDay = (day: Date): EventCategory[] => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayEvts = eventsGroupedByDay[dateKey] || [];
    return [...new Set(dayEvts.map(e => e.event_category))];
  };

  return (
    <div className="space-y-6">
      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
        
        {daysInMonth.map((day, index) => {
          const eventCount = getEventCountForDay(day);
          const categories = getCategoriesForDay(day);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const isToday = isSameDay(day, new Date());

          return (
            <motion.button
              key={day.toISOString()}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "relative aspect-square p-1 rounded-lg transition-all hover:bg-muted",
                isSelected && "ring-2 ring-primary bg-primary/10",
                isToday && !isSelected && "bg-accent",
                eventCount > 0 && "cursor-pointer"
              )}
            >
              <span className={cn(
                "text-sm",
                isToday && "font-bold text-primary",
                !isSameMonth(day, currentDate) && "text-muted-foreground/50"
              )}>
                {format(day, 'd')}
              </span>
              
              {/* Event indicators */}
              {eventCount > 0 && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {categories.slice(0, 3).map((cat, i) => (
                    <div 
                      key={cat}
                      className={cn("w-1.5 h-1.5 rounded-full", categoryConfig[cat]?.color || "bg-gray-400")}
                    />
                  ))}
                  {categories.length > 3 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected Day Events */}
      <AnimatePresence mode="wait">
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
              </h4>
              <Badge variant="secondary">{dayEvents.length} eventos</Badge>
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-4">
                {dayEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum evento neste dia
                  </p>
                ) : (
                  dayEvents.map((event, index) => {
                    const config = categoryConfig[event.event_category];
                    const Icon = config?.icon || FileText;

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card 
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => onEventClick?.(event)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className={cn("p-2 rounded-lg", config?.color || "bg-gray-500")}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{event.title}</p>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {event.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    {format(parseISO(event.created_at), 'HH:mm')}
                                  </span>
                                  {event.user && (
                                    <div className="flex items-center gap-1">
                                      <Avatar className="h-4 w-4">
                                        <AvatarImage src={event.user.avatar_url || undefined} />
                                        <AvatarFallback className="text-[8px]">
                                          {event.user.full_name?.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-muted-foreground">
                                        {event.user.full_name}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}