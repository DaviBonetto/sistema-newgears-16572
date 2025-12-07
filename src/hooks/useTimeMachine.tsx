import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type EventCategory = 
  | 'meta' 
  | 'tarefa' 
  | 'evidencia' 
  | 'brainstorming' 
  | 'reuniao' 
  | 'decisao' 
  | 'prototipo' 
  | 'teste' 
  | 'feedback' 
  | 'iteracao' 
  | 'comentario' 
  | 'cronograma' 
  | 'timeline'
  | 'metodologia'
  | 'inovacao'
  | 'robot';

export type EventType = 
  | 'criacao' 
  | 'edicao' 
  | 'conclusao' 
  | 'exclusao' 
  | 'upload' 
  | 'comentario'
  | 'iteracao';

export interface TimeMachineEvent {
  id: string;
  event_type: EventType;
  event_category: EventCategory;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  user_id?: string;
  related_event_id?: string;
  attachments?: any[];
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface CreateEventParams {
  event_type: EventType;
  event_category: EventCategory;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  related_event_id?: string;
  attachments?: any[];
}

export function useTimeMachine() {
  const { user } = useAuth();

  const logEvent = async (params: CreateEventParams): Promise<boolean> => {
    if (!user?.id) {
      console.warn("Time Machine: usuário não autenticado");
      return false;
    }

    try {
      const { error } = await supabase
        .from('time_machine_events')
        .insert({
          event_type: params.event_type,
          event_category: params.event_category,
          title: params.title,
          description: params.description || null,
          metadata: params.metadata || {},
          user_id: user.id,
          related_event_id: params.related_event_id || null,
          attachments: params.attachments || []
        });

      if (error) {
        console.error("Erro ao registrar evento Time Machine:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao registrar evento Time Machine:", error);
      return false;
    }
  };

  // Helper functions for common events
  const logMetaCreated = (title: string, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'criacao', event_category: 'meta', title: `Meta criada: ${title}`, metadata });

  const logMetaCompleted = (title: string, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'conclusao', event_category: 'meta', title: `Meta concluída: ${title}`, metadata });

  const logMetaEdited = (title: string, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'edicao', event_category: 'meta', title: `Meta editada: ${title}`, metadata });

  const logTaskCreated = (title: string, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'criacao', event_category: 'tarefa', title: `Tarefa criada: ${title}`, metadata });

  const logTaskCompleted = (title: string, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'conclusao', event_category: 'tarefa', title: `Tarefa concluída: ${title}`, metadata });

  const logEvidenceCreated = (title: string, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'criacao', event_category: 'evidencia', title: `Evidência registrada: ${title}`, metadata });

  const logUpload = (fileName: string, category: EventCategory, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'upload', event_category: category, title: `Arquivo anexado: ${fileName}`, metadata });

  const logBrainstorming = (title: string, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'criacao', event_category: 'brainstorming', title: `Brainstorming: ${title}`, metadata });

  const logPrototype = (title: string, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'criacao', event_category: 'prototipo', title: `Protótipo: ${title}`, metadata });

  const logTest = (title: string, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'criacao', event_category: 'teste', title: `Teste realizado: ${title}`, metadata });

  const logFeedback = (title: string, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'criacao', event_category: 'feedback', title: `Feedback: ${title}`, metadata });

  const logIteration = (title: string, relatedEventId?: string, metadata?: Record<string, any>) => 
    logEvent({ 
      event_type: 'iteracao', 
      event_category: 'iteracao', 
      title: `Iteração: ${title}`, 
      related_event_id: relatedEventId,
      metadata 
    });

  const logDecision = (title: string, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'criacao', event_category: 'decisao', title: `Decisão: ${title}`, metadata });

  const logMeeting = (title: string, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'criacao', event_category: 'reuniao', title: `Reunião: ${title}`, metadata });

  const logTimelineChange = (title: string, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'edicao', event_category: 'timeline', title: `Timeline: ${title}`, metadata });

  const logMethodology = (title: string, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'criacao', event_category: 'metodologia', title: `Metodologia: ${title}`, metadata });

  const logInnovation = (title: string, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'edicao', event_category: 'inovacao', title: `Projeto de Inovação: ${title}`, metadata });

  const logRobot = (title: string, metadata?: Record<string, any>) => 
    logEvent({ event_type: 'edicao', event_category: 'robot', title: `Robô: ${title}`, metadata });

  return {
    logEvent,
    logMetaCreated,
    logMetaCompleted,
    logMetaEdited,
    logTaskCreated,
    logTaskCompleted,
    logEvidenceCreated,
    logUpload,
    logBrainstorming,
    logPrototype,
    logTest,
    logFeedback,
    logIteration,
    logDecision,
    logMeeting,
    logTimelineChange,
    logMethodology,
    logInnovation,
    logRobot
  };
}