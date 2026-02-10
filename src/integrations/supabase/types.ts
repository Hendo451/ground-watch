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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      games: {
        Row: {
          countdown_end: string | null
          created_at: string
          end_time: string
          grade_id: string | null
          heat_status: Database["public"]["Enums"]["heat_status"]
          id: string
          last_heat_check_at: string | null
          last_humidity: number | null
          last_strike_at: string | null
          last_strike_distance: number | null
          last_temp_c: number | null
          name: string | null
          start_time: string
          status: Database["public"]["Enums"]["lightning_status"]
          updated_at: string
          venue_id: string
          warmup_minutes: number
          weather_icon: string | null
        }
        Insert: {
          countdown_end?: string | null
          created_at?: string
          end_time: string
          grade_id?: string | null
          heat_status?: Database["public"]["Enums"]["heat_status"]
          id?: string
          last_heat_check_at?: string | null
          last_humidity?: number | null
          last_strike_at?: string | null
          last_strike_distance?: number | null
          last_temp_c?: number | null
          name?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["lightning_status"]
          updated_at?: string
          venue_id: string
          warmup_minutes?: number
          weather_icon?: string | null
        }
        Update: {
          countdown_end?: string | null
          created_at?: string
          end_time?: string
          grade_id?: string | null
          heat_status?: Database["public"]["Enums"]["heat_status"]
          id?: string
          last_heat_check_at?: string | null
          last_humidity?: number | null
          last_strike_at?: string | null
          last_strike_distance?: number | null
          last_temp_c?: number | null
          name?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["lightning_status"]
          updated_at?: string
          venue_id?: string
          warmup_minutes?: number
          weather_icon?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      heat_alerts: {
        Row: {
          alert_type: string
          game_id: string | null
          heat_status: Database["public"]["Enums"]["heat_status"]
          humidity: number
          id: string
          message: string
          official_id: string | null
          sent_at: string
          temp_c: number
          venue_id: string | null
        }
        Insert: {
          alert_type: string
          game_id?: string | null
          heat_status: Database["public"]["Enums"]["heat_status"]
          humidity: number
          id?: string
          message: string
          official_id?: string | null
          sent_at?: string
          temp_c: number
          venue_id?: string | null
        }
        Update: {
          alert_type?: string
          game_id?: string | null
          heat_status?: Database["public"]["Enums"]["heat_status"]
          humidity?: number
          id?: string
          message?: string
          official_id?: string | null
          sent_at?: string
          temp_c?: number
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "heat_alerts_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heat_alerts_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heat_alerts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      lightning_alerts: {
        Row: {
          alert_type: string
          distance_km: number | null
          game_id: string | null
          id: string
          message: string
          official_id: string | null
          sent_at: string
          venue_id: string | null
        }
        Insert: {
          alert_type: string
          distance_km?: number | null
          game_id?: string | null
          id?: string
          message: string
          official_id?: string | null
          sent_at?: string
          venue_id?: string | null
        }
        Update: {
          alert_type?: string
          distance_km?: number | null
          game_id?: string | null
          id?: string
          message?: string
          official_id?: string | null
          sent_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lightning_alerts_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lightning_alerts_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lightning_alerts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      officials: {
        Row: {
          alerts_enabled: boolean
          created_at: string
          id: string
          mobile: string
          name: string
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          alerts_enabled?: boolean
          created_at?: string
          id?: string
          mobile: string
          name: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          alerts_enabled?: boolean
          created_at?: string
          id?: string
          mobile?: string
          name?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "officials_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      training_exceptions: {
        Row: {
          created_at: string
          exception_date: string
          id: string
          is_cancelled: boolean
          override_end_time: string | null
          override_start_time: string | null
          override_venue_id: string | null
          reason: string | null
          training_id: string
        }
        Insert: {
          created_at?: string
          exception_date: string
          id?: string
          is_cancelled?: boolean
          override_end_time?: string | null
          override_start_time?: string | null
          override_venue_id?: string | null
          reason?: string | null
          training_id: string
        }
        Update: {
          created_at?: string
          exception_date?: string
          id?: string
          is_cancelled?: boolean
          override_end_time?: string | null
          override_start_time?: string | null
          override_venue_id?: string | null
          reason?: string | null
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_exceptions_override_venue_id_fkey"
            columns: ["override_venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_exceptions_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          created_at: string
          day_of_week: number
          end_date: string | null
          end_time: string
          grade_id: string | null
          id: string
          name: string
          start_date: string
          start_time: string
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_date?: string | null
          end_time: string
          grade_id?: string | null
          id?: string
          name: string
          start_date: string
          start_time: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_date?: string | null
          end_time?: string
          grade_id?: string | null
          id?: string
          name?: string
          start_date?: string
          start_time?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainings_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string
          safe_zone_radius: number
          sport_intensity: Database["public"]["Enums"]["sport_intensity"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          safe_zone_radius?: number
          sport_intensity?: Database["public"]["Enums"]["sport_intensity"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          safe_zone_radius?: number
          sport_intensity?: Database["public"]["Enums"]["sport_intensity"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "viewer"
      heat_status: "low" | "moderate" | "high" | "extreme"
      lightning_status: "green" | "orange" | "red"
      sport_intensity: "category_1" | "category_2" | "category_3"
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
      app_role: ["admin", "viewer"],
      heat_status: ["low", "moderate", "high", "extreme"],
      lightning_status: ["green", "orange", "red"],
      sport_intensity: ["category_1", "category_2", "category_3"],
    },
  },
} as const
