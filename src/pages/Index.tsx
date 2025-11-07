import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Target className="h-10 w-10" />
          </div>
        </div>
        <h1 className="mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-5xl font-bold text-transparent">
          System GEARS
        </h1>
        <p className="mb-8 text-xl text-muted-foreground">
          Organização, metodologia, evidências e inovação em um só lugar. 
          Construído para maximizar a performance e integração do time.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link to="/auth">
            <Button size="lg" className="w-full sm:w-auto">
              Entrar no Sistema
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/tv">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Modo TV
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
