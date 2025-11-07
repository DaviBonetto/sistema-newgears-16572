import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const columns = [
  { id: "todo", title: "A Fazer", color: "bg-muted" },
  { id: "in_progress", title: "Em Progresso", color: "bg-primary/10" },
  { id: "done", title: "Concluído", color: "bg-accent/10" },
  { id: "blocked", title: "Bloqueado", color: "bg-destructive/10" },
];

const priorities = [
  { value: "low", label: "Baixa", color: "bg-slate-500" },
  { value: "medium", label: "Média", color: "bg-blue-500" },
  { value: "high", label: "Alta", color: "bg-orange-500" },
  { value: "urgent", label: "Urgente", color: "bg-red-500" },
];

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchProfiles();
  }, []);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*, responsible:responsible_id(*)")
      .order("created_at", { ascending: false });
    setTasks(data || []);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*");
    setProfiles(data || []);
  };

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);

    const { error } = await supabase.from("tasks").insert({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      priority: formData.get("priority") as string,
      status: "todo",
      responsible_id: formData.get("responsible") as string || null,
      deadline: formData.get("deadline") ? new Date(formData.get("deadline") as string).toISOString() : null,
      evidence_required: formData.get("evidence_required") === "on",
      created_by: user.id,
    });

    if (error) {
      toast.error("Erro ao criar tarefa");
    } else {
      toast.success("Tarefa criada com sucesso!");
      setIsCreateOpen(false);
      fetchTasks();
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", taskId);

    if (error) {
      toast.error("Erro ao atualizar tarefa");
    } else {
      fetchTasks();
      toast.success("Status atualizado!");
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskToDelete);

    if (error) {
      toast.error("Erro ao excluir meta");
    } else {
      toast.success("Meta excluída!");
      fetchTasks();
    }

    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quadro de Metas</h1>
            <p className="text-muted-foreground">Organize e acompanhe as tarefas do time</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Meta</DialogTitle>
                <DialogDescription>
                  Adicione uma nova tarefa ao quadro do time
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" name="title" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select name="priority" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsible">Responsável</Label>
                    <Select name="responsible">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Prazo (Opcional)</Label>
                  <Input id="deadline" name="deadline" type="datetime-local" />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="evidence_required" name="evidence_required" />
                  <Label htmlFor="evidence_required">Evidência obrigatória ao concluir</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Criar Meta
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <Card key={column.id} className={column.color}>
              <CardHeader>
                <CardTitle className="text-base">{column.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks
                  .filter((task) => task.status === column.id)
                  .map((task) => {
                    const priority = priorities.find((p) => p.value === task.priority);
                    return (
                      <Card
                        key={task.id}
                        className="border transition-all hover:shadow-md"
                      >
                        <CardContent className="p-2">
                          <div className="mb-1.5 flex items-start justify-between gap-1">
                            <p 
                              className="font-medium text-sm cursor-pointer flex-1"
                              onClick={() => {
                                if (column.id !== "done") {
                                  const nextStatus =
                                    column.id === "todo"
                                      ? "in_progress"
                                      : column.id === "in_progress"
                                        ? "done"
                                        : "done";
                                  updateTaskStatus(task.id, nextStatus);
                                }
                              }}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-1">
                              {priority && (
                                <Badge
                                  className={`${priority.color} text-white text-xs px-1.5 py-0`}
                                  variant="secondary"
                                >
                                  {priority.label}
                                </Badge>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToDelete(task.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {task.description && (
                            <p className="mb-1.5 text-xs text-muted-foreground line-clamp-1">
                              {task.description}
                            </p>
                          )}
                          {task.responsible && (
                            <p className="text-xs text-muted-foreground">
                              {task.responsible.full_name}
                            </p>
                          )}
                          {task.evidence_required && (
                            <Badge variant="outline" className="mt-1.5 text-xs">
                              Evidência obrigatória
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                {tasks.filter((task) => task.status === column.id).length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Nenhuma tarefa
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteTask} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
