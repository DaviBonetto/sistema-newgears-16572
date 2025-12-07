import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useScrollPersistence } from "@/hooks/useScrollPersistence";
import { MultiUpload } from "@/components/MultiUpload";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Attachment {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  storagePath?: string;
}

export default function Innovation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectionAttachments, setSectionAttachments] = useState<{ [key: string]: Attachment[] }>({});
  const [customSections, setCustomSections] = useState<any[]>([]);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useScrollPersistence();

  const defaultSections = [
    { key: "problem", label: "Problema Identificado" },
    { key: "research_sources", label: "Fontes Pesquisadas" },
    { key: "expert_conversations", label: "Conversas com Especialistas" },
    { key: "prototyping", label: "Prototipagem" },
    { key: "tests", label: "Testes Realizados" },
    { key: "learnings", label: "Aprendizados" },
    { key: "solution_evolution", label: "Evolução da Solução" },
    { key: "impact_plan", label: "Plano de Impacto" },
  ];

  useEffect(() => {
    fetchProject();
  }, []);

  // Load attachments from localStorage when project loads
  useEffect(() => {
    if (project?.id) {
      const saved = localStorage.getItem(`innovation-attachments-${project.id}`);
      if (saved) {
        try {
          setSectionAttachments(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing saved attachments:", e);
        }
      }
    }
  }, [project?.id]);

  // Auto-save attachments to localStorage when they change
  useEffect(() => {
    if (!project?.id || Object.keys(sectionAttachments).length === 0) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Save to localStorage immediately
    localStorage.setItem(`innovation-attachments-${project.id}`, JSON.stringify(sectionAttachments));

  }, [sectionAttachments, project?.id]);

  const fetchProject = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const { data, error } = await supabase
        .from("innovation_project")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setProject(data);
      } else {
        await createInitialProject();
      }
    } catch (error: any) {
      console.error("Erro ao carregar projeto:", error);
      setError("Erro ao carregar projeto. Tente recarregar a página.");
      toast.error("Erro ao carregar projeto");
    } finally {
      setLoading(false);
    }
  };

  const createInitialProject = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("innovation_project")
        .insert({
          created_by: user.id,
          problem: "",
          research_sources: "",
          expert_conversations: "",
          prototyping: "",
          tests: "",
          learnings: "",
          solution_evolution: "",
          impact_plan: ""
        })
        .select()
        .single();

      if (error) throw error;
      setProject(data);
      toast.success("Projeto inicial criado!");
    } catch (error: any) {
      console.error("Erro ao criar projeto inicial:", error);
      throw error;
    }
  };

  const handleUpdate = async (field: string, value: string) => {
    if (!user) return;

    try {
      if (project) {
        const { error } = await supabase
          .from("innovation_project")
          .update({ [field]: value, updated_at: new Date().toISOString() })
          .eq("id", project.id);

        if (error) throw error;
        setProject((prev: any) => ({ ...prev, [field]: value }));
        toast.success("Salvo automaticamente!");
      } else {
        const { data, error } = await supabase
          .from("innovation_project")
          .insert({
            [field]: value,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        setProject(data);
        toast.success("Projeto criado!");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar. Tente novamente.");
    }
  };

  const updateSectionAttachments = (sectionKey: string, attachments: Attachment[]) => {
    setSectionAttachments(prev => {
      const updated = { ...prev, [sectionKey]: attachments };
      return updated;
    });
    toast.success("Anexos salvos!");
  };

  const handleAddSection = () => {
    const sectionName = prompt("Digite o nome da nova seção:");
    if (sectionName) {
      setCustomSections([
        ...customSections,
        { key: `custom_${Date.now()}`, label: sectionName },
      ]);
    }
  };

  const handleRemoveSection = (key: string) => {
    if (confirm("Tem certeza que deseja excluir esta seção?")) {
      setCustomSections(customSections.filter((s) => s.key !== key));
      toast.success("Seção removida!");
    }
  };

  const sections = [...defaultSections, ...customSections];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando projeto de inovação...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-destructive mb-4">
              <Trophy className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar projeto</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchProject} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Trophy className="h-8 w-8 text-secondary" />
              Projeto de Inovação
            </h1>
            <p className="text-muted-foreground">
              Documentação estruturada para o projeto do torneio
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleAddSection} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Seção Personalizada
          </Button>
        </div>

        <div className="space-y-4">
          {sections.map((section) => {
            const isCustom = section.key.startsWith("custom_");
            return (
              <Card key={section.key}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{section.label}</CardTitle>
                    {isCustom && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveSection(section.key)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Textarea
                        defaultValue={project?.[section.key] || ""}
                        rows={6}
                        placeholder={`Descreva ${section.label.toLowerCase()}...`}
                        onBlur={(e) => {
                          if (e.target.value !== project?.[section.key]) {
                            handleUpdate(section.key, e.target.value);
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        As alterações são salvas automaticamente ao sair do campo
                      </p>
                    </div>

                    {/* Media Upload */}
                    <div className="space-y-2">
                      <Label>Imagens, Vídeos e Links</Label>
                      <MultiUpload
                        bucket="evidences"
                        attachments={sectionAttachments[section.key] || []}
                        onUpdate={(atts) => updateSectionAttachments(section.key, atts)}
                        userId={user?.id || ""}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Checklist da Rubrica</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use esta seção para acompanhar manualmente os critérios da rubrica do torneio.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button size="lg">
            <Trophy className="mr-2 h-5 w-5" />
            Exportar Dossiê (PDF)
          </Button>
        </div>
      </div>
    </Layout>
  );
}