import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link as LinkIcon, Save, ExternalLink } from "lucide-react";
import { useTabPersistence } from "@/hooks/useTabPersistence";
import { useScrollPersistence } from "@/hooks/useScrollPersistence";

export default function Robot() {
  const { user } = useAuth();
  const [systemLink, setSystemLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useTabPersistence("robot");
  useScrollPersistence("robot");

  useEffect(() => {
    fetchRobotLink();
  }, []);

  const fetchRobotLink = async () => {
    const { data } = await supabase
      .from("robot_project")
      .select("objective")
      .limit(1)
      .maybeSingle();

    if (data?.objective) {
      setSystemLink(data.objective);
    }
    setLoading(false);
  };

  const handleSaveLink = async () => {
    if (!systemLink.trim()) {
      toast.error("Por favor, insira um link válido.");
      return;
    }

    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("robot_project")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("robot_project")
          .update({ objective: systemLink, updated_at: new Date().toISOString() })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("robot_project")
          .insert({ objective: systemLink, created_by: user?.id });

        if (error) throw error;
      }

      toast.success("Link salvo com sucesso!");
    } catch (error) {
      console.error("Error saving link:", error);
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-3xl font-bold">🤖 Robô</h1>
          <p className="text-muted-foreground">
            Acesso rápido ao sistema principal do robô
          </p>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <LinkIcon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Link do Sistema do Robô</CardTitle>
            <p className="text-muted-foreground">
              Cole aqui o link do sistema principal do robô para acesso rápido
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="system-link">URL do Sistema</Label>
              <Input
                id="system-link"
                type="url"
                value={systemLink}
                onChange={(e) => setSystemLink(e.target.value)}
                placeholder="https://exemplo.com/sistema-robo"
                className="text-base"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSaveLink}
                disabled={saving}
                className="flex-1"
                size="lg"
              >
                {saving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Link
                  </>
                )}
              </Button>

              {systemLink && (
                <Button
                  variant="outline"
                  onClick={() => window.open(systemLink, "_blank")}
                  size="lg"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir Sistema
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
