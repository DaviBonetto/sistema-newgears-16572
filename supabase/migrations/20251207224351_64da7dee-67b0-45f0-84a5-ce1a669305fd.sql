-- Create the time_machine_events table to store all project evolution history
CREATE TABLE public.time_machine_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  related_event_id UUID REFERENCES public.time_machine_events(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_time_machine_events_created_at ON public.time_machine_events(created_at DESC);
CREATE INDEX idx_time_machine_events_category ON public.time_machine_events(event_category);
CREATE INDEX idx_time_machine_events_user_id ON public.time_machine_events(user_id);

-- Enable Row Level Security
ALTER TABLE public.time_machine_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Time machine events viewable by authenticated users"
ON public.time_machine_events
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create time machine events"
ON public.time_machine_events
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own events"
ON public.time_machine_events
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
ON public.time_machine_events
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for time_machine_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_machine_events;

-- Add comment for documentation
COMMENT ON TABLE public.time_machine_events IS 'Stores all project evolution events for the Time Machine feature';