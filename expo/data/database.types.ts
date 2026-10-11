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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          avg_hr: number | null
          avg_watts: number | null
          date: string
          discipline: string | null
          distance_m: number | null
          elapsed_s: number | null
          elev_m: number | null
          external_id: string
          max_hr: number | null
          moving_s: number | null
          raw: Json | null
          source: string
          sport: string | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          avg_hr?: number | null
          avg_watts?: number | null
          date: string
          discipline?: string | null
          distance_m?: number | null
          elapsed_s?: number | null
          elev_m?: number | null
          external_id: string
          max_hr?: number | null
          moving_s?: number | null
          raw?: Json | null
          source: string
          sport?: string | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          avg_hr?: number | null
          avg_watts?: number | null
          date?: string
          discipline?: string | null
          distance_m?: number | null
          elapsed_s?: number | null
          elev_m?: number | null
          external_id?: string
          max_hr?: number | null
          moving_s?: number | null
          raw?: Json | null
          source?: string
          sport?: string | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          activity_id: string | null
          created_at: string
          date: string
          energia: number | null
          id: string
          molestia: Json | null
          nota: string | null
          nutricion: Json | null
          rpe: number | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          date: string
          energia?: number | null
          id?: string
          molestia?: Json | null
          nota?: string | null
          nutricion?: Json | null
          rpe?: number | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          date?: string
          energia?: number | null
          id?: string
          molestia?: Json | null
          nota?: string | null
          nutricion?: Json | null
          rpe?: number | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "plan_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          created_at: string
          nonce: string
          provider: string
          user_id: string
        }
        Insert: {
          created_at?: string
          nonce: string
          provider: string
          user_id: string
        }
        Update: {
          created_at?: string
          nonce?: string
          provider?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_blocks: {
        Row: {
          active: boolean
          created_at: string
          event_date: string | null
          event_name: string | null
          goal: string | null
          id: string
          name: string
          race_id: string | null
          start_monday: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          event_date?: string | null
          event_name?: string | null
          goal?: string | null
          id?: string
          name: string
          race_id?: string | null
          start_monday: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          event_date?: string | null
          event_name?: string | null
          goal?: string | null
          id?: string
          name?: string
          race_id?: string | null
          start_monday?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_blocks_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_sessions: {
        Row: {
          activity_id: string | null
          date: string
          discipline: string | null
          id: string
          optional: boolean
          order_index: number
          origin: string
          overrides: Json | null
          prescription: Json
          session_id: string
          slot: string
          status: string
          title: string | null
          updated_at: string
          user_id: string
          week_id: string
        }
        Insert: {
          activity_id?: string | null
          date: string
          discipline?: string | null
          id?: string
          optional?: boolean
          order_index?: number
          origin?: string
          overrides?: Json | null
          prescription?: Json
          session_id: string
          slot?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
          week_id: string
        }
        Update: {
          activity_id?: string | null
          date?: string
          discipline?: string | null
          id?: string
          optional?: boolean
          order_index?: number
          origin?: string
          overrides?: Json | null
          prescription?: Json
          session_id?: string
          slot?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_sessions_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "plan_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_weeks: {
        Row: {
          block_id: string
          briefing_md: string | null
          coach_note: string | null
          feedback: string | null
          focus: string | null
          generated_by: string
          id: string
          kind: string
          monday: string
          status: string
          targets: Json
          updated_at: string
          user_id: string
          week_index: number
        }
        Insert: {
          block_id: string
          briefing_md?: string | null
          coach_note?: string | null
          feedback?: string | null
          focus?: string | null
          generated_by?: string
          id?: string
          kind: string
          monday: string
          status?: string
          targets?: Json
          updated_at?: string
          user_id: string
          week_index: number
        }
        Update: {
          block_id?: string
          briefing_md?: string | null
          coach_note?: string | null
          feedback?: string | null
          focus?: string | null
          generated_by?: string
          id?: string
          kind?: string
          monday?: string
          status?: string
          targets?: Json
          updated_at?: string
          user_id?: string
          week_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_weeks_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "plan_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      push_config: {
        Row: {
          id: boolean
          shared_key: string
          vapid_keys: Json
        }
        Insert: {
          id?: boolean
          shared_key: string
          vapid_keys: Json
        }
        Update: {
          id?: boolean
          shared_key?: string
          vapid_keys?: Json
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          expo_token: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          expo_token: string
          platform?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          expo_token?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      races: {
        Row: {
          activity_ids: string[]
          climate: Json
          created_at: string
          date: string
          id: string
          kind: string
          location: string | null
          logistics: Json
          medal_path: string | null
          name: string
          priority: string | null
          profile: Json
          result: Json | null
          start_local: string | null
          status: string
          strategy_md: string | null
          user_id: string
        }
        Insert: {
          activity_ids?: string[]
          climate?: Json
          created_at?: string
          date: string
          id?: string
          kind: string
          location?: string | null
          logistics?: Json
          medal_path?: string | null
          name: string
          priority?: string | null
          profile?: Json
          result?: Json | null
          start_local?: string | null
          status?: string
          strategy_md?: string | null
          user_id: string
        }
        Update: {
          activity_ids?: string[]
          climate?: Json
          created_at?: string
          date?: string
          id?: string
          kind?: string
          location?: string | null
          logistics?: Json
          medal_path?: string | null
          name?: string
          priority?: string | null
          profile?: Json
          result?: Json | null
          start_local?: string | null
          status?: string
          strategy_md?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recovery_daily: {
        Row: {
          date: string
          hrv_ms: number | null
          recovery_pct: number | null
          rhr_bpm: number | null
          sleep_h: number | null
          sleep_perf_pct: number | null
          source: string
          strain: number | null
          user_id: string
        }
        Insert: {
          date: string
          hrv_ms?: number | null
          recovery_pct?: number | null
          rhr_bpm?: number | null
          sleep_h?: number | null
          sleep_perf_pct?: number | null
          source?: string
          strain?: number | null
          user_id: string
        }
        Update: {
          date?: string
          hrv_ms?: number | null
          recovery_pct?: number | null
          rhr_bpm?: number | null
          sleep_h?: number | null
          sleep_perf_pct?: number | null
          source?: string
          strain?: number | null
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          anchor_monday: string
          updated_at: string
          user_id: string
          zones: Json | null
        }
        Insert: {
          anchor_monday?: string
          updated_at?: string
          user_id?: string
          zones?: Json | null
        }
        Update: {
          anchor_monday?: string
          updated_at?: string
          user_id?: string
          zones?: Json | null
        }
        Relationships: []
      }
      strava_config: {
        Row: {
          client_id: string
          client_secret: string
          id: boolean
        }
        Insert: {
          client_id: string
          client_secret: string
          id?: boolean
        }
        Update: {
          client_id?: string
          client_secret?: string
          id?: boolean
        }
        Relationships: []
      }
      strava_tokens: {
        Row: {
          access_token: string
          athlete_id: number | null
          expires_at: number
          refresh_token: string
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          athlete_id?: number | null
          expires_at: number
          refresh_token: string
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          access_token?: string
          athlete_id?: number | null
          expires_at?: number
          refresh_token?: string
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whoop_config: {
        Row: {
          client_id: string
          client_secret: string
          id: number
        }
        Insert: {
          client_id: string
          client_secret: string
          id?: number
        }
        Update: {
          client_id?: string
          client_secret?: string
          id?: number
        }
        Relationships: []
      }
      whoop_tokens: {
        Row: {
          access_token: string
          expires_at: number
          refresh_token: string
          scope: string | null
          updated_at: string
          user_id: string
          whoop_user_id: string | null
        }
        Insert: {
          access_token: string
          expires_at: number
          refresh_token: string
          scope?: string | null
          updated_at?: string
          user_id: string
          whoop_user_id?: string | null
        }
        Update: {
          access_token?: string
          expires_at?: number
          refresh_token?: string
          scope?: string | null
          updated_at?: string
          user_id?: string
          whoop_user_id?: string | null
        }
        Relationships: []
      }
      workout_log: {
        Row: {
          date: string
          done_at: string
          exercises: Json | null
          id: string
          metrics: Json | null
          session_id: string
          source: string
          status: string
          user_id: string
        }
        Insert: {
          date: string
          done_at?: string
          exercises?: Json | null
          id?: string
          metrics?: Json | null
          session_id: string
          source?: string
          status: string
          user_id?: string
        }
        Update: {
          date?: string
          done_at?: string
          exercises?: Json | null
          id?: string
          metrics?: Json | null
          session_id?: string
          source?: string
          status?: string
          user_id?: string
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
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
