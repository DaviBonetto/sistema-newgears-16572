import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NavigationProvider } from "./contexts/NavigationContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Evidences from "./pages/Evidences";
import Calendar from "./pages/Calendar";
import Missions from "./pages/Missions";
import Timeline from "./pages/Timeline";
import TimelineTV from "./pages/TimelineTV";
import Team from "./pages/Team";
import Methodologies from "./pages/Methodologies";
import Innovation from "./pages/Innovation";
import Robot from "./pages/Robot";
import Brainstorming from "./pages/Brainstorming";
import FinalProject from "./pages/FinalProject";
import Profile from "./pages/Profile";
import TVMode from "./pages/TVMode";
import AI from "./pages/AI";
import Notes from "./pages/Notes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NavigationProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/evidences" element={<ProtectedRoute><Evidences /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
            <Route path="/timeline-tv" element={<TimelineTV />} />
            <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
            <Route path="/methodologies" element={<ProtectedRoute><Methodologies /></ProtectedRoute>} />
            <Route path="/innovation" element={<ProtectedRoute><Innovation /></ProtectedRoute>} />
            <Route path="/robot" element={<ProtectedRoute><Robot /></ProtectedRoute>} />
            <Route path="/brainstorming" element={<ProtectedRoute><Brainstorming /></ProtectedRoute>} />
            <Route path="/final-project" element={<ProtectedRoute><FinalProject /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/ai" element={<ProtectedRoute><AI /></ProtectedRoute>} />
            <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
            <Route path="/tv" element={<TVMode />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </NavigationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
