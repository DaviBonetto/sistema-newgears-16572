-- Força regeneração completa dos tipos
-- Adiciona índices para melhorar performance

CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_responsible ON public.tasks(responsible_id);
CREATE INDEX IF NOT EXISTS idx_evidences_created ON public.evidences(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_mission_runs_created ON public.mission_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON public.timeline_events(event_date);
CREATE INDEX IF NOT EXISTS idx_notes_user ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_goals_user ON public.personal_goals(user_id);