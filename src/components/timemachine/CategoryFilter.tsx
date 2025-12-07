import { 
  Target, CheckSquare, FileText, Brain, Users, GitBranch,
  Beaker, MessageSquare, RefreshCw, Calendar, Clock,
  Lightbulb, Bot, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EventCategory } from "@/hooks/useTimeMachine";

interface CategoryFilterProps {
  selectedCategories: EventCategory[];
  onToggle: (category: EventCategory) => void;
  onClear: () => void;
  onSelectAll: () => void;
}

const categoryConfig: { category: EventCategory; icon: React.ElementType; color: string; label: string }[] = [
  { category: 'meta', icon: Target, color: "bg-blue-500", label: "Metas" },
  { category: 'tarefa', icon: CheckSquare, color: "bg-green-500", label: "Tarefas" },
  { category: 'evidencia', icon: FileText, color: "bg-purple-500", label: "Evidências" },
  { category: 'brainstorming', icon: Brain, color: "bg-yellow-500", label: "Brainstorming" },
  { category: 'reuniao', icon: Users, color: "bg-pink-500", label: "Reuniões" },
  { category: 'decisao', icon: GitBranch, color: "bg-orange-500", label: "Decisões" },
  { category: 'prototipo', icon: Lightbulb, color: "bg-cyan-500", label: "Protótipos" },
  { category: 'teste', icon: Beaker, color: "bg-red-500", label: "Testes" },
  { category: 'feedback', icon: MessageSquare, color: "bg-indigo-500", label: "Feedbacks" },
  { category: 'iteracao', icon: RefreshCw, color: "bg-teal-500", label: "Iterações" },
  { category: 'metodologia', icon: BookOpen, color: "bg-lime-500", label: "Metodologias" },
  { category: 'inovacao', icon: Lightbulb, color: "bg-violet-500", label: "Inovação" },
  { category: 'robot', icon: Bot, color: "bg-emerald-500", label: "Robô" },
];

export function CategoryFilter({ 
  selectedCategories, 
  onToggle, 
  onClear, 
  onSelectAll 
}: CategoryFilterProps) {
  const allSelected = selectedCategories.length === categoryConfig.length;
  const noneSelected = selectedCategories.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Filtrar por Categoria</p>
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onSelectAll}
            disabled={allSelected}
          >
            Todos
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onClear}
            disabled={noneSelected}
          >
            Limpar
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {categoryConfig.map(({ category, icon: Icon, color, label }) => {
          const isSelected = selectedCategories.includes(category);
          
          return (
            <Button
              key={category}
              size="sm"
              variant={isSelected ? "default" : "outline"}
              onClick={() => onToggle(category)}
              className={cn(
                "gap-1.5 transition-all",
                isSelected && color,
                isSelected && "text-white border-transparent"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}