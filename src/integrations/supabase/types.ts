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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      custom_fields_config: {
        Row: {
          created_at: string
          event_id: string
          field_type: Database["public"]["Enums"]["field_type"]
          id: string
          is_active: boolean
          key: string
          label: string
          labels: Json | null
          link_type: Database["public"]["Enums"]["link_type"]
          options: Json | null
          order_index: number
          required: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          field_type: Database["public"]["Enums"]["field_type"]
          id?: string
          is_active?: boolean
          key: string
          label: string
          labels?: Json | null
          link_type: Database["public"]["Enums"]["link_type"]
          options?: Json | null
          order_index?: number
          required?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          field_type?: Database["public"]["Enums"]["field_type"]
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          labels?: Json | null
          link_type?: Database["public"]["Enums"]["link_type"]
          options?: Json | null
          order_index?: number
          required?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_fields_config_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_languages: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_default: boolean
          locale: string
          translations: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_default?: boolean
          locale: string
          translations?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_default?: boolean
          locale?: string
          translations?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_languages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          accordion_form_enabled: boolean | null
          client_access_enabled: boolean | null
          client_password: string | null
          client_username: string | null
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          location: string | null
          modern_style_enabled: boolean | null
          short_code: string | null
          site_description: string | null
          site_title: string | null
          slug: string
          theme: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          accordion_form_enabled?: boolean | null
          client_access_enabled?: boolean | null
          client_password?: string | null
          client_username?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          location?: string | null
          modern_style_enabled?: boolean | null
          short_code?: string | null
          site_description?: string | null
          site_title?: string | null
          slug?: string
          theme?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          accordion_form_enabled?: boolean | null
          client_access_enabled?: boolean | null
          client_password?: string | null
          client_username?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          location?: string | null
          modern_style_enabled?: boolean | null
          short_code?: string | null
          site_description?: string | null
          site_title?: string | null
          slug?: string
          theme?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      guests: {
        Row: {
          created_at: string
          email: string | null
          event_id: string
          first_name: string | null
          full_name: string | null
          group_name: string | null
          id: string
          language: string | null
          last_name: string | null
          men_count: number
          notes: string | null
          phone: string | null
          short_code: string | null
          updated_at: string
          women_count: number
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_id: string
          first_name?: string | null
          full_name?: string | null
          group_name?: string | null
          id?: string
          language?: string | null
          last_name?: string | null
          men_count?: number
          notes?: string | null
          phone?: string | null
          short_code?: string | null
          updated_at?: string
          women_count?: number
        }
        Update: {
          created_at?: string
          email?: string | null
          event_id?: string
          first_name?: string | null
          full_name?: string | null
          group_name?: string | null
          id?: string
          language?: string | null
          last_name?: string | null
          men_count?: number
          notes?: string | null
          phone?: string | null
          short_code?: string | null
          updated_at?: string
          women_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          created_at: string
          event_id: string
          expires_at: string | null
          guest_id: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          settings: Json | null
          slug: string
          type: Database["public"]["Enums"]["link_type"]
          updated_at: string
          uses_count: number
        }
        Insert: {
          created_at?: string
          event_id: string
          expires_at?: string | null
          guest_id?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          settings?: Json | null
          slug: string
          type: Database["public"]["Enums"]["link_type"]
          updated_at?: string
          uses_count?: number
        }
        Update: {
          created_at?: string
          event_id?: string
          expires_at?: string | null
          guest_id?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          settings?: Json | null
          slug?: string
          type?: Database["public"]["Enums"]["link_type"]
          updated_at?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvp_submissions: {
        Row: {
          answers: Json
          event_id: string
          first_name: string | null
          full_name: string | null
          guest_id: string | null
          id: string
          last_name: string | null
          link_id: string | null
          men_count: number
          status: string
          submitted_at: string
          updated_at: string
          women_count: number
        }
        Insert: {
          answers?: Json
          event_id: string
          first_name?: string | null
          full_name?: string | null
          guest_id?: string | null
          id?: string
          last_name?: string | null
          link_id?: string | null
          men_count?: number
          status?: string
          submitted_at?: string
          updated_at?: string
          women_count?: number
        }
        Update: {
          answers?: Json
          event_id?: string
          first_name?: string | null
          full_name?: string | null
          guest_id?: string | null
          id?: string
          last_name?: string | null
          link_id?: string | null
          men_count?: number
          status?: string
          submitted_at?: string
          updated_at?: string
          women_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvp_submissions_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvp_submissions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
        ]
      }
      short_urls: {
        Row: {
          clicks_count: number
          created_at: string
          id: string
          is_active: boolean
          slug: string
          target_url: string
          updated_at: string
        }
        Insert: {
          clicks_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          slug: string
          target_url: string
          updated_at?: string
        }
        Update: {
          clicks_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          slug?: string
          target_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_languages: {
        Row: {
          code: string
          created_at: string
          flag: string | null
          name: string
          native_name: string
          rtl: boolean
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          flag?: string | null
          name: string
          native_name: string
          rtl?: boolean
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          flag?: string | null
          name?: string
          native_name?: string
          rtl?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_event_code: { Args: never; Returns: string }
      generate_guest_code: { Args: { p_event_id: string }; Returns: string }
      get_guest_name_by_phone: {
        Args: { _event_id: string; _phone: string }
        Returns: string
      }
    }
    Enums: {
      field_type:
        | "text"
        | "number"
        | "select"
        | "checkbox"
        | "textarea"
        | "email"
      link_type: "open" | "personal"
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
      field_type: ["text", "number", "select", "checkbox", "textarea", "email"],
      link_type: ["open", "personal"],
    },
  },
} as const
