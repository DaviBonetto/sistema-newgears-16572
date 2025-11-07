import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTabPersistence } from "@/hooks/useTabPersistence";
import { useScrollPersistence } from "@/hooks/useScrollPersistence";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

interface DroppableColumnProps {
  column: typeof columns[0];
  children: React.ReactNode;
}

function DroppableColumn({ column, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div ref={setNodeRef} className="flex flex-col">
      <Card className={`${column.color} flex-1 transition-all ${isOver ? "ring-2 ring-primary" : ""}`}>
        {children}
      </Card>
    </div>
  );
}

interface TaskCardProps {
  task: any;
  onDelete: (id: string) => void;
  onEdit: (task: any) => void;
  profiles: any[];
}

function TaskCard({ task, onDelete, onEdit, profiles }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priority = priorities.find((p) => p.value === task.priority);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border transition-all hover:shadow-md ${isDragging ? "z-50" : ""}`}
    >
      <CardContent className="p-2">
        <div className="mb-1.5 flex items-start justify-between gap-1">
          <div className="flex items-start gap-1 flex-1">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing touch-none p-0.5 hover:bg-muted rounded mt-0.5"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <p className="font-medium text-sm flex-1">
              {task.title}
            </p>
          </div>
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
                onEdit(task);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>
        {task.description && (
          <p className="mb-1.5 text-xs text-muted-foreground line-clamp-2 ml-5">
            {task.description}
          </p>
        )}
        {task.responsible_ids && task.responsible_ids.length > 0 && (
          <div className="mt-1.5 ml-5 flex flex-wrap gap-1">
            {task.responsible_ids.map((id: string) => {
              const profile = profiles.find((p) => p.id === id);
              return profile ? (
                <Badge key={id} variant="outline" className="text-xs">
                  {profile.full_name}
                </Badge>
              ) : null;
            })}
          </div>
        )}
        {task.evidence_required && (
          <Badge variant="outline" className="mt-1.5 text-xs ml-5">
            Evidência obrigatória
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedResponsibles, setSelectedResponsibles] = useState<string[]>([]);
  const [dragOriginStatus, setDragOriginStatus] = useState<string | null>(null);

  useTabPersistence("todo");
  useScrollPersistence();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
      responsible_ids: selectedResponsibles.length > 0 ? selectedResponsibles : null,
      deadline: formData.get("deadline") ? new Date(formData.get("deadline") as string).toISOString() : null,
      evidence_required: formData.get("evidence_required") === "on",
      created_by: user.id,
    });

    if (error) {
      toast.error("Erro ao criar tarefa");
    } else {
      toast.success("Tarefa criada com sucesso!");
      setIsCreateOpen(false);
      setSelectedResponsibles([]);
      fetchTasks();
    }
  };

  const handleEditTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTask) return;

    const formData = new FormData(e.currentTarget);

    const { error } = await supabase
      .from("tasks")
      .update({
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        priority: formData.get("priority") as string,
        responsible_ids: selectedResponsibles.length > 0 ? selectedResponsibles : null,
        deadline: formData.get("deadline") ? new Date(formData.get("deadline") as string).toISOString() : null,
        evidence_required: formData.get("evidence_required") === "on",
      })
      .eq("id", editingTask.id);

    if (error) {
      toast.error("Erro ao atualizar tarefa");
    } else {
      toast.success("Tarefa atualizada!");
      setIsEditOpen(false);
      setEditingTask(null);
      setSelectedResponsibles([]);
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
      // Update local state immediately for smooth UX
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const activeTask = tasks.find((t) => t.id === event.active.id);
    setDragOriginStatus(activeTask ? activeTask.status : null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if over a column (not a task)
    const overColumn = columns.find((col) => col.id === over.id);
    if (overColumn && activeTask.status !== overColumn.id) {
      // Optimistically update UI
      setTasks((prev) =>
        prev.map((t) => (t.id === active.id ? { ...t, status: overColumn.id } : t))
      );
    }

    // Check if over another task
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask && activeTask.status !== overTask.status) {
      // Move to the same column as the task it's over
      setTasks((prev) =>
        prev.map((t) => (t.id === active.id ? { ...t, status: overTask.status } : t))
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      setDragOriginStatus(null);
      return;
    }

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) {
      setDragOriginStatus(null);
      return;
    }

    let targetStatus = dragOriginStatus ?? activeTask.status;

    // Check if dropped on a column
    const columnId = columns.find((col) => col.id === over.id)?.id;
    if (columnId) {
      targetStatus = columnId;
    } else {
      // Check if dropped on a task
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if ((dragOriginStatus ?? activeTask.status) !== targetStatus) {
      updateTaskStatus(activeTask.id, targetStatus);
      toast.success(`Tarefa movida para "${columns.find((c) => c.id === targetStatus)?.title}"`);
    }

    setDragOriginStatus(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quadro de Metas</h1>
            <p className="text-muted-foreground">Arraste e solte tarefas entre as colunas</p>
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
                  <Label>Responsáveis (múltiplos)</Label>
                  <div className="flex flex-wrap gap-2 rounded-md border p-2">
                    {profiles.map((p) => (
                      <Badge
                        key={p.id}
                        variant={selectedResponsibles.includes(p.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedResponsibles((prev) =>
                            prev.includes(p.id)
                              ? prev.filter((id) => id !== p.id)
                              : [...prev, p.id]
                          );
                        }}
                      >
                        {p.full_name}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clique para selecionar/remover responsáveis
                  </p>
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

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Meta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Título</Label>
                  <Input
                    id="edit-title"
                    name="title"
                    defaultValue={editingTask?.title}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Descrição</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    rows={3}
                    defaultValue={editingTask?.description}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Prioridade</Label>
                  <Select name="priority" defaultValue={editingTask?.priority} required>
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
                  <Label>Responsáveis (múltiplos)</Label>
                  <div className="flex flex-wrap gap-2 rounded-md border p-2">
                    {profiles.map((p) => (
                      <Badge
                        key={p.id}
                        variant={selectedResponsibles.includes(p.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedResponsibles((prev) =>
                            prev.includes(p.id)
                              ? prev.filter((id) => id !== p.id)
                              : [...prev, p.id]
                          );
                        }}
                      >
                        {p.full_name}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clique para selecionar/remover responsáveis
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-deadline">Prazo (Opcional)</Label>
                  <Input
                    id="edit-deadline"
                    name="deadline"
                    type="datetime-local"
                    defaultValue={
                      editingTask?.deadline
                        ? new Date(editingTask.deadline).toISOString().slice(0, 16)
                        : ""
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-evidence"
                    name="evidence_required"
                    defaultChecked={editingTask?.evidence_required}
                  />
                  <Label htmlFor="edit-evidence">Evidência obrigatória ao concluir</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Salvar Alterações
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditOpen(false);
                      setEditingTask(null);
                      setSelectedResponsibles([]);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {columns.map((column) => {
              const columnTasks = tasks.filter((task) => task.status === column.id);
              return (
                <DroppableColumn key={column.id} column={column}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      {column.title}
                      <Badge variant="secondary" className="ml-2">
                        {columnTasks.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent
                    className="space-y-2 min-h-[200px] p-3"
                  >
                    <SortableContext
                      items={columnTasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                      id={column.id}
                    >
                      {columnTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          profiles={profiles}
                          onEdit={(task) => {
                            setEditingTask(task);
                            setSelectedResponsibles(task.responsible_ids || []);
                            setIsEditOpen(true);
                          }}
                          onDelete={(id) => {
                            setTaskToDelete(id);
                            setDeleteDialogOpen(true);
                          }}
                        />
                      ))}
                    </SortableContext>
                    {columnTasks.length === 0 && (
                      <div
                        className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed border-muted-foreground/20 rounded-lg"
                      >
                        Arraste tarefas aqui
                      </div>
                    )}
                  </CardContent>
                </DroppableColumn>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask ? (
              <Card className="border-2 border-primary shadow-lg rotate-3 w-[300px]">
                <CardContent className="p-2">
                  <div className="mb-1.5 flex items-start gap-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="font-medium text-sm flex-1">
                      {activeTask.title}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>

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
