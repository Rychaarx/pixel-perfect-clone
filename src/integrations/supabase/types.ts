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
      catalog_items: {
        Row: {
          backdrop_url: string | null
          created_at: string
          duration: string | null
          genres: string[] | null
          id: string
          image_url: string | null
          redirect_url: string | null
          status: string
          synopsis: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
          video_url: string | null
          year: string | null
        }
        Insert: {
          backdrop_url?: string | null
          created_at?: string
          duration?: string | null
          genres?: string[] | null
          id?: string
          image_url?: string | null
          redirect_url?: string | null
          status?: string
          synopsis?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
          video_url?: string | null
          year?: string | null
        }
        Update: {
          backdrop_url?: string | null
          created_at?: string
          duration?: string | null
          genres?: string[] | null
          id?: string
          image_url?: string | null
          redirect_url?: string | null
          status?: string
          synopsis?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
          year?: string | null
        }
        Relationships: []
      }
      episodes: {
        Row: {
          created_at: string
          duration: string | null
          episode_number: number
          id: string
          redirect_url: string | null
          season_id: string
          title: string
        }
        Insert: {
          created_at?: string
          duration?: string | null
          episode_number: number
          id?: string
          redirect_url?: string | null
          season_id: string
          title?: string
        }
        Update: {
          created_at?: string
          duration?: string | null
          episode_number?: number
          id?: string
          redirect_url?: string | null
          season_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          catalog_item_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          catalog_item_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          catalog_item_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          catalog_item_id: string
          created_at: string
          id: string
          name: string | null
          season_number: number
        }
        Insert: {
          catalog_item_id: string
          created_at?: string
          id?: string
          name?: string | null
          season_number: number
        }
        Update: {
          catalog_item_id?: string
          created_at?: string
          id?: string
          name?: string | null
          season_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "seasons_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      section_items: {
        Row: {
          catalog_item_id: string
          id: string
          section_id: string
          sort_order: number
        }
        Insert: {
          catalog_item_id: string
          id?: string
          section_id: string
          sort_order?: number
        }
        Update: {
          catalog_item_id?: string
          id?: string
          section_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "section_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          content_type: string
          created_at: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          content_type?: string
          created_at?: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          content_type?: string
          created_at?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          created_at: string
          id: string
          message: string | null
          status: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_default: boolean
          name: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watch_progress: {
        Row: {
          catalog_item_id: string
          episode_id: string
          id: string
          last_watched_at: string
          user_id: string
          watched: boolean
        }
        Insert: {
          catalog_item_id: string
          episode_id: string
          id?: string
          last_watched_at?: string
          user_id: string
          watched?: boolean
        }
        Update: {
          catalog_item_id?: string
          episode_id?: string
          id?: string
          last_watched_at?: string
          user_id?: string
          watched?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "watch_progress_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watch_progress_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      watched_movies: {
        Row: {
          catalog_item_id: string
          id: string
          user_id: string
          watched_at: string
        }
        Insert: {
          catalog_item_id: string
          id?: string
          user_id: string
          watched_at?: string
        }
        Update: {
          catalog_item_id?: string
          id?: string
          user_id?: string
          watched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "watched_movies_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
