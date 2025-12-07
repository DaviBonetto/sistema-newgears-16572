import { useMemo } from "react";
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, getWeek, getMonth, getHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { TimeMachineEvent, EventCategory } from "@/hooks/useTimeMachine";

interface HeatMapsProps {
  events: TimeMachineEvent[];
}

export function HeatMaps({ events }: HeatMapsProps) {
  // Activity by hour of day
  const hourlyActivity = useMemo(() => {
    const hours: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hours[i] = 0;
    
    events.forEach(event => {
      const hour = getHours(parseISO(event.created_at));
      hours[hour]++;
    });
    
    const maxCount = Math.max(...Object.values(hours), 1);
    return { hours, maxCount };
  }, [events]);

  // Activity by day of week
  const weekdayActivity = useMemo(() => {
    const days: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    events.forEach(event => {
      const dayOfWeek = parseISO(event.created_at).getDay();
      days[dayOfWeek]++;
    });
    
    const maxCount = Math.max(...Object.values(days), 1);
    return { days, maxCount, dayNames };
  }, [events]);

  // Top contributors
  const topContributors = useMemo(() => {
    const contributors: Record<string, { count: number; user: TimeMachineEvent['user'] }> = {};
    
    events.forEach(event => {
      if (event.user_id && event.user) {
        if (!contributors[event.user_id]) {
          contributors[event.user_id] = { count: 0, user: event.user };
        }
        contributors[event.user_id].count++;
      }
    });
    
    return Object.entries(contributors)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [events]);

  // Category distribution
  const categoryDistribution = useMemo(() => {
    const categories: Record<EventCategory, number> = {} as any;
    
    events.forEach(event => {
      categories[event.event_category] = (categories[event.event_category] || 0) + 1;
    });
    
    return Object.entries(categories)
      .map(([category, count]) => ({ category: category as EventCategory, count }))
      .sort((a, b) => b.count - a.count);
  }, [events]);

  // Peak periods
  const peakPeriods = useMemo(() => {
    const weeks: Record<string, number> = {};
    
    events.forEach(event => {
      const date = parseISO(event.created_at);
      const weekKey = `${date.getFullYear()}-W${getWeek(date)}`;
      weeks[weekKey] = (weeks[weekKey] || 0) + 1;
    });
    
    const sorted = Object.entries(weeks)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => b.count - a.count);
    
    return sorted.slice(0, 3);
  }, [events]);

  const getHeatIntensity = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio === 0) return "bg-muted";
    if (ratio < 0.25) return "bg-primary/20";
    if (ratio < 0.5) return "bg-primary/40";
    if (ratio < 0.75) return "bg-primary/60";
    return "bg-primary";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Hourly Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Atividade por Hora</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-0.5 h-16">
            {Array.from({ length: 24 }, (_, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${(hourlyActivity.hours[i] / hourlyActivity.maxCount) * 100}%` }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  "flex-1 rounded-t transition-all",
                  getHeatIntensity(hourlyActivity.hours[i], hourlyActivity.maxCount)
                )}
                title={`${i}h: ${hourlyActivity.hours[i]} eventos`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0h</span>
            <span>6h</span>
            <span>12h</span>
            <span>18h</span>
            <span>23h</span>
          </div>
        </CardContent>
      </Card>

      {/* Day of Week Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Atividade por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1">
            {weekdayActivity.dayNames.map((name, i) => (
              <div key={i} className="flex-1 text-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 60 }}
                  className="relative h-[60px] mb-1"
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ 
                      height: `${(weekdayActivity.days[i] / weekdayActivity.maxCount) * 100}%` 
                    }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "absolute bottom-0 w-full rounded-t",
                      getHeatIntensity(weekdayActivity.days[i], weekdayActivity.maxCount)
                    )}
                  />
                </motion.div>
                <span className="text-xs text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Membros Mais Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topContributors.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
            ) : (
              topContributors.map((contributor, i) => {
                const maxCount = topContributors[0]?.count || 1;
                return (
                  <motion.div
                    key={contributor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={contributor.user?.avatar_url || undefined} />
                      <AvatarFallback>
                        {contributor.user?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {contributor.user?.full_name || 'Desconhecido'}
                      </p>
                      <Progress 
                        value={(contributor.count / maxCount) * 100} 
                        className="h-1.5 mt-1"
                      />
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {contributor.count}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Peak Periods */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Períodos de Pico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {peakPeriods.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
            ) : (
              peakPeriods.map((period, i) => {
                const maxCount = peakPeriods[0]?.count || 1;
                return (
                  <motion.div
                    key={period.week}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white",
                      i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : "bg-amber-700"
                    )}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{period.week}</p>
                      <Progress 
                        value={(period.count / maxCount) * 100} 
                        className="h-1.5 mt-1"
                      />
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {period.count} eventos
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribuição por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categoryDistribution.map((item, i) => {
              const maxCount = categoryDistribution[0]?.count || 1;
              return (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-lg bg-muted/50 text-center"
                >
                  <p className="text-2xl font-bold text-primary">{item.count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}