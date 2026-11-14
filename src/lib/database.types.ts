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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          allow_download: boolean
          file_url: string
          id: string
          meta: Json
          post_id: string
          preview_url: string | null
          sort_order: number
          type: Database["public"]["Enums"]["attachment_type"]
        }
        Insert: {
          allow_download?: boolean
          file_url: string
          id?: string
          meta?: Json
          post_id: string
          preview_url?: string | null
          sort_order?: number
          type: Database["public"]["Enums"]["attachment_type"]
        }
        Update: {
          allow_download?: boolean
          file_url?: string
          id?: string
          meta?: Json
          post_id?: string
          preview_url?: string | null
          sort_order?: number
          type?: Database["public"]["Enums"]["attachment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "attachments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
        }
        Insert: {
          author_id?: string
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_post_id_fkey"
            columns: ["parent_id", "post_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id", "post_id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          target_id: string
          target_type: Database["public"]["Enums"]["follow_target_type"]
        }
        Insert: {
          created_at?: string
          follower_id?: string
          target_id: string
          target_type: Database["public"]["Enums"]["follow_target_type"]
        }
        Update: {
          created_at?: string
          follower_id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["follow_target_type"]
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string | null
          created_at: string
          feedback_question: string | null
          id: string
          kind: Database["public"]["Enums"]["post_kind"]
          project_id: string
        }
        Insert: {
          author_id?: string
          body?: string | null
          created_at?: string
          feedback_question?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["post_kind"]
          project_id: string
        }
        Update: {
          author_id?: string
          body?: string | null
          created_at?: string
          feedback_question?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["post_kind"]
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          gt_email: string
          id: string
          major: string | null
          name: string
          skills: string[]
          year: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          gt_email: string
          id: string
          major?: string | null
          name?: string
          skills?: string[]
          year?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          gt_email?: string
          id?: string
          major?: string | null
          name?: string
          skills?: string[]
          year?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          project_id: string
          role_label: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          project_id: string
          role_label?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          project_id?: string
          role_label?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tags: {
        Row: {
          project_id: string
          tag_id: string
        }
        Insert: {
          project_id: string
          tag_id: string
        }
        Update: {
          project_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          cover_url: string | null
          created_at: string
          id: string
          owner_id: string
          problem: string | null
          stage: Database["public"]["Enums"]["project_stage"]
          title: string
          visibility: Database["public"]["Enums"]["project_visibility"]
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          problem?: string | null
          stage?: Database["public"]["Enums"]["project_stage"]
          title: string
          visibility?: Database["public"]["Enums"]["project_visibility"]
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          problem?: string | null
          stage?: Database["public"]["Enums"]["project_stage"]
          title?: string
          visibility?: Database["public"]["Enums"]["project_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string
          post_id: string
          type: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          type: Database["public"]["Enums"]["reaction_type"]
          user_id?: string
        }
        Update: {
          created_at?: string
          post_id?: string
          type?: Database["public"]["Enums"]["reaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streak_freezes: {
        Row: {
          created_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          user_id?: string
          week_start: string
        }
        Update: {
          created_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "streak_freezes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streak_pauses: {
        Row: {
          reason: string
          week_start: string
        }
        Insert: {
          reason: string
          week_start: string
        }
        Update: {
          reason?: string
          week_start?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          type: Database["public"]["Enums"]["tag_type"]
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type: Database["public"]["Enums"]["tag_type"]
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          type?: Database["public"]["Enums"]["tag_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_post: {
        Args: {
          p_attachments: Json
          p_body?: string
          p_feedback_question?: string
          p_kind?: Database["public"]["Enums"]["post_kind"]
          p_project_id: string
        }
        Returns: {
          author_id: string
          body: string | null
          created_at: string
          feedback_question: string | null
          id: string
          kind: Database["public"]["Enums"]["post_kind"]
          project_id: string
        }
        SetofOptions: {
          from: "*"
          to: "posts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      my_streak_status: {
        Args: never
        Returns: {
          freezable_week: string
          freezes_left: number
          streak: number
        }[]
      }
      project_streaks: {
        Args: { p_project_ids: string[] }
        Returns: {
          project_id: string
          streak: number
        }[]
      }
      use_streak_freeze: { Args: never; Returns: string }
      user_activity_weeks: {
        Args: { p_user_id: string; p_weeks?: number }
        Returns: {
          frozen: boolean
          paused: boolean
          post_count: number
          week_start: string
        }[]
      }
      user_streak: { Args: { p_user_id: string }; Returns: number }
    }
    Enums: {
      attachment_type: "photo" | "video" | "pdf" | "link" | "file"
      follow_target_type: "user" | "project" | "tag"
      post_kind: "ship" | "milestone"
      project_stage: "idea" | "prototype" | "launched"
      project_visibility: "public" | "private"
      reaction_type: "kudos" | "use_this" | "can_help" | "tried_this"
      tag_type: "category" | "class" | "club"
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
    Enums: {
      attachment_type: ["photo", "video", "pdf", "link", "file"],
      follow_target_type: ["user", "project", "tag"],
      post_kind: ["ship", "milestone"],
      project_stage: ["idea", "prototype", "launched"],
      project_visibility: ["public", "private"],
      reaction_type: ["kudos", "use_this", "can_help", "tried_this"],
      tag_type: ["category", "class", "club"],
    },
  },
} as const
