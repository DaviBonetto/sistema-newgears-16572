import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function ProfileSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    const { error } = await supabase
      .from("profiles")
      .update({
        shift: formData.get("shift") as string,
        role: formData.get("role") as string,
        strengths: formData.get("strengths") as string,
        improvements: formData.get("improvements") as string,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao salvar perfil: " + error.message);
      setIsLoading(false);
    } else {
      toast.success("Perfil configurado com sucesso!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Complete seu Perfil</CardTitle>
          <CardDescription>
            Adicione informações sobre você para o time conhecer melhor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shift">Turno</Label>
                <Select name="shift" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manhã">Manhã</SelectItem>
                    <SelectItem value="Tarde">Tarde</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Input
                  id="role"
                  name="role"
                  type="text"
                  placeholder="Ex: Programador, Designer..."
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strengths">Pontos Fortes</Label>
              <Textarea
                id="strengths"
                name="strengths"
                placeholder="Descreva seus pontos fortes..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="improvements">Pontos a Melhorar</Label>
              <Textarea
                id="improvements"
                name="improvements"
                placeholder="Áreas que você quer desenvolver..."
                rows={3}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar e Continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
