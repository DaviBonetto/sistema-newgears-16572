import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelineVisual } from "@/components/timemachine/TimelineVisual";
import { ReplayMode } from "@/components/timemachine/ReplayMode";
import { HeatMaps } from "@/components/timemachine/HeatMaps";
import { MemberActivity } from "@/components/timemachine/MemberActivity";
import { SolutionEvolution } from "@/components/timemachine/SolutionEvolution";
import { AutoReports } from "@/components/timemachine/AutoReports";
import { CategoryFilter } from "@/components/timemachine/CategoryFilter";
import { ArrowLeft, Clock, Play, BarChart3, Users, Lightbulb, FileText, Loader2 } from "lucide-react";
import type { TimeMachineEvent, EventCategory } from "@/hooks/useTimeMachine";

export default function TimeMachine() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<TimeMachineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [activeTab, setActiveTab] = useState("timeline");

  useEffect(() => {
    fetchEvents();
    const channel = supabase
      .channel('time-machine-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_machine_events' }, fetchEvents)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('time_machine_events')
        .select(`*, user:profiles!time_machine_events_user_id_fkey(full_name, avatar_url)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEvents((data || []) as TimeMachineEvent[]);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = (category: EventCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const allCategories: EventCategory[] = ['meta', 'tarefa', 'evidencia', 'brainstorming', 'reuniao', 'decisao', 'prototipo', 'teste', 'feedback', 'iteracao', 'metodologia', 'inovacao', 'robot'];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Clock className="h-8 w-8 text-primary" />
              Time Machine
            </h1>
            <p className="text-muted-foreground">Visualize toda a evolução do projeto</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <CategoryFilter
              selectedCategories={selectedCategories}
              onToggle={handleToggleCategory}
              onClear={() => setSelectedCategories([])}
              onSelectAll={() => setSelectedCategories(allCategories)}
            />
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="timeline"><Clock className="h-4 w-4 mr-1" />Timeline</TabsTrigger>
            <TabsTrigger value="replay"><Play className="h-4 w-4 mr-1" />Replay</TabsTrigger>
            <TabsTrigger value="heatmaps"><BarChart3 className="h-4 w-4 mr-1" />Mapas</TabsTrigger>
            <TabsTrigger value="members"><Users className="h-4 w-4 mr-1" />Membros</TabsTrigger>
            <TabsTrigger value="evolution"><Lightbulb className="h-4 w-4 mr-1" />Evolução</TabsTrigger>
            <TabsTrigger value="reports"><FileText className="h-4 w-4 mr-1" />Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline"><TimelineVisual events={events} selectedCategories={selectedCategories.length > 0 ? selectedCategories : undefined} /></TabsContent>
          <TabsContent value="replay"><ReplayMode events={events} /></TabsContent>
          <TabsContent value="heatmaps"><HeatMaps events={events} /></TabsContent>
          <TabsContent value="members"><MemberActivity events={events} /></TabsContent>
          <TabsContent value="evolution"><SolutionEvolution events={events} /></TabsContent>
          <TabsContent value="reports"><AutoReports events={events} /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}