-- Adicionar coluna para múltiplos responsáveis nas tarefas
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS responsible_ids uuid[];

-- Migrar dados existentes de responsible_id para responsible_ids
UPDATE public.tasks 
SET responsible_ids = ARRAY[responsible_id]
WHERE responsible_id IS NOT NULL AND (responsible_ids IS NULL OR array_length(responsible_ids, 1) IS NULL);

-- Adicionar suporte a links e anexos nas evidências
ALTER TABLE public.evidences 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb;

-- Adicionar suporte a múltiplos anexos nas metodologias
ALTER TABLE public.methodologies 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;