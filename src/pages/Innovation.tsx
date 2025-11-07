import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useScrollPersistence } from "@/hooks/useScrollPersistence";
import { MultiUpload } from "@/components/MultiUpload";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function Innovation() {
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useScrollPersistence();

  useEffect(() => {
    fetchProject();
  }, []);

  const fetchProject = async () => {
    const { data } = await supabase
      .from("innovation_project")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setProject(data);
    }
    setLoading(false);
  };

  const handleUpdate = async (field: string, value: string) => {
    if (!user) return;

    if (project) {
      const { error } = await supabase
        .from("innovation_project")
        .update({ [field]: value })
        .eq("id", project.id);

      if (error) {
        toast.error("Erro ao salvar");
      } else {
        toast.success("Salvo com sucesso!");
        fetchProject();
      }
    } else {
      const { error } = await supabase
        .from("innovation_project")
        .insert({
          [field]: value,
          created_by: user.id,
        });

      if (error) {
        toast.error("Erro ao criar projeto");
      } else {
        toast.success("Projeto criado!");
        fetchProject();
      }
    }
  };

  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [customSections, setCustomSections] = useState<any[]>([]);
  const [sectionAttachments, setSectionAttachments] = useState<{ [key: string]: any[] }>({});

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

  const handleFileUpload = async (file: File, section: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${section}/${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("evidences")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Erro ao fazer upload");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("evidences")
      .getPublicUrl(fileName);

    const newFile = {
      url: urlData.publicUrl,
      name: file.name,
      type: file.type,
      section: section,
    };

    setMediaFiles([...mediaFiles, newFile]);
    toast.success("Arquivo anexado!");
  };

  const handleRemoveFile = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    toast.success("Arquivo removido!");
  };

  const updateSectionAttachments = (sectionKey: string, attachments: any[]) => {
    setSectionAttachments((prev) => ({ ...prev, [sectionKey]: attachments }));
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
            <Trophy className="h-8 w-8 text-secondary" />
            Projeto de Inovação
          </h1>
          <p className="text-muted-foreground">
            Documentação estruturada para o projeto do torneio
          </p>
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
              Implemente checkboxes personalizados conforme necessário.
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
