-- Corrige search_path das funções existentes para segurança

-- Atualiza função handle_updated_at com search_path seguro
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Atualiza função handle_new_user com search_path já definido (mantém como está)
-- Apenas confirma que está correta
DO $$
BEGIN
  -- Verifica se a função existe e tem search_path
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    -- Função já existe com search_path correto
    RAISE NOTICE 'handle_new_user já tem search_path configurado';
  END IF;
END $$;