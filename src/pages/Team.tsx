import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Target, TrendingUp } from "lucide-react";

export default function Team() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [evidences, setEvidences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true });

    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*");

    const { data: evidencesData } = await supabase
      .from("evidences")
      .select("*");

    if (profilesData) setProfiles(profilesData);
    if (tasksData) setTasks(tasksData);
    if (evidencesData) setEvidences(evidencesData);
    setLoading(false);
  };

  const getProfileStats = (profileId: string) => {
    const completedTasks = tasks.filter(
      (t) => t.responsible_id === profileId && t.status === "done"
    ).length;
    const totalTasks = tasks.filter((t) => t.responsible_id === profileId).length;
    const createdEvidences = evidences.filter((e) => e.created_by === profileId).length;

    return { completedTasks, totalTasks, createdEvidences };
  };

  const rankedProfiles = profiles
    .map((profile) => {
      const stats = getProfileStats(profile.id);
      return { ...profile, ...stats };
    })
    .sort((a, b) => {
      if (b.completedTasks !== a.completedTasks) {
        return b.completedTasks - a.completedTasks;
      }
      return b.createdEvidences - a.createdEvidences;
    });

  const getRankBadge = (index: number) => {
    const medals = ["🥇", "🥈", "🥉"];
    if (index < 3) {
      return (
        <Badge variant="default" className="text-2xl">
          {medals[index]}
        </Badge>
      );
    }
    return <Badge variant="outline">#{index + 1}</Badge>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Users className="h-8 w-8 text-primary" />
            Equipe GEARS
          </h1>
          <p className="text-muted-foreground">
            Perfis completos dos integrantes com ranking de contribuição
          </p>
        </div>

        {/* Team Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profiles.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Metas Concluídas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tasks.filter((t) => t.status === "done").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evidências Criadas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{evidences.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members - Smaller Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {rankedProfiles.map((profile, index) => (
            <Card key={profile.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Rank Badge */}
                  <div className="flex flex-col items-center gap-1">
                    {getRankBadge(index)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {profile.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Profile Info */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-lg font-bold">{profile.full_name}</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {profile.shift && (
                          <Badge variant="outline" className="text-xs">
                            {profile.shift}
                          </Badge>
                        )}
                        {profile.role && (
                          <Badge variant="secondary" className="text-xs">
                            {profile.role}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded border p-2">
                        <div className="text-xs text-muted-foreground">Metas</div>
                        <div className="text-lg font-bold text-primary">
                          {profile.completedTasks}/{profile.totalTasks}
                        </div>
                      </div>
                      <div className="rounded border p-2">
                        <div className="text-xs text-muted-foreground">Evidências</div>
                        <div className="text-lg font-bold text-secondary">
                          {profile.createdEvidences}
                        </div>
                      </div>
                      <div className="rounded border p-2">
                        <div className="text-xs text-muted-foreground">Taxa</div>
                        <div className="text-lg font-bold text-accent">
                          {profile.totalTasks > 0
                            ? Math.round((profile.completedTasks / profile.totalTasks) * 100)
                            : 0}
                          %
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
