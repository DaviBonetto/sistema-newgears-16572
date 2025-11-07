
-- Migration: 20251105014806

-- Migration: 20251105011514

-- Migration: 20251104010812
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  shift TEXT CHECK (shift IN ('Manhã', 'Tarde')),
  role TEXT,
  strengths TEXT,
  improvements TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create tasks table (Kanban)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
  responsible_id UUID REFERENCES public.profiles(id),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  deadline TIMESTAMPTZ,
  evidence_required BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create evidences table
CREATE TABLE public.evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL CHECK (length(summary) >= 50),
  file_url TEXT NOT NULL,
  file_type TEXT,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  project_id UUID,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create methodologies table
CREATE TABLE public.methodologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  origin TEXT,
  tags TEXT[],
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create innovation_project table
CREATE TABLE public.innovation_project (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem TEXT,
  research_sources TEXT,
  expert_conversations TEXT,
  prototyping TEXT,
  tests TEXT,
  learnings TEXT,
  solution_evolution TEXT,
  evidence_ids UUID[],
  impact_plan TEXT,
  rubric_checklist JSONB,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create mission_runs table
CREATE TABLE public.mission_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_name TEXT NOT NULL,
  mission_points INTEGER NOT NULL,
  execution_time_seconds DECIMAL NOT NULL,
  ideal_time_seconds DECIMAL GENERATED ALWAYS AS ((mission_points::DECIMAL / 475.0) * 150.0) STORED,
  video_url TEXT,
  success BOOLEAN NOT NULL,
  notes TEXT,
  executed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create calendar_events table
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  participants UUID[],
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create activity_log table
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  activity_type TEXT NOT NULL,
  activity_description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.methodologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.innovation_project ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- RLS Policies for tasks
CREATE POLICY "Tasks are viewable by authenticated users" 
ON public.tasks FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create tasks" 
ON public.tasks FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update tasks" 
ON public.tasks FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete tasks" 
ON public.tasks FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- RLS Policies for evidences
CREATE POLICY "Evidences are viewable by authenticated users" 
ON public.evidences FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create evidences" 
ON public.evidences FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own evidences" 
ON public.evidences FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own evidences" 
ON public.evidences FOR DELETE 
USING (auth.uid() = created_by);

-- RLS Policies for methodologies
CREATE POLICY "Methodologies are viewable by authenticated users" 
ON public.methodologies FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create methodologies" 
ON public.methodologies FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update methodologies" 
ON public.methodologies FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete methodologies" 
ON public.methodologies FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- RLS Policies for innovation_project
CREATE POLICY "Innovation projects are viewable by authenticated users" 
ON public.innovation_project FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create innovation projects" 
ON public.innovation_project FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update innovation projects" 
ON public.innovation_project FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- RLS Policies for mission_runs
CREATE POLICY "Mission runs are viewable by authenticated users" 
ON public.mission_runs FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create mission runs" 
ON public.mission_runs FOR INSERT 
WITH CHECK (auth.uid() = executed_by);

CREATE POLICY "Users can update their own mission runs" 
ON public.mission_runs FOR UPDATE 
USING (auth.uid() = executed_by);

-- RLS Policies for calendar_events
CREATE POLICY "Calendar events are viewable by authenticated users" 
ON public.calendar_events FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create calendar events" 
ON public.calendar_events FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update calendar events" 
ON public.calendar_events FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete calendar events" 
ON public.calendar_events FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- RLS Policies for activity_log
CREATE POLICY "Activity logs are viewable by authenticated users" 
ON public.activity_log FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create activity logs" 
ON public.activity_log FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_methodologies_updated_at
BEFORE UPDATE ON public.methodologies
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_innovation_project_updated_at
BEFORE UPDATE ON public.innovation_project
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Membro')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for evidences
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidences', 'evidences', true);

-- Storage policies for evidences
CREATE POLICY "Evidence files are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'evidences');

CREATE POLICY "Authenticated users can upload evidence files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'evidences' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own evidence files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'evidences' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own evidence files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'evidences' AND auth.uid() IS NOT NULL);

-- Create storage bucket for methodologies
INSERT INTO storage.buckets (id, name, public)
VALUES ('methodologies', 'methodologies', true);

-- Storage policies for methodologies
CREATE POLICY "Methodology images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'methodologies');

CREATE POLICY "Authenticated users can upload methodology images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'methodologies' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update methodology images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'methodologies' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete methodology images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'methodologies' AND auth.uid() IS NOT NULL);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- Migration: 20251104014816
-- Create timeline_events table
CREATE TABLE public.timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  responsible_ids UUID[],
  progress INTEGER DEFAULT 0,
  attachments JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Timeline events are viewable by authenticated users"
ON public.timeline_events
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create timeline events"
ON public.timeline_events
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update timeline events"
ON public.timeline_events
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete timeline events"
ON public.timeline_events
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_timeline_events_updated_at
BEFORE UPDATE ON public.timeline_events
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for timeline attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('timeline-attachments', 'timeline-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Timeline attachments are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'timeline-attachments');

CREATE POLICY "Authenticated users can upload timeline attachments"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'timeline-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update timeline attachments"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'timeline-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete timeline attachments"
ON storage.objects
FOR DELETE
USING (bucket_id = 'timeline-attachments' AND auth.uid() IS NOT NULL);

-- Insert initial timeline data
INSERT INTO public.timeline_events (title, description, event_date, end_date, status) VALUES
('Definição final das estruturas do sistema GEARS + organização inicial', 'Estruturar completamente o sistema GEARS e organizar as bases do projeto', '2025-11-03', '2025-11-03', 'completed'),
('Inserir metas individuais e coletivas + definir responsáveis', 'Cadastrar todas as metas no sistema e atribuir responsáveis', '2025-11-04', '2025-11-06', 'in_progress'),
('Treinamento interno sobre uso do sistema', 'Capacitar toda a equipe no uso do sistema GEARS', '2025-11-07', '2025-11-07', 'pending'),
('Estruturar projeto de inovação completo + evidências iniciais', 'Documentar todo o projeto de inovação com evidências', '2025-11-08', '2025-11-10', 'pending'),
('Conversa com avaliador/julgador (refinamento total)', 'Reunião para refinar o projeto com feedback de avaliador', '2025-11-11', '2025-11-11', 'pending'),
('Ajustes com base no feedback + completar metodologia visual', 'Implementar ajustes e finalizar metodologias visuais', '2025-11-12', '2025-11-14', 'pending'),
('Marcar reunião e conversar com especialista em fitólitos', 'Agendar e realizar conversa com especialista', '2025-11-15', '2025-11-18', 'pending'),
('Inserir evidências práticas: análises, dados, documentos, fotos', 'Documentar todas as evidências práticas no sistema', '2025-11-19', '2025-11-22', 'pending'),
('Ensaios da apresentação + simulação de banca', 'Treinar apresentação e simular banca avaliadora', '2025-11-23', '2025-11-26', 'pending'),
('Finalizar dossiê + caderno de evidências + pitch', 'Completar toda documentação e pitch', '2025-11-27', '2025-11-30', 'pending'),
('Revisão completa + simulação com "Juiz GPT"', 'Revisar tudo e simular avaliação', '2025-12-01', '2025-12-05', 'pending'),
('Correções finais + material visual + prática final', 'Últimos ajustes e preparação final', '2025-12-06', '2025-12-10', 'pending'),
('Semana final: foco absoluto em ensaios + checklist', 'Ensaios intensivos e checklist completo', '2025-12-11', '2025-12-13', 'pending'),
('Revisão final e descanso estratégico', 'Última revisão e preparação mental', '2025-12-14', '2025-12-14', 'pending'),
('Último ensaio geral + carregamento de arquivos', 'Ensaio final e upload de materiais', '2025-12-15', '2025-12-15', 'pending'),
('🏆 Campeonato', 'DIA DO CAMPEONATO!', '2025-12-16', '2025-12-16', 'pending');

-- Migration: 20251104021830
-- Add custom tags support to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create personal_goals table for private user goals
CREATE TABLE IF NOT EXISTS public.personal_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  target_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on personal_goals
ALTER TABLE public.personal_goals ENABLE ROW LEVEL SECURITY;

-- Users can only view their own personal goals
CREATE POLICY "Users can view their own personal goals"
ON public.personal_goals
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own personal goals
CREATE POLICY "Users can create their own personal goals"
ON public.personal_goals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own personal goals
CREATE POLICY "Users can update their own personal goals"
ON public.personal_goals
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own personal goals
CREATE POLICY "Users can delete their own personal goals"
ON public.personal_goals
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_personal_goals_updated_at
BEFORE UPDATE ON public.personal_goals
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Migration: 20251104024521
-- Create storage buckets for new features
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('robot-files', 'robot-files', true),
  ('brainstorming-images', 'brainstorming-images', true),
  ('final-project-files', 'final-project-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create robot_project table
CREATE TABLE IF NOT EXISTS public.robot_project (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective text,
  prototypes text,
  engineering_diary text,
  materials text,
  photos jsonb DEFAULT '[]'::jsonb,
  videos jsonb DEFAULT '[]'::jsonb,
  tests text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on robot_project
ALTER TABLE public.robot_project ENABLE ROW LEVEL SECURITY;

-- RLS policies for robot_project
CREATE POLICY "Robot project is viewable by authenticated users"
ON public.robot_project
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create robot project"
ON public.robot_project
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update robot project"
ON public.robot_project
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete robot project"
ON public.robot_project
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create brainstorming_canvas table
CREATE TABLE IF NOT EXISTS public.brainstorming_canvas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_data jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on brainstorming_canvas
ALTER TABLE public.brainstorming_canvas ENABLE ROW LEVEL SECURITY;

-- RLS policies for brainstorming_canvas
CREATE POLICY "Brainstorming is viewable by authenticated users"
ON public.brainstorming_canvas
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create brainstorming"
ON public.brainstorming_canvas
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update brainstorming"
ON public.brainstorming_canvas
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete brainstorming"
ON public.brainstorming_canvas
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create section_type enum
CREATE TYPE public.project_section AS ENUM ('innovation', 'robot_design');

-- Create final_project table
CREATE TABLE IF NOT EXISTS public.final_project (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type project_section NOT NULL,
  identify_main text,
  identify_why text,
  identify_how text,
  design_main text,
  design_why text,
  design_how text,
  create_main text,
  create_why text,
  create_how text,
  iterate_main text,
  iterate_why text,
  iterate_how text,
  communicate_main text,
  communicate_why text,
  communicate_how text,
  attachments jsonb DEFAULT '[]'::jsonb,
  pillars jsonb DEFAULT '{"oral": false, "manual": false, "documental": false, "visual": false}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(section_type)
);

-- Enable RLS on final_project
ALTER TABLE public.final_project ENABLE ROW LEVEL SECURITY;

-- RLS policies for final_project
CREATE POLICY "Final project is viewable by authenticated users"
ON public.final_project
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create final project"
ON public.final_project
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update final project"
ON public.final_project
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete final project"
ON public.final_project
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Add triggers for updated_at
CREATE TRIGGER update_robot_project_updated_at
BEFORE UPDATE ON public.robot_project
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_brainstorming_canvas_updated_at
BEFORE UPDATE ON public.brainstorming_canvas
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_final_project_updated_at
BEFORE UPDATE ON public.final_project
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Storage policies for robot-files bucket
CREATE POLICY "Authenticated users can upload robot files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'robot-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view robot files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'robot-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete robot files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'robot-files' AND auth.uid() IS NOT NULL);

-- Storage policies for brainstorming-images bucket
CREATE POLICY "Authenticated users can upload brainstorming images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'brainstorming-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view brainstorming images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'brainstorming-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete brainstorming images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'brainstorming-images' AND auth.uid() IS NOT NULL);

-- Storage policies for final-project-files bucket
CREATE POLICY "Authenticated users can upload final project files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'final-project-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view final project files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'final-project-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete final project files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'final-project-files' AND auth.uid() IS NOT NULL);

-- Migration: 20251104031228
-- Add name field to brainstorming_canvas table
ALTER TABLE public.brainstorming_canvas ADD COLUMN name TEXT NOT NULL DEFAULT 'Sem título';

-- Remove the single row restriction by dropping the unique constraint if it exists
-- This allows multiple brainstorming canvases to be saved;

-- Migration: 20251105004746
-- Create chat_sessions table
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner UUID REFERENCES profiles(id) ON DELETE CASCADE,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create chat_memory table
CREATE TABLE chat_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  memory_summary TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create ingested_documents table
CREATE TABLE ingested_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  text_content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add sidebar preference to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sidebar_collapsed BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingested_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions
CREATE POLICY "Authenticated users can view chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can update their own chat sessions"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = owner);

CREATE POLICY "Users can delete their own chat sessions"
  ON chat_sessions FOR DELETE
  USING (auth.uid() = owner);

-- RLS Policies for chat_messages
CREATE POLICY "Authenticated users can view chat messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for chat_memory
CREATE POLICY "Authenticated users can view chat memory"
  ON chat_memory FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create chat memory"
  ON chat_memory FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for ingested_documents
CREATE POLICY "Authenticated users can view documents"
  ON ingested_documents FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload documents"
  ON ingested_documents FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- Create indexes
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_memory_session ON chat_memory(session_id);
CREATE INDEX idx_ingested_documents_uploaded ON ingested_documents(uploaded_by);

-- Create trigger for updated_at
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create storage bucket for AI documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-documents', 'ai-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ai-documents
CREATE POLICY "Authenticated users can upload AI documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ai-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view their AI documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ai-documents' AND auth.uid() IS NOT NULL);


-- Migration: 20251105012302
-- Create notes table for user annotations
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notes"
  ON public.notes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
  ON public.notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.notes
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- Migration: 20251105020102
-- Add attachments column to notes table
ALTER TABLE public.notes
ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;

-- Create storage bucket for note attachments if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-attachments', 'note-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for note attachments bucket
CREATE POLICY "Users can upload their own note attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'note-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own note attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'note-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own note attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'note-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
