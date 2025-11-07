export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          activity_description: string
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          activity_description: string
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          activity_description?: string
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brainstorming_canvas: {
        Row: {
          canvas_data: Json | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          canvas_data?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          canvas_data?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          event_date: string
          id: string
          participants: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date: string
          id?: string
          participants?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date?: string
          id?: string
          participants?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_memory: {
        Row: {
          created_at: string | null
          id: string
          memory_summary: string
          metadata: Json | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          memory_summary: string
          metadata?: Json | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          memory_summary?: string
          metadata?: Json | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_memory_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string | null
        }
        Insert: {
          attachments?: Json | null
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id?: string | null
        }
        Update: {
          attachments?: Json | null
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner: string | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evidences: {
        Row: {
          attachments: Json | null
          created_at: string | null
          created_by: string
          file_type: string | null
          file_url: string
          id: string
          links: Json | null
          project_id: string | null
          summary: string
          task_id: string | null
          title: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          created_by: string
          file_type?: string | null
          file_url: string
          id?: string
          links?: Json | null
          project_id?: string | null
          summary: string
          task_id?: string | null
          title: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          created_by?: string
          file_type?: string | null
          file_url?: string
          id?: string
          links?: Json | null
          project_id?: string | null
          summary?: string
          task_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidences_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidences_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      final_project: {
        Row: {
          attachments: Json | null
          communicate_how: string | null
          communicate_main: string | null
          communicate_why: string | null
          create_how: string | null
          create_main: string | null
          create_why: string | null
          created_at: string
          created_by: string | null
          design_how: string | null
          design_main: string | null
          design_why: string | null
          id: string
          identify_how: string | null
          identify_main: string | null
          identify_why: string | null
          iterate_how: string | null
          iterate_main: string | null
          iterate_why: string | null
          pillars: Json | null
          section_type: Database["public"]["Enums"]["project_section"]
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          communicate_how?: string | null
          communicate_main?: string | null
          communicate_why?: string | null
          create_how?: string | null
          create_main?: string | null
          create_why?: string | null
          created_at?: string
          created_by?: string | null
          design_how?: string | null
          design_main?: string | null
          design_why?: string | null
          id?: string
          identify_how?: string | null
          identify_main?: string | null
          identify_why?: string | null
          iterate_how?: string | null
          iterate_main?: string | null
          iterate_why?: string | null
          pillars?: Json | null
          section_type: Database["public"]["Enums"]["project_section"]
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          communicate_how?: string | null
          communicate_main?: string | null
          communicate_why?: string | null
          create_how?: string | null
          create_main?: string | null
          create_why?: string | null
          created_at?: string
          created_by?: string | null
          design_how?: string | null
          design_main?: string | null
          design_why?: string | null
          id?: string
          identify_how?: string | null
          identify_main?: string | null
          identify_why?: string | null
          iterate_how?: string | null
          iterate_main?: string | null
          iterate_why?: string | null
          pillars?: Json | null
          section_type?: Database["public"]["Enums"]["project_section"]
          updated_at?: string
        }
        Relationships: []
      }
      ingested_documents: {
        Row: {
          created_at: string | null
          file_url: string
          filename: string
          id: string
          metadata: Json | null
          text_content: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_url: string
          filename: string
          id?: string
          metadata?: Json | null
          text_content?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_url?: string
          filename?: string
          id?: string
          metadata?: Json | null
          text_content?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingested_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      innovation_project: {
        Row: {
          created_at: string | null
          created_by: string | null
          evidence_ids: string[] | null
          expert_conversations: string | null
          id: string
          impact_plan: string | null
          learnings: string | null
          problem: string | null
          prototyping: string | null
          research_sources: string | null
          rubric_checklist: Json | null
          solution_evolution: string | null
          tests: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          evidence_ids?: string[] | null
          expert_conversations?: string | null
          id?: string
          impact_plan?: string | null
          learnings?: string | null
          problem?: string | null
          prototyping?: string | null
          research_sources?: string | null
          rubric_checklist?: Json | null
          solution_evolution?: string | null
          tests?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          evidence_ids?: string[] | null
          expert_conversations?: string | null
          id?: string
          impact_plan?: string | null
          learnings?: string | null
          problem?: string | null
          prototyping?: string | null
          research_sources?: string | null
          rubric_checklist?: Json | null
          solution_evolution?: string | null
          tests?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "innovation_project_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      methodologies: {
        Row: {
          attachments: Json | null
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          image_url: string | null
          origin: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          image_url?: string | null
          origin?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          image_url?: string | null
          origin?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "methodologies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_runs: {
        Row: {
          created_at: string | null
          executed_by: string | null
          execution_time_seconds: number
          id: string
          ideal_time_seconds: number | null
          mission_name: string
          mission_points: number
          notes: string | null
          success: boolean
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          executed_by?: string | null
          execution_time_seconds: number
          id?: string
          ideal_time_seconds?: number | null
          mission_name: string
          mission_points: number
          notes?: string | null
          success: boolean
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          executed_by?: string | null
          execution_time_seconds?: number
          id?: string
          ideal_time_seconds?: number | null
          mission_name?: string
          mission_points?: number
          notes?: string | null
          success?: boolean
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_runs_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_goals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string
          id: string
          improvements: string | null
          role: string | null
          shift: string | null
          sidebar_collapsed: boolean | null
          strengths: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
          improvements?: string | null
          role?: string | null
          shift?: string | null
          sidebar_collapsed?: boolean | null
          strengths?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          improvements?: string | null
          role?: string | null
          shift?: string | null
          sidebar_collapsed?: boolean | null
          strengths?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      robot_project: {
        Row: {
          created_at: string
          created_by: string | null
          engineering_diary: string | null
          id: string
          materials: string | null
          objective: string | null
          photos: Json | null
          prototypes: string | null
          tests: string | null
          updated_at: string
          videos: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          engineering_diary?: string | null
          id?: string
          materials?: string | null
          objective?: string | null
          photos?: Json | null
          prototypes?: string | null
          tests?: string | null
          updated_at?: string
          videos?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          engineering_diary?: string | null
          id?: string
          materials?: string | null
          objective?: string | null
          photos?: Json | null
          prototypes?: string | null
          tests?: string | null
          updated_at?: string
          videos?: Json | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string | null
          created_by: string | null
          deadline: string | null
          description: string | null
          evidence_required: boolean | null
          id: string
          priority: string | null
          responsible_id: string | null
          responsible_ids: string[] | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          evidence_required?: boolean | null
          id?: string
          priority?: string | null
          responsible_id?: string | null
          responsible_ids?: string[] | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          evidence_required?: boolean | null
          id?: string
          priority?: string | null
          responsible_id?: string | null
          responsible_ids?: string[] | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          attachments: Json | null
          comments: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_date: string
          id: string
          progress: number | null
          responsible_ids: string[] | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          comments?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date: string
          id?: string
          progress?: number | null
          responsible_ids?: string[] | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          comments?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string
          id?: string
          progress?: number | null
          responsible_ids?: string[] | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      project_section: "innovation" | "robot_design"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      project_section: ["innovation", "robot_design"],
    },
  },
} as const
