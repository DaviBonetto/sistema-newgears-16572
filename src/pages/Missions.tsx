import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Rocket, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Missions() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    const { data } = await supabase
      .from("mission_runs")
      .select("*, executor:executed_by(*)")
      .order("created_at", { ascending: false });
    setMissions(data || []);
  };

  const handleCreateMission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const missionPoints = parseInt(formData.get("mission_points") as string);
    const executionTime = parseFloat(formData.get("execution_time") as string);
    const idealTime = (missionPoints / 475) * 150;

    const { error } = await supabase.from("mission_runs").insert({
      mission_name: formData.get("mission_name") as string,
      mission_points: missionPoints,
      execution_time_seconds: executionTime,
      ideal_time_seconds: idealTime,
      success: formData.get("success") === "on",
      notes: formData.get("notes") as string,
      executed_by: user.id,
    });

    if (error) {
      toast.error("Erro ao registrar missão");
    } else {
      toast.success("Missão registrada com sucesso!");
      setIsCreateOpen(false);
      fetchMissions();
    }
  };

  const handleDeleteMission = async (missionId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta missão?")) return;

    const { error } = await supabase
      .from("mission_runs")
      .delete()
      .eq("id", missionId);

    if (error) {
      toast.error("Erro ao excluir missão");
    } else {
      toast.success("Missão excluída!");
      fetchMissions();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Registro de Missões</h1>
            <p className="text-muted-foreground">Execuções e análise de performance</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Missão
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Execução de Missão</DialogTitle>
                <DialogDescription>
                  O tempo ideal será calculado automaticamente pela fórmula oficial
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMission} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mission_name">Nome da Missão</Label>
                  <Input id="mission_name" name="mission_name" required />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mission_points">Pontuação da Missão</Label>
                    <Input
                      id="mission_points"
                      name="mission_points"
                      type="number"
                      min="0"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="execution_time">Tempo de Execução (segundos)</Label>
                    <Input
                      id="execution_time"
                      name="execution_time"
                      type="number"
                      step="0.1"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea id="notes" name="notes" rows={3} />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="success" name="success" defaultChecked />
                  <Label htmlFor="success">Missão bem-sucedida</Label>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-medium">Fórmula de Tempo Ideal:</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (Pontos / 475) × 150 segundos
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Registrar Missão
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {missions.map((mission) => {
            const executionTime = Number(mission.execution_time_seconds);
            const idealTime = Number(mission.ideal_time_seconds);
            const difference = executionTime - idealTime;
            const isUnderTime = difference < 0;
            const percentageDiff = Math.abs((difference / idealTime) * 100);

            return (
              <Card
                key={mission.id}
                className={`border-l-4 ${
                  mission.success
                    ? isUnderTime
                      ? "border-l-accent"
                      : "border-l-secondary"
                    : "border-l-destructive"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold">{mission.mission_name}</h3>
                        <Badge variant={mission.success ? "default" : "destructive"}>
                          {mission.success ? "Sucesso" : "Falhou"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Executado por {mission.executor?.full_name}
                      </p>
                      {mission.notes && (
                        <p className="mt-2 text-sm">{mission.notes}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 sm:text-right">
                      <div>
                        <p className="text-sm text-muted-foreground">Pontuação</p>
                        <p className="text-2xl font-bold">{mission.mission_points}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tempo Executado</p>
                        <p className="text-xl font-bold">{executionTime.toFixed(1)}s</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tempo Ideal</p>
                        <p className="text-lg font-medium text-muted-foreground">
                          {idealTime.toFixed(1)}s
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          isUnderTime ? "text-accent" : "text-secondary"
                        }`}
                      >
                        {isUnderTime ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {isUnderTime ? "-" : "+"}
                          {Math.abs(difference).toFixed(1)}s ({percentageDiff.toFixed(0)}%)
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="mt-2"
                        onClick={() => handleDeleteMission(mission.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {missions.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Rocket className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma missão registrada ainda</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
