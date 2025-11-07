-- Força regeneração dos tipos do Supabase
-- Adiciona um comentário às tabelas existentes para atualizar o schema

COMMENT ON TABLE public.profiles IS 'Perfis dos usuários do sistema';
COMMENT ON TABLE public.tasks IS 'Tarefas e metas da equipe';
COMMENT ON TABLE public.evidences IS 'Evidências e documentação';
COMMENT ON TABLE public.calendar_events IS 'Eventos e atividades';
COMMENT ON TABLE public.mission_runs IS 'Execuções de missões';
COMMENT ON TABLE public.chat_sessions IS 'Sessões de chat do AI';
COMMENT ON TABLE public.chat_messages IS 'Mensagens do chat';
COMMENT ON TABLE public.brainstorming_canvas IS 'Canvas de brainstorming';
COMMENT ON TABLE public.final_project IS 'Documentação do projeto final';
COMMENT ON TABLE public.robot_project IS 'Documentação do robô';
COMMENT ON TABLE public.innovation_project IS 'Projeto de inovação';
COMMENT ON TABLE public.methodologies IS 'Metodologias do time';
COMMENT ON TABLE public.timeline_events IS 'Eventos da linha do tempo';
COMMENT ON TABLE public.notes IS 'Anotações pessoais';
COMMENT ON TABLE public.personal_goals IS 'Metas pessoais';
COMMENT ON TABLE public.activity_log IS 'Log de atividades';
COMMENT ON TABLE public.ingested_documents IS 'Documentos ingeridos para AI';
COMMENT ON TABLE public.chat_memory IS 'Memória do chat AI';