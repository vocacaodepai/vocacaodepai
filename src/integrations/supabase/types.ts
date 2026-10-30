export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          author_email: string;
          author_name: string;
          content: string;
          created_at: string;
          id: string;
          mother_signature: string | null;
          post_id: string;
          status: string;
        };
        Insert: {
          author_email: string;
          author_name: string;
          content: string;
          created_at?: string;
          id?: string;
          mother_signature?: string | null;
          post_id: string;
          status?: string;
        };
        Update: {
          author_email?: string;
          author_name?: string;
          content?: string;
          created_at?: string;
          id?: string;
          mother_signature?: string | null;
          post_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
          subject: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
          subject?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          subject?: string | null;
        };
        Relationships: [];
      };
      poll_responses: {
        Row: {
          created_at: string;
          id: string;
          option_index: number;
          poll_id: string;
          user_key: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          option_index: number;
          poll_id: string;
          user_key: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          option_index?: number;
          poll_id?: string;
          user_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "poll_responses_poll_id_fkey";
            columns: ["poll_id"];
            isOneToOne: false;
            referencedRelation: "polls";
            referencedColumns: ["id"];
          },
        ];
      };
      polls: {
        Row: {
          created_at: string;
          id: string;
          options: Json;
          post_id: string;
          question: string;
          votes: number[];
        };
        Insert: {
          created_at?: string;
          id?: string;
          options?: Json;
          post_id: string;
          question: string;
          votes?: number[];
        };
        Update: {
          created_at?: string;
          id?: string;
          options?: Json;
          post_id?: string;
          question?: string;
          votes?: number[];
        };
        Relationships: [
          {
            foreignKeyName: "polls_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_reactions: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          type: string;
          user_id: string | null;
          user_key: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          type: string;
          user_id?: string | null;
          user_key: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          type?: string;
          user_id?: string | null;
          user_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          author_id: string | null;
          body: Json;
          category_id: string | null;
          cover_image_alt: string | null;
          cover_image_url: string | null;
          created_at: string;
          excerpt: string | null;
          faq: Json;
          id: string;
          like_count: number;
          publish_at: string | null;
          quiz: Json;
          search_content: string;
          seo_meta_description: string | null;
          seo_meta_title: string | null;
          slug: string;
          status: string;
          subtitle: string | null;
          tags: string[];
          title: string;
          updated_at: string;
          view_count: number;
        };
        Insert: {
          author_id?: string | null;
          body?: Json;
          category_id?: string | null;
          cover_image_alt?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          excerpt?: string | null;
          faq?: Json;
          id?: string;
          like_count?: number;
          publish_at?: string | null;
          quiz?: Json;
          search_content?: string;
          seo_meta_description?: string | null;
          seo_meta_title?: string | null;
          slug: string;
          status?: string;
          subtitle?: string | null;
          tags?: string[];
          title: string;
          updated_at?: string;
          view_count?: number;
        };
        Update: {
          author_id?: string | null;
          body?: Json;
          category_id?: string | null;
          cover_image_alt?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          excerpt?: string | null;
          faq?: Json;
          id?: string;
          like_count?: number;
          publish_at?: string | null;
          quiz?: Json;
          search_content?: string;
          seo_meta_description?: string | null;
          seo_meta_title?: string | null;
          slug?: string;
          status?: string;
          subtitle?: string | null;
          tags?: string[];
          title?: string;
          updated_at?: string;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "public_authors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      product_favorites: {
        Row: {
          created_at: string;
          product_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          product_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_favorites_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_authors";
            referencedColumns: ["id"];
          },
        ];
      };
      product_reviews: {
        Row: {
          author_name: string;
          content: string;
          created_at: string;
          id: string;
          product_id: string;
          rating: number;
          source: string;
          title: string | null;
        };
        Insert: {
          author_name: string;
          content: string;
          created_at?: string;
          id?: string;
          product_id: string;
          rating: number;
          source?: string;
          title?: string | null;
        };
        Update: {
          author_name?: string;
          content?: string;
          created_at?: string;
          id?: string;
          product_id?: string;
          rating?: number;
          source?: string;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          active: boolean;
          affiliate_url: string;
          age_range: string | null;
          audience: string | null;
          badge: string | null;
          brand: string | null;
          category: string | null;
          cons: Json;
          created_at: string;
          description: string | null;
          featured: boolean;
          id: string;
          image_url: string | null;
          images: string[];
          isbn: string | null;
          name: string;
          old_price: string | null;
          price: string | null;
          price_checked_at: string | null;
          price_min: number | null;
          price_max: number | null;
          price_range_checked_at: string | null;
          review: Json | null;
          pros: Json;
          rating: number | null;
          review_count: number | null;
          short_description: string | null;
          slug: string;
          sort_order: number;
          subcategory: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          affiliate_url: string;
          age_range?: string | null;
          audience?: string | null;
          badge?: string | null;
          brand?: string | null;
          category?: string | null;
          cons?: Json;
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          id?: string;
          image_url?: string | null;
          images?: string[];
          isbn?: string | null;
          name: string;
          old_price?: string | null;
          price?: string | null;
          price_checked_at?: string | null;
          price_min?: number | null;
          price_max?: number | null;
          price_range_checked_at?: string | null;
          review?: Json | null;
          pros?: Json;
          rating?: number | null;
          review_count?: number | null;
          short_description?: string | null;
          slug: string;
          sort_order?: number;
          subcategory?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          affiliate_url?: string;
          age_range?: string | null;
          audience?: string | null;
          badge?: string | null;
          brand?: string | null;
          category?: string | null;
          cons?: Json;
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          id?: string;
          image_url?: string | null;
          images?: string[];
          isbn?: string | null;
          name?: string;
          old_price?: string | null;
          price?: string | null;
          price_checked_at?: string | null;
          price_min?: number | null;
          price_max?: number | null;
          price_range_checked_at?: string | null;
          review?: Json | null;
          pros?: Json;
          rating?: number | null;
          review_count?: number | null;
          short_description?: string | null;
          slug?: string;
          sort_order?: number;
          subcategory?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          children: Json;
          created_at: string;
          enxoval_done: Json;
          full_name: string;
          id: string;
          mother_signature: string | null;
          role: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          children?: Json;
          created_at?: string;
          enxoval_done?: Json;
          full_name: string;
          id?: string;
          mother_signature?: string | null;
          role?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          children?: Json;
          created_at?: string;
          enxoval_done?: Json;
          full_name?: string;
          id?: string;
          mother_signature?: string | null;
          role?: string;
        };
        Relationships: [];
      };
      quiz_attempts: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          score: number;
          total: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          score: number;
          total: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          score?: number;
          total?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_authors";
            referencedColumns: ["id"];
          },
        ];
      };
      stories: {
        Row: {
          author_name: string;
          category: string;
          content: string;
          created_at: string;
          id: string;
          photo_url: string | null;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          author_name: string;
          category?: string;
          content: string;
          created_at?: string;
          id?: string;
          photo_url?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          author_name?: string;
          category?: string;
          content?: string;
          created_at?: string;
          id?: string;
          photo_url?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stories_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_authors";
            referencedColumns: ["id"];
          },
        ];
      };
      subscribers: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          source: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          source?: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          source?: string;
          status?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      public_authors: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          full_name: string | null;
          id: string | null;
          role: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          full_name?: string | null;
          id?: string | null;
          role?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          full_name?: string | null;
          id?: string | null;
          role?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      admin_list_comments: {
        Args: { p_status?: string };
        Returns: {
          author_email: string;
          author_name: string;
          content: string;
          created_at: string;
          id: string;
          mother_signature: string | null;
          post_id: string;
          status: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "comments";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      ensure_profile: {
        Args: never;
        Returns: {
          avatar_url: string | null;
          bio: string | null;
          children: Json;
          created_at: string;
          enxoval_done: Json;
          full_name: string;
          id: string;
          mother_signature: string | null;
          role: string;
        };
        SetofOptions: {
          from: "*";
          to: "profiles";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      get_my_profile: {
        Args: never;
        Returns: {
          avatar_url: string | null;
          bio: string | null;
          children: Json;
          created_at: string;
          enxoval_done: Json;
          full_name: string;
          id: string;
          mother_signature: string | null;
          role: string;
        };
        SetofOptions: {
          from: "*";
          to: "profiles";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      is_staff: { Args: never; Returns: boolean };
      moderate_story: {
        Args: { p_status: string; p_story_id: string };
        Returns: undefined;
      };
      post_reaction_state: {
        Args: { p_post_id: string; p_user_key?: string };
        Returns: {
          liked: boolean;
          likes: number;
          saved: boolean;
          saves: number;
        }[];
      };
      quiz_ranking: {
        Args: { p_limit?: number };
        Returns: {
          full_name: string;
          points: number;
          quizzes: number;
          user_id: string;
        }[];
      };
      register_view: { Args: { p_post_id: string }; Returns: undefined };
      submit_quiz: {
        Args: { p_post_id: string; p_score: number; p_total: number };
        Returns: Json;
      };
      toggle_reaction: {
        Args: { p_post_id: string; p_type: string; p_user_key: string };
        Returns: {
          active: boolean;
          count: number;
        }[];
      };
      vote_poll: {
        Args: { p_option: number; p_poll_id: string; p_user_key: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
