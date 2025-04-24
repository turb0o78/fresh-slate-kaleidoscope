export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      downloaded_videos: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          expires_at: string
          id: string
          processing_status: string | null
          storage_path: string
          tiktok_video_id: string
          user_id: string
          workflow_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          expires_at: string
          id?: string
          processing_status?: string | null
          storage_path: string
          tiktok_video_id: string
          user_id: string
          workflow_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string
          id?: string
          processing_status?: string | null
          storage_path?: string
          tiktok_video_id?: string
          user_id?: string
          workflow_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          created_at: string | null
          id: string
          is_paid: boolean
          product_id: string
          quantity: number
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_paid?: boolean
          product_id: string
          quantity?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_paid?: boolean
          product_id?: string
          quantity?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean
          created_at: string | null
          description: string | null
          features: Json
          id: string
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          description?: string | null
          features?: Json
          id?: string
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string | null
          description?: string | null
          features?: Json
          id?: string
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          media_urls: string[] | null
          platform_post_ids: Json | null
          scheduled_for: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          workflow_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          media_urls?: string[] | null
          platform_post_ids?: Json | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          workflow_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          media_urls?: string[] | null
          platform_post_ids?: Json | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_workflow_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          code: string
          completed_at: string | null
          created_at: string | null
          id: string
          referee_id: string
          referrer_id: string
          reward_claimed: boolean | null
          status: string
        }
        Insert: {
          code: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referee_id: string
          referrer_id: string
          reward_claimed?: boolean | null
          status?: string
        }
        Update: {
          code?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referee_id?: string
          referrer_id?: string
          reward_claimed?: boolean | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["code"]
          },
        ]
      }
      social_connections: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          platform: string
          platform_user_id: string
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: string
          platform: string
          platform_user_id: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          platform?: string
          platform_user_id?: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          active: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          plan_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_queue: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          metadata: Json | null
          platform_media_id: string
          processed_at: string | null
          source_platform: string
          status: string
          target_platforms: string[]
          updated_at: string | null
          workflow_id: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          platform_media_id: string
          processed_at?: string | null
          source_platform: string
          status?: string
          target_platforms: string[]
          updated_at?: string | null
          workflow_id: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          platform_media_id?: string
          processed_at?: string | null
          source_platform?: string
          status?: string
          target_platforms?: string[]
          updated_at?: string | null
          workflow_id?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          source_platform: string
          target_platforms: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          source_platform: string
          target_platforms: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          source_platform?: string
          target_platforms?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
