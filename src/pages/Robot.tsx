import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Bot, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

export default function Robot() {
  const { user } = useAuth();
  const [robotData, setRobotData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchRobotData();
  }, []);

  const fetchRobotData = async () => {
    const { data } = await supabase
      .from("robot_project")
      .select("*")
      .single();
    setRobotData(data);
    setLoading(false);
  };

  const handleSave = async (field: string, value: string) => {
    if (!user) return;

    if (robotData?.id) {
      const { error } = await supabase
        .from("robot_project")
        .update({ [field]: value })
        .eq("id", robotData.id);

      if (error) toast.error("Erro ao salvar");
      else toast.success("Salvo!");
    } else {
      const { data, error } = await supabase
        .from("robot_project")
        .insert({ [field]: value, created_by: user.id })
        .select()
        .single();

      if (error) toast.error("Erro ao criar");
      else {
        setRobotData(data);
        toast.success("Criado!");
      }
    }
  };

  const handleFileUpload = async (type: "photos" | "videos", file: File) => {
    if (!user) return;
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${type}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("robot-files")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Erro ao fazer upload");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("robot-files")
      .getPublicUrl(filePath);

    const currentFiles = robotData?.[type] || [];
    const updatedFiles = [...currentFiles, { url: publicUrl, name: file.name }];

    if (robotData?.id) {
      await supabase
        .from("robot_project")
        .update({ [type]: updatedFiles })
        .eq("id", robotData.id);
    } else {
      const { data } = await supabase
        .from("robot_project")
        .insert({ [type]: updatedFiles, created_by: user.id })
        .select()
        .single();
      setRobotData(data);
    }

    toast.success("Upload concluído!");
    fetchRobotData();
    setUploading(false);
  };

  const handleDeleteFile = async (type: "photos" | "videos", index: number) => {
    if (!robotData?.id) return;

    const currentFiles = robotData[type] || [];
    const fileToDelete = currentFiles[index];
    
    // Extract file path from URL
    const urlParts = fileToDelete.url.split("/");
    const filePath = `${type}/${urlParts[urlParts.length - 1]}`;

    await supabase.storage.from("robot-files").remove([filePath]);

    const updatedFiles = currentFiles.filter((_: any, i: number) => i !== index);
    await supabase
      .from("robot_project")
      .update({ [type]: updatedFiles })
      .eq("id", robotData.id);

    toast.success("Arquivo removido!");
    fetchRobotData();
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
            <Bot className="h-8 w-8 text-primary" />
            Robô
          </h1>
          <p className="text-muted-foreground">Documentação completa do robô</p>
        </div>

        <div className="grid gap-6">
          {/* Objetivo */}
          <Card>
            <CardHeader>
              <CardTitle>Objetivo</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                defaultValue={robotData?.objective || ""}
                onBlur={(e) => handleSave("objective", e.target.value)}
                placeholder="Descreva o objetivo do robô..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Protótipos */}
          <Card>
            <CardHeader>
              <CardTitle>Protótipos</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                defaultValue={robotData?.prototypes || ""}
                onBlur={(e) => handleSave("prototypes", e.target.value)}
                placeholder="Descreva os protótipos desenvolvidos..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Diário de Engenharia */}
          <Card>
            <CardHeader>
              <CardTitle>Diário de Engenharia</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                defaultValue={robotData?.engineering_diary || ""}
                onBlur={(e) => handleSave("engineering_diary", e.target.value)}
                placeholder="Registre o processo de desenvolvimento..."
                rows={6}
              />
            </CardContent>
          </Card>

          {/* Materiais */}
          <Card>
            <CardHeader>
              <CardTitle>Materiais</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                defaultValue={robotData?.materials || ""}
                onBlur={(e) => handleSave("materials", e.target.value)}
                placeholder="Liste os materiais utilizados..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Fotos */}
          <Card>
            <CardHeader>
              <CardTitle>Fotos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="photo-upload">Upload de Foto</Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload("photos", file);
                  }}
                  disabled={uploading}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(robotData?.photos || []).map((photo: any, index: number) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteFile("photos", index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vídeos */}
          <Card>
            <CardHeader>
              <CardTitle>Vídeos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="video-upload">Upload de Vídeo</Label>
                <Input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload("videos", file);
                  }}
                  disabled={uploading}
                />
              </div>
              <div className="space-y-2">
                {(robotData?.videos || []).map((video: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {video.name}
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFile("videos", index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Testes */}
          <Card>
            <CardHeader>
              <CardTitle>Testes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                defaultValue={robotData?.tests || ""}
                onBlur={(e) => handleSave("tests", e.target.value)}
                placeholder="Documente os testes realizados..."
                rows={6}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}