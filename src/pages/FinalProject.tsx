import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTabPersistence } from "@/hooks/useTabPersistence";
import { useScrollPersistence } from "@/hooks/useScrollPersistence";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy } from "lucide-react";
import { toast } from "sonner";
import { MultiUpload } from "@/components/MultiUpload";

type SectionType = "innovation" | "robot_design";
type QuadrantType = "identify" | "design" | "create" | "iterate" | "communicate";

export default function FinalProject() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useTabPersistence("innovation");
  const [innovationData, setInnovationData] = useState<any>(null);
  const [robotDesignData, setRobotDesignData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useScrollPersistence(activeTab);

  useEffect(() => {
    fetchProjectData();
  }, []);

  const fetchProjectData = async () => {
    const { data: innovation } = await supabase
      .from("final_project")
      .select("*")
      .eq("section_type", "innovation")
      .single();

    const { data: robotDesign } = await supabase
      .from("final_project")
      .select("*")
      .eq("section_type", "robot_design")
      .single();

    setInnovationData(innovation);
    setRobotDesignData(robotDesign);
    setLoading(false);
  };

  const handleSave = async (
    sectionType: SectionType,
    field: string,
    value: string
  ) => {
    if (!user) return;

    const currentData = sectionType === "innovation" ? innovationData : robotDesignData;

    if (currentData?.id) {
      const { error } = await supabase
        .from("final_project")
        .update({ [field]: value })
        .eq("id", currentData.id);

      if (error) toast.error("Erro ao salvar");
      else toast.success("Salvo!");
    } else {
      const { data, error } = await supabase
        .from("final_project")
        .insert({
          section_type: sectionType,
          [field]: value,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) toast.error("Erro ao criar");
      else {
        if (sectionType === "innovation") setInnovationData(data);
        else setRobotDesignData(data);
        toast.success("Criado!");
      }
    }
  };

  const handlePillarToggle = async (
    sectionType: SectionType,
    pillar: string,
    checked: boolean
  ) => {
    const currentData = sectionType === "innovation" ? innovationData : robotDesignData;
    if (!currentData?.id) return;

    const updatedPillars = {
      ...(currentData.pillars || {}),
      [pillar]: checked,
    };

    const { error } = await supabase
      .from("final_project")
      .update({ pillars: updatedPillars })
      .eq("id", currentData.id);

    if (error) toast.error("Erro ao atualizar");
    else {
      if (sectionType === "innovation") {
        setInnovationData({ ...currentData, pillars: updatedPillars });
      } else {
        setRobotDesignData({ ...currentData, pillars: updatedPillars });
      }
      toast.success("Atualizado!");
    }
  };

  const handleAttachmentsChange = async (
    sectionType: SectionType,
    attachments: any[]
  ) => {
    if (!user) return;

    const currentData = sectionType === "innovation" ? innovationData : robotDesignData;

    try {
      if (currentData?.id) {
        const { error } = await supabase
          .from("final_project")
          .update({ attachments: attachments as any })
          .eq("id", currentData.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("final_project")
          .insert([{
            section_type: sectionType,
            attachments: attachments as any,
            created_by: user.id,
          }])
          .select()
          .single();

        if (error) throw error;

        if (sectionType === "innovation") {
          setInnovationData(data);
        } else {
          setRobotDesignData(data);
        }
      }

      // Update local state
      if (sectionType === "innovation") {
        setInnovationData({ ...currentData, attachments });
      } else {
        setRobotDesignData({ ...currentData, attachments });
      }

      toast.success("Anexos atualizados!");
    } catch (error) {
      console.error("Error updating attachments:", error);
      toast.error("Erro ao atualizar anexos. Tente novamente.");
    }
  };

  const renderQuadrant = (
    sectionType: SectionType,
    quadrant: QuadrantType,
    title: string,
    data: any
  ) => {
    const mainField = `${quadrant}_main`;
    const whyField = `${quadrant}_why`;
    const howField = `${quadrant}_how`;

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Principal</Label>
            <Textarea
              defaultValue={data?.[mainField] || ""}
              onBlur={(e) => handleSave(sectionType, mainField, e.target.value)}
              placeholder="Descreva o principal..."
              rows={3}
            />
          </div>
          <div>
            <Label>Por quê?</Label>
            <Textarea
              defaultValue={data?.[whyField] || ""}
              onBlur={(e) => handleSave(sectionType, whyField, e.target.value)}
              placeholder="Por quê isso é importante?"
              rows={2}
            />
          </div>
          <div>
            <Label>Como?</Label>
            <Textarea
              defaultValue={data?.[howField] || ""}
              onBlur={(e) => handleSave(sectionType, howField, e.target.value)}
              placeholder="Como foi feito?"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSection = (sectionType: SectionType, data: any, title: string) => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{title}</h2>

      {/* Quadrantes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {renderQuadrant(sectionType, "identify", "Identify", data)}
        {renderQuadrant(sectionType, "design", "Design", data)}
        {renderQuadrant(sectionType, "create", "Create", data)}
        {renderQuadrant(sectionType, "iterate", "Iterate", data)}
        {renderQuadrant(sectionType, "communicate", "Communicate", data)}
      </div>

      {/* Pilares */}
      <Card>
        <CardHeader>
          <CardTitle>Pilares</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["oral", "manual", "documental", "visual"].map((pillar) => (
              <div key={pillar} className="flex items-center space-x-2">
                <Checkbox
                  id={`${sectionType}-${pillar}`}
                  checked={data?.pillars?.[pillar] || false}
                  onCheckedChange={(checked) =>
                    handlePillarToggle(sectionType, pillar, checked as boolean)
                  }
                />
                <label
                  htmlFor={`${sectionType}-${pillar}`}
                  className="text-sm font-medium capitalize cursor-pointer"
                >
                  {pillar}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anexos e Links */}
      <Card>
        <CardHeader>
          <CardTitle>Anexos e Links</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiUpload
            bucket="final-project-files"
            attachments={data?.attachments || []}
            onUpdate={(attachments) => handleAttachmentsChange(sectionType, attachments)}
            userId={user?.id || ""}
          />
        </CardContent>
      </Card>
    </div>
  );

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
            <Trophy className="h-8 w-8 text-primary" />
            Projeto Final
          </h1>
          <p className="text-muted-foreground">
            Documentação completa do projeto final
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="innovation">Projeto de Inovação</TabsTrigger>
            <TabsTrigger value="robot">Design do Robô</TabsTrigger>
          </TabsList>
          <TabsContent value="innovation" className="mt-6">
            {renderSection("innovation", innovationData, "Projeto de Inovação")}
          </TabsContent>
          <TabsContent value="robot" className="mt-6">
            {renderSection("robot_design", robotDesignData, "Design do Robô")}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}