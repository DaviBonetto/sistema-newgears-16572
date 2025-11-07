import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

type SectionType = "innovation" | "robot_design";
type QuadrantType = "identify" | "design" | "create" | "iterate" | "communicate";

export default function FinalProject() {
  const { user } = useAuth();
  const [innovationData, setInnovationData] = useState<any>(null);
  const [robotDesignData, setRobotDesignData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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

  const handleFileUpload = async (sectionType: SectionType, file: File) => {
    if (!user) return;
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${sectionType}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("final-project-files")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Erro ao fazer upload");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("final-project-files")
      .getPublicUrl(filePath);

    const currentData = sectionType === "innovation" ? innovationData : robotDesignData;
    const currentFiles = currentData?.attachments || [];
    const updatedFiles = [...currentFiles, { url: publicUrl, name: file.name }];

    if (currentData?.id) {
      await supabase
        .from("final_project")
        .update({ attachments: updatedFiles })
        .eq("id", currentData.id);
    } else {
      const { data } = await supabase
        .from("final_project")
        .insert({
          section_type: sectionType,
          attachments: updatedFiles,
          created_by: user.id,
        })
        .select()
        .single();

      if (sectionType === "innovation") setInnovationData(data);
      else setRobotDesignData(data);
    }

    toast.success("Upload concluído!");
    fetchProjectData();
    setUploading(false);
  };

  const handleDeleteFile = async (sectionType: SectionType, index: number) => {
    const currentData = sectionType === "innovation" ? innovationData : robotDesignData;
    if (!currentData?.id) return;

    const currentFiles = currentData.attachments || [];
    const fileToDelete = currentFiles[index];
    
    const urlParts = fileToDelete.url.split("/");
    const filePath = `${sectionType}/${urlParts[urlParts.length - 1]}`;

    await supabase.storage.from("final-project-files").remove([filePath]);

    const updatedFiles = currentFiles.filter((_: any, i: number) => i !== index);
    await supabase
      .from("final_project")
      .update({ attachments: updatedFiles })
      .eq("id", currentData.id);

    toast.success("Arquivo removido!");
    fetchProjectData();
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

      {/* Arquivos */}
      <Card>
        <CardHeader>
          <CardTitle>Arquivos Anexados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor={`${sectionType}-file-upload`}>Upload de Arquivo</Label>
            <Input
              id={`${sectionType}-file-upload`}
              type="file"
              accept="image/*,video/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(sectionType, file);
              }}
              disabled={uploading}
            />
          </div>
          <div className="space-y-2">
            {(data?.attachments || []).map((file: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {file.name}
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteFile(sectionType, index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
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

        <Tabs defaultValue="innovation" className="w-full">
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