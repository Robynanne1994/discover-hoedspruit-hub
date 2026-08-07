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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_user_notes: {
        Row: {
          created_at: string
          note: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          note?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          note?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_update_broadcasts: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          pushed_count: number
          recipient_count: number
          sent_by: string | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          pushed_count?: number
          recipient_count?: number
          sent_by?: string | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          pushed_count?: number
          recipient_count?: number
          sent_by?: string | null
          title?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author: string | null
          body: string
          category: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_published: boolean
          published_at: string
          read_time: number | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          body: string
          category: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          published_at?: string
          read_time?: number | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          body?: string
          category?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          published_at?: string
          read_time?: number | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      been_here: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "been_here_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      bush_telegraph_resources: {
        Row: {
          admin_name: string | null
          admins: Json
          created_at: string
          cta_label: string | null
          description: string | null
          detail_image_url: string | null
          homepage_image_url: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          meta: string | null
          meta_2: string | null
          platform: string
          post_frequency: string | null
          qr_image_url: string | null
          resource_type: string
          saved_image_url: string | null
          since_year: number | null
          slug: string | null
          sort_order: number
          tag_1: string | null
          tag_2: string | null
          title: string
          title_override: string | null
          updated_at: string
          url: string
          years_running: number | null
        }
        Insert: {
          admin_name?: string | null
          admins?: Json
          created_at?: string
          cta_label?: string | null
          description?: string | null
          detail_image_url?: string | null
          homepage_image_url?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          meta?: string | null
          meta_2?: string | null
          platform: string
          post_frequency?: string | null
          qr_image_url?: string | null
          resource_type?: string
          saved_image_url?: string | null
          since_year?: number | null
          slug?: string | null
          sort_order?: number
          tag_1?: string | null
          tag_2?: string | null
          title: string
          title_override?: string | null
          updated_at?: string
          url: string
          years_running?: number | null
        }
        Update: {
          admin_name?: string | null
          admins?: Json
          created_at?: string
          cta_label?: string | null
          description?: string | null
          detail_image_url?: string | null
          homepage_image_url?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          meta?: string | null
          meta_2?: string | null
          platform?: string
          post_frequency?: string | null
          qr_image_url?: string | null
          resource_type?: string
          saved_image_url?: string | null
          since_year?: number | null
          slug?: string | null
          sort_order?: number
          tag_1?: string | null
          tag_2?: string | null
          title?: string
          title_override?: string | null
          updated_at?: string
          url?: string
          years_running?: number | null
        }
        Relationships: []
      }
      business_accounts: {
        Row: {
          business_name: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          subscription_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          subscription_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          subscription_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          kind: string
          link: string | null
          push: boolean
          ref_id: string | null
          ref_table: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          kind: string
          link?: string | null
          push?: boolean
          ref_id?: string | null
          ref_table?: string | null
          status: string
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          link?: string | null
          push?: boolean
          ref_id?: string | null
          ref_table?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          image_url: string | null
          is_quick_category: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          image_url?: string | null
          is_quick_category?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          image_url?: string | null
          is_quick_category?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      claim_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          listing_id: string
          note: string | null
          proof_contact: string | null
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          listing_id: string
          note?: string | null
          proof_contact?: string | null
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          note?: string | null
          proof_contact?: string | null
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      collection_items: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          listing_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          listing_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      email_verification_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          last_sent_at: string
          purpose: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          last_sent_at?: string
          purpose: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          last_sent_at?: string
          purpose?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          additional_emails: string[]
          additional_phones: string[]
          additional_whatsapps: string[]
          booking_link: string | null
          booking_link_label: string | null
          business_id: string | null
          business_ids: string[] | null
          contact_email: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          date: string
          description: string | null
          detail_image_url: string | null
          end_date: string | null
          end_time: string | null
          gallery_images: string[] | null
          google_maps_link: string | null
          homepage_image_url: string | null
          hosted_by_image_url: string | null
          hosted_by_image_url_2: string | null
          hosted_by_image_url_3: string | null
          hosted_by_link: string | null
          hosted_by_link_2: string | null
          hosted_by_link_3: string | null
          hosted_by_name: string | null
          hosted_by_name_2: string | null
          hosted_by_name_3: string | null
          hosted_by_subtitle: string | null
          hosted_by_subtitle_2: string | null
          hosted_by_subtitle_3: string | null
          id: string
          image_url: string | null
          included: string[]
          is_featured: boolean
          location: string | null
          notes: string[]
          performances: Json | null
          price: string | null
          price_notes: string[]
          recurrence: string | null
          saved_image_url: string | null
          social_media_label: string | null
          social_media_link: string | null
          start_date: string | null
          start_time: string | null
          sub_tag_1: string | null
          sub_tag_2: string | null
          tag: string | null
          title: string
          title_override: string | null
          updated_at: string
        }
        Insert: {
          additional_emails?: string[]
          additional_phones?: string[]
          additional_whatsapps?: string[]
          booking_link?: string | null
          booking_link_label?: string | null
          business_id?: string | null
          business_ids?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          date: string
          description?: string | null
          detail_image_url?: string | null
          end_date?: string | null
          end_time?: string | null
          gallery_images?: string[] | null
          google_maps_link?: string | null
          homepage_image_url?: string | null
          hosted_by_image_url?: string | null
          hosted_by_image_url_2?: string | null
          hosted_by_image_url_3?: string | null
          hosted_by_link?: string | null
          hosted_by_link_2?: string | null
          hosted_by_link_3?: string | null
          hosted_by_name?: string | null
          hosted_by_name_2?: string | null
          hosted_by_name_3?: string | null
          hosted_by_subtitle?: string | null
          hosted_by_subtitle_2?: string | null
          hosted_by_subtitle_3?: string | null
          id?: string
          image_url?: string | null
          included?: string[]
          is_featured?: boolean
          location?: string | null
          notes?: string[]
          performances?: Json | null
          price?: string | null
          price_notes?: string[]
          recurrence?: string | null
          saved_image_url?: string | null
          social_media_label?: string | null
          social_media_link?: string | null
          start_date?: string | null
          start_time?: string | null
          sub_tag_1?: string | null
          sub_tag_2?: string | null
          tag?: string | null
          title: string
          title_override?: string | null
          updated_at?: string
        }
        Update: {
          additional_emails?: string[]
          additional_phones?: string[]
          additional_whatsapps?: string[]
          booking_link?: string | null
          booking_link_label?: string | null
          business_id?: string | null
          business_ids?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          date?: string
          description?: string | null
          detail_image_url?: string | null
          end_date?: string | null
          end_time?: string | null
          gallery_images?: string[] | null
          google_maps_link?: string | null
          homepage_image_url?: string | null
          hosted_by_image_url?: string | null
          hosted_by_image_url_2?: string | null
          hosted_by_image_url_3?: string | null
          hosted_by_link?: string | null
          hosted_by_link_2?: string | null
          hosted_by_link_3?: string | null
          hosted_by_name?: string | null
          hosted_by_name_2?: string | null
          hosted_by_name_3?: string | null
          hosted_by_subtitle?: string | null
          hosted_by_subtitle_2?: string | null
          hosted_by_subtitle_3?: string | null
          id?: string
          image_url?: string | null
          included?: string[]
          is_featured?: boolean
          location?: string | null
          notes?: string[]
          performances?: Json | null
          price?: string | null
          price_notes?: string[]
          recurrence?: string | null
          saved_image_url?: string | null
          social_media_label?: string | null
          social_media_link?: string | null
          start_date?: string | null
          start_time?: string | null
          sub_tag_1?: string | null
          sub_tag_2?: string | null
          tag?: string | null
          title?: string
          title_override?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      events_pending: {
        Row: {
          admin_note: string | null
          created_at: string
          event_id: string | null
          feature_requested: boolean
          id: string
          listing_id: string | null
          owner_id: string
          payload: Json
          resolved_at: string | null
          status: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          event_id?: string | null
          feature_requested?: boolean
          id?: string
          listing_id?: string | null
          owner_id: string
          payload?: Json
          resolved_at?: string | null
          status?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          event_id?: string | null
          feature_requested?: boolean
          id?: string
          listing_id?: string | null
          owner_id?: string
          payload?: Json
          resolved_at?: string | null
          status?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_visible: boolean
          question: string
          section: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_visible?: boolean
          question: string
          section: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          question?: string
          section?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      favourites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          feature_end: string | null
          feature_start: string | null
          id: string
          item_id: string | null
          item_type: string
          owner_id: string
          payment_intent_id: string | null
          payment_status: string | null
          pending_id: string | null
          resolved_at: string | null
          status: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          feature_end?: string | null
          feature_start?: string | null
          id?: string
          item_id?: string | null
          item_type: string
          owner_id: string
          payment_intent_id?: string | null
          payment_status?: string | null
          pending_id?: string | null
          resolved_at?: string | null
          status?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          feature_end?: string | null
          feature_start?: string | null
          id?: string
          item_id?: string | null
          item_type?: string
          owner_id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          pending_id?: string | null
          resolved_at?: string | null
          status?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          admin_reply: string | null
          created_at: string
          feedback_type: string
          id: string
          image_url: string | null
          image_urls: string[] | null
          is_read: boolean
          message: string
          replied_at: string | null
          replied_by: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          feedback_type: string
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_read?: boolean
          message: string
          replied_at?: string | null
          replied_by?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_read?: boolean
          message?: string
          replied_at?: string | null
          replied_by?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["follow_status"]
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["follow_status"]
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["follow_status"]
        }
        Relationships: []
      }
      icon_overrides: {
        Row: {
          id: string
          image_url: string
          slot: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          image_url: string
          slot: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          image_url?: string
          slot?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      listing_categories: {
        Row: {
          category_id: string
          id: string
          listing_id: string
        }
        Insert: {
          category_id: string
          id?: string
          listing_id: string
        }
        Update: {
          category_id?: string
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_categories_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_category_order: {
        Row: {
          category_id: string
          created_at: string
          id: string
          listing_id: string
          position: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          listing_id: string
          position: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_category_order_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_category_order_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_edits_pending: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          listing_id: string
          owner_id: string
          payload: Json
          resolved_at: string | null
          status: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          listing_id: string
          owner_id: string
          payload?: Json
          resolved_at?: string | null
          status?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          owner_id?: string
          payload?: Json
          resolved_at?: string | null
          status?: string
        }
        Relationships: []
      }
      listing_sub_subcategories: {
        Row: {
          id: string
          listing_id: string
          sub_subcategory_id: string
        }
        Insert: {
          id?: string
          listing_id: string
          sub_subcategory_id: string
        }
        Update: {
          id?: string
          listing_id?: string
          sub_subcategory_id?: string
        }
        Relationships: []
      }
      listing_subcategories: {
        Row: {
          id: string
          listing_id: string
          subcategory_id: string
        }
        Insert: {
          id?: string
          listing_id: string
          subcategory_id: string
        }
        Update: {
          id?: string
          listing_id?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_subcategories_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_subcategories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          action_email_index: number
          action_phone_index: number
          action_website_index: number
          action_whatsapp_index: number
          additional_email_labels: string[]
          additional_emails: string[]
          additional_phone_labels: string[]
          additional_phones: string[]
          additional_website_labels: string[]
          additional_websites: string[]
          additional_whatsapp_labels: string[]
          additional_whatsapps: string[]
          after_hours_available: boolean | null
          air_conditioned: boolean | null
          airport_shuttle_free: boolean | null
          amenities: string[] | null
          avg_price_per_person_per_night: string | null
          breakfast_included: boolean | null
          business_owner_id: string | null
          business_started_year: number | null
          callout_fee: boolean | null
          card_image_url: string | null
          card_primary_subcategory: string | null
          category_id: string | null
          cause: string | null
          child_friendly: boolean | null
          click_and_collect: boolean | null
          created_at: string
          cuisine: string[] | null
          curio_or_gifts: boolean | null
          custom_text_1: string | null
          custom_text_2: string | null
          custom_text_3: string | null
          custom_title_1: string | null
          custom_title_2: string | null
          custom_title_3: string | null
          delivery_available: boolean | null
          description: string | null
          detail_image_url: string | null
          details_display_mode: Json
          drive_through: boolean | null
          email: string | null
          email_label: string | null
          emergency_24hr: boolean | null
          event_types: string[]
          facebook: string | null
          foods: string[]
          gallery_images: string[] | null
          good_for_kids: boolean | null
          good_to_know: string[] | null
          google_maps_link: string | null
          google_match_confidence: number | null
          google_place_id: string | null
          google_place_name: string | null
          google_rating: number | null
          google_reviews_count: number | null
          google_reviews_url: string | null
          google_sync_status: string | null
          google_synced_at: string | null
          has_aircon: boolean | null
          has_airport_shuttle: boolean | null
          has_bar: boolean | null
          has_beers_ciders: boolean | null
          has_breakfast: boolean | null
          has_champagne: boolean | null
          has_cocktails: boolean | null
          has_coffee: boolean | null
          has_craft_beer: boolean | null
          has_fitness_centre: boolean | null
          has_free_parking: boolean | null
          has_free_wifi: boolean | null
          has_iced_coffee: boolean | null
          has_laundry: boolean | null
          has_milkshakes: boolean | null
          has_mocktails: boolean | null
          has_restaurant: boolean | null
          has_room_service: boolean | null
          has_secure_parking: boolean | null
          has_smoothies: boolean | null
          has_spa: boolean | null
          has_swimming_pool: boolean | null
          has_toilet: boolean | null
          has_wifi: boolean | null
          has_wifi_accom: boolean | null
          has_wine_list: boolean | null
          high_chairs: boolean | null
          id: string
          image_url: string | null
          impact: string | null
          instagram: string | null
          is_featured: boolean
          is_franchise: boolean | null
          kids_menu: boolean | null
          kids_playground: boolean | null
          km_from_town: string | null
          local_products: boolean | null
          location: string | null
          long_description: string | null
          meal: string[] | null
          nappy_changing_station: boolean | null
          opening_hours: Json | null
          order_online: boolean | null
          parking_available: boolean | null
          payment_methods: string[] | null
          pets_allowed: boolean | null
          phone: string | null
          phone_label: string | null
          plant_types: string[] | null
          price_level: number | null
          price_range: string | null
          product_categories: string[] | null
          refresh_priority: string
          rooms_count: number | null
          saved_image_url: string | null
          seating: string[] | null
          service_type: string[] | null
          services_offered: string[] | null
          shop_type: string | null
          show_attributes: boolean
          sleeps: number | null
          sleeps_children: number | null
          smoking_allowed: boolean | null
          specialities: string | null
          title: string
          title_override: string | null
          treatments: string[] | null
          updated_at: string
          venue_accommodation_sleeps: number | null
          venue_guest_capacity: number | null
          venue_indoor_outdoor: string | null
          venue_onsite_accommodation: boolean | null
          venue_setting_types: string[]
          venue_style_tags: string[]
          vibe: string[] | null
          visiting: string | null
          volunteering: string | null
          ways_to_give: string | null
          website: string | null
          website_label: string | null
          whatsapp: string | null
          whatsapp_cta_label: string | null
          whatsapp_label: string | null
          wheelchair_car_park: boolean | null
          wheelchair_entrance: boolean | null
          wheelchair_friendly: boolean | null
          wheelchair_seating: boolean | null
          wheelchair_toilet: boolean | null
          years_in_business: number | null
        }
        Insert: {
          action_email_index?: number
          action_phone_index?: number
          action_website_index?: number
          action_whatsapp_index?: number
          additional_email_labels?: string[]
          additional_emails?: string[]
          additional_phone_labels?: string[]
          additional_phones?: string[]
          additional_website_labels?: string[]
          additional_websites?: string[]
          additional_whatsapp_labels?: string[]
          additional_whatsapps?: string[]
          after_hours_available?: boolean | null
          air_conditioned?: boolean | null
          airport_shuttle_free?: boolean | null
          amenities?: string[] | null
          avg_price_per_person_per_night?: string | null
          breakfast_included?: boolean | null
          business_owner_id?: string | null
          business_started_year?: number | null
          callout_fee?: boolean | null
          card_image_url?: string | null
          card_primary_subcategory?: string | null
          category_id?: string | null
          cause?: string | null
          child_friendly?: boolean | null
          click_and_collect?: boolean | null
          created_at?: string
          cuisine?: string[] | null
          curio_or_gifts?: boolean | null
          custom_text_1?: string | null
          custom_text_2?: string | null
          custom_text_3?: string | null
          custom_title_1?: string | null
          custom_title_2?: string | null
          custom_title_3?: string | null
          delivery_available?: boolean | null
          description?: string | null
          detail_image_url?: string | null
          details_display_mode?: Json
          drive_through?: boolean | null
          email?: string | null
          email_label?: string | null
          emergency_24hr?: boolean | null
          event_types?: string[]
          facebook?: string | null
          foods?: string[]
          gallery_images?: string[] | null
          good_for_kids?: boolean | null
          good_to_know?: string[] | null
          google_maps_link?: string | null
          google_match_confidence?: number | null
          google_place_id?: string | null
          google_place_name?: string | null
          google_rating?: number | null
          google_reviews_count?: number | null
          google_reviews_url?: string | null
          google_sync_status?: string | null
          google_synced_at?: string | null
          has_aircon?: boolean | null
          has_airport_shuttle?: boolean | null
          has_bar?: boolean | null
          has_beers_ciders?: boolean | null
          has_breakfast?: boolean | null
          has_champagne?: boolean | null
          has_cocktails?: boolean | null
          has_coffee?: boolean | null
          has_craft_beer?: boolean | null
          has_fitness_centre?: boolean | null
          has_free_parking?: boolean | null
          has_free_wifi?: boolean | null
          has_iced_coffee?: boolean | null
          has_laundry?: boolean | null
          has_milkshakes?: boolean | null
          has_mocktails?: boolean | null
          has_restaurant?: boolean | null
          has_room_service?: boolean | null
          has_secure_parking?: boolean | null
          has_smoothies?: boolean | null
          has_spa?: boolean | null
          has_swimming_pool?: boolean | null
          has_toilet?: boolean | null
          has_wifi?: boolean | null
          has_wifi_accom?: boolean | null
          has_wine_list?: boolean | null
          high_chairs?: boolean | null
          id?: string
          image_url?: string | null
          impact?: string | null
          instagram?: string | null
          is_featured?: boolean
          is_franchise?: boolean | null
          kids_menu?: boolean | null
          kids_playground?: boolean | null
          km_from_town?: string | null
          local_products?: boolean | null
          location?: string | null
          long_description?: string | null
          meal?: string[] | null
          nappy_changing_station?: boolean | null
          opening_hours?: Json | null
          order_online?: boolean | null
          parking_available?: boolean | null
          payment_methods?: string[] | null
          pets_allowed?: boolean | null
          phone?: string | null
          phone_label?: string | null
          plant_types?: string[] | null
          price_level?: number | null
          price_range?: string | null
          product_categories?: string[] | null
          refresh_priority?: string
          rooms_count?: number | null
          saved_image_url?: string | null
          seating?: string[] | null
          service_type?: string[] | null
          services_offered?: string[] | null
          shop_type?: string | null
          show_attributes?: boolean
          sleeps?: number | null
          sleeps_children?: number | null
          smoking_allowed?: boolean | null
          specialities?: string | null
          title: string
          title_override?: string | null
          treatments?: string[] | null
          updated_at?: string
          venue_accommodation_sleeps?: number | null
          venue_guest_capacity?: number | null
          venue_indoor_outdoor?: string | null
          venue_onsite_accommodation?: boolean | null
          venue_setting_types?: string[]
          venue_style_tags?: string[]
          vibe?: string[] | null
          visiting?: string | null
          volunteering?: string | null
          ways_to_give?: string | null
          website?: string | null
          website_label?: string | null
          whatsapp?: string | null
          whatsapp_cta_label?: string | null
          whatsapp_label?: string | null
          wheelchair_car_park?: boolean | null
          wheelchair_entrance?: boolean | null
          wheelchair_friendly?: boolean | null
          wheelchair_seating?: boolean | null
          wheelchair_toilet?: boolean | null
          years_in_business?: number | null
        }
        Update: {
          action_email_index?: number
          action_phone_index?: number
          action_website_index?: number
          action_whatsapp_index?: number
          additional_email_labels?: string[]
          additional_emails?: string[]
          additional_phone_labels?: string[]
          additional_phones?: string[]
          additional_website_labels?: string[]
          additional_websites?: string[]
          additional_whatsapp_labels?: string[]
          additional_whatsapps?: string[]
          after_hours_available?: boolean | null
          air_conditioned?: boolean | null
          airport_shuttle_free?: boolean | null
          amenities?: string[] | null
          avg_price_per_person_per_night?: string | null
          breakfast_included?: boolean | null
          business_owner_id?: string | null
          business_started_year?: number | null
          callout_fee?: boolean | null
          card_image_url?: string | null
          card_primary_subcategory?: string | null
          category_id?: string | null
          cause?: string | null
          child_friendly?: boolean | null
          click_and_collect?: boolean | null
          created_at?: string
          cuisine?: string[] | null
          curio_or_gifts?: boolean | null
          custom_text_1?: string | null
          custom_text_2?: string | null
          custom_text_3?: string | null
          custom_title_1?: string | null
          custom_title_2?: string | null
          custom_title_3?: string | null
          delivery_available?: boolean | null
          description?: string | null
          detail_image_url?: string | null
          details_display_mode?: Json
          drive_through?: boolean | null
          email?: string | null
          email_label?: string | null
          emergency_24hr?: boolean | null
          event_types?: string[]
          facebook?: string | null
          foods?: string[]
          gallery_images?: string[] | null
          good_for_kids?: boolean | null
          good_to_know?: string[] | null
          google_maps_link?: string | null
          google_match_confidence?: number | null
          google_place_id?: string | null
          google_place_name?: string | null
          google_rating?: number | null
          google_reviews_count?: number | null
          google_reviews_url?: string | null
          google_sync_status?: string | null
          google_synced_at?: string | null
          has_aircon?: boolean | null
          has_airport_shuttle?: boolean | null
          has_bar?: boolean | null
          has_beers_ciders?: boolean | null
          has_breakfast?: boolean | null
          has_champagne?: boolean | null
          has_cocktails?: boolean | null
          has_coffee?: boolean | null
          has_craft_beer?: boolean | null
          has_fitness_centre?: boolean | null
          has_free_parking?: boolean | null
          has_free_wifi?: boolean | null
          has_iced_coffee?: boolean | null
          has_laundry?: boolean | null
          has_milkshakes?: boolean | null
          has_mocktails?: boolean | null
          has_restaurant?: boolean | null
          has_room_service?: boolean | null
          has_secure_parking?: boolean | null
          has_smoothies?: boolean | null
          has_spa?: boolean | null
          has_swimming_pool?: boolean | null
          has_toilet?: boolean | null
          has_wifi?: boolean | null
          has_wifi_accom?: boolean | null
          has_wine_list?: boolean | null
          high_chairs?: boolean | null
          id?: string
          image_url?: string | null
          impact?: string | null
          instagram?: string | null
          is_featured?: boolean
          is_franchise?: boolean | null
          kids_menu?: boolean | null
          kids_playground?: boolean | null
          km_from_town?: string | null
          local_products?: boolean | null
          location?: string | null
          long_description?: string | null
          meal?: string[] | null
          nappy_changing_station?: boolean | null
          opening_hours?: Json | null
          order_online?: boolean | null
          parking_available?: boolean | null
          payment_methods?: string[] | null
          pets_allowed?: boolean | null
          phone?: string | null
          phone_label?: string | null
          plant_types?: string[] | null
          price_level?: number | null
          price_range?: string | null
          product_categories?: string[] | null
          refresh_priority?: string
          rooms_count?: number | null
          saved_image_url?: string | null
          seating?: string[] | null
          service_type?: string[] | null
          services_offered?: string[] | null
          shop_type?: string | null
          show_attributes?: boolean
          sleeps?: number | null
          sleeps_children?: number | null
          smoking_allowed?: boolean | null
          specialities?: string | null
          title?: string
          title_override?: string | null
          treatments?: string[] | null
          updated_at?: string
          venue_accommodation_sleeps?: number | null
          venue_guest_capacity?: number | null
          venue_indoor_outdoor?: string | null
          venue_onsite_accommodation?: boolean | null
          venue_setting_types?: string[]
          venue_style_tags?: string[]
          vibe?: string[] | null
          visiting?: string | null
          volunteering?: string | null
          ways_to_give?: string | null
          website?: string | null
          website_label?: string | null
          whatsapp?: string | null
          whatsapp_cta_label?: string | null
          whatsapp_label?: string | null
          wheelchair_car_park?: boolean | null
          wheelchair_entrance?: boolean | null
          wheelchair_friendly?: boolean | null
          wheelchair_seating?: boolean | null
          wheelchair_toilet?: boolean | null
          years_in_business?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      local_channel_platforms: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      moderation_actions: {
        Row: {
          action: string
          actor_admin_id: string | null
          created_at: string
          duration_days: number | null
          id: string
          reason: string | null
          related_report_id: string | null
          target_user_id: string
        }
        Insert: {
          action: string
          actor_admin_id?: string | null
          created_at?: string
          duration_days?: number | null
          id?: string
          reason?: string | null
          related_report_id?: string | null
          target_user_id: string
        }
        Update: {
          action?: string
          actor_admin_id?: string | null
          created_at?: string
          duration_days?: number | null
          id?: string
          reason?: string | null
          related_report_id?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      notification_groups: {
        Row: {
          created_at: string
          filter_type: string
          id: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          filter_type: string
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          filter_type?: string
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      notification_item_mappings: {
        Row: {
          created_at: string
          id: string
          item_id: string
          source_type: string
          source_value: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          source_type: string
          source_value: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          source_type?: string
          source_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_item_mappings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "notification_items"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_items: {
        Row: {
          created_at: string
          group_id: string
          id: string
          label: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          label: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          label?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "notification_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          community_activity: boolean
          community_follow_requests: boolean
          community_followers: boolean
          events_new: boolean
          events_new_categories: string[] | null
          events_reminders: boolean
          events_updates: boolean
          events_updates_scope: string
          hh_app_updates: boolean
          hh_tips: boolean
          id: string
          listings_new: boolean
          listings_new_categories: string[] | null
          listings_updates: boolean
          listings_updates_categories: string[] | null
          push_enabled: boolean
          specials_ending: boolean
          specials_new: boolean
          specials_new_categories: string[] | null
          specials_updates: boolean
          specials_updates_scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          community_activity?: boolean
          community_follow_requests?: boolean
          community_followers?: boolean
          events_new?: boolean
          events_new_categories?: string[] | null
          events_reminders?: boolean
          events_updates?: boolean
          events_updates_scope?: string
          hh_app_updates?: boolean
          hh_tips?: boolean
          id?: string
          listings_new?: boolean
          listings_new_categories?: string[] | null
          listings_updates?: boolean
          listings_updates_categories?: string[] | null
          push_enabled?: boolean
          specials_ending?: boolean
          specials_new?: boolean
          specials_new_categories?: string[] | null
          specials_updates?: boolean
          specials_updates_scope?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          community_activity?: boolean
          community_follow_requests?: boolean
          community_followers?: boolean
          events_new?: boolean
          events_new_categories?: string[] | null
          events_reminders?: boolean
          events_updates?: boolean
          events_updates_scope?: string
          hh_app_updates?: boolean
          hh_tips?: boolean
          id?: string
          listings_new?: boolean
          listings_new_categories?: string[] | null
          listings_updates?: boolean
          listings_updates_categories?: string[] | null
          push_enabled?: boolean
          specials_ending?: boolean
          specials_new?: boolean
          specials_new_categories?: string[] | null
          specials_updates?: boolean
          specials_updates_scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_private: boolean
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          is_private: boolean
          location: string | null
          moderation_reason: string | null
          moderation_status: string
          phone: string | null
          surname: string | null
          suspended_until: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          activity_private?: boolean
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_private?: boolean
          location?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          phone?: string | null
          surname?: string | null
          suspended_until?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          activity_private?: boolean
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_private?: boolean
          location?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          phone?: string | null
          surname?: string | null
          suspended_until?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          listing_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          content: Json
          id: string
          section: string
          updated_at: string
        }
        Insert: {
          content?: Json
          id?: string
          section: string
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          section?: string
          updated_at?: string
        }
        Relationships: []
      }
      specials: {
        Row: {
          additional_emails: string[]
          additional_phones: string[]
          additional_whatsapps: string[]
          badge_override: string | null
          booking_link: string | null
          booking_link_label: string | null
          booking_required: boolean
          business_id: string | null
          business_name: string
          card_footer_text: string | null
          contact_email: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          day_of_week: string | null
          deal_type: string | null
          description: string | null
          detail_image_url: string | null
          discount_type: string | null
          discount_value: number | null
          freebie_text: string | null
          homepage_image_url: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          original_price: string | null
          price: string | null
          price_label: string | null
          promo_code: string | null
          redemption_note: string | null
          saved_image_url: string | null
          savings: string | null
          sub_tag_1: string | null
          sub_tag_2: string | null
          tag: string | null
          terms: string | null
          title: string
          title_override: string | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          additional_emails?: string[]
          additional_phones?: string[]
          additional_whatsapps?: string[]
          badge_override?: string | null
          booking_link?: string | null
          booking_link_label?: string | null
          booking_required?: boolean
          business_id?: string | null
          business_name: string
          card_footer_text?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          day_of_week?: string | null
          deal_type?: string | null
          description?: string | null
          detail_image_url?: string | null
          discount_type?: string | null
          discount_value?: number | null
          freebie_text?: string | null
          homepage_image_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          original_price?: string | null
          price?: string | null
          price_label?: string | null
          promo_code?: string | null
          redemption_note?: string | null
          saved_image_url?: string | null
          savings?: string | null
          sub_tag_1?: string | null
          sub_tag_2?: string | null
          tag?: string | null
          terms?: string | null
          title: string
          title_override?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          additional_emails?: string[]
          additional_phones?: string[]
          additional_whatsapps?: string[]
          badge_override?: string | null
          booking_link?: string | null
          booking_link_label?: string | null
          booking_required?: boolean
          business_id?: string | null
          business_name?: string
          card_footer_text?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          day_of_week?: string | null
          deal_type?: string | null
          description?: string | null
          detail_image_url?: string | null
          discount_type?: string | null
          discount_value?: number | null
          freebie_text?: string | null
          homepage_image_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          original_price?: string | null
          price?: string | null
          price_label?: string | null
          promo_code?: string | null
          redemption_note?: string | null
          saved_image_url?: string | null
          savings?: string | null
          sub_tag_1?: string | null
          sub_tag_2?: string | null
          tag?: string | null
          terms?: string | null
          title?: string
          title_override?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "specials_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      specials_pending: {
        Row: {
          admin_note: string | null
          created_at: string
          feature_requested: boolean
          id: string
          listing_id: string | null
          owner_id: string
          payload: Json
          resolved_at: string | null
          special_id: string | null
          status: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          feature_requested?: boolean
          id?: string
          listing_id?: string | null
          owner_id: string
          payload?: Json
          resolved_at?: string | null
          special_id?: string | null
          status?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          feature_requested?: boolean
          id?: string
          listing_id?: string | null
          owner_id?: string
          payload?: Json
          resolved_at?: string | null
          special_id?: string | null
          status?: string
        }
        Relationships: []
      }
      sub_subcategories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sort_order: number
          subcategory_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          subcategory_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          subcategory_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_block_cooldowns: {
        Row: {
          blocked_id: string
          blocker_id: string
          unblocked_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          unblocked_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          unblocked_at?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          action_taken: string
          admin_note: string | null
          created_at: string
          detail: string
          id: string
          is_read: boolean
          reason: string
          reported_user_id: string
          reporter_email: string | null
          reporter_name: string | null
          reporter_user_id: string | null
          resolved_at: string | null
          severity: string | null
          status: string
        }
        Insert: {
          action_taken?: string
          admin_note?: string | null
          created_at?: string
          detail: string
          id?: string
          is_read?: boolean
          reason: string
          reported_user_id: string
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_user_id?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string
        }
        Update: {
          action_taken?: string
          admin_note?: string | null
          created_at?: string
          detail?: string
          id?: string
          is_read?: boolean
          reason?: string
          reported_user_id?: string
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_user_id?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      account_exists_for_email: { Args: { _email: string }; Returns: boolean }
      apply_moderation_action: {
        Args: {
          _action: string
          _admin_note?: string
          _duration_days?: number
          _notify_reporter_message?: string
          _report_id: string
          _severity?: string
          _target_user_id?: string
        }
        Returns: undefined
      }
      apply_signup_metadata: {
        Args: { _metadata: Json; _user_id: string }
        Returns: undefined
      }
      assert_account_active: { Args: { _user_id: string }; Returns: undefined }
      auth_user_for_email: {
        Args: { _email: string }
        Returns: {
          is_confirmed: boolean
          user_id: string
        }[]
      }
      block_cooldown_days: { Args: never; Returns: number }
      claim_business_owner_role: { Args: never; Returns: undefined }
      clear_expired_suspensions: { Args: never; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_been_here_count: { Args: { _listing_id: string }; Returns: number }
      get_block_cooldown: {
        Args: { _blocked_id: string }
        Returns: {
          available_at: string
          is_active: boolean
          unblocked_at: string
        }[]
      }
      get_follow_counts: {
        Args: { _user_id: string }
        Returns: {
          followers: number
          following: number
        }[]
      }
      get_followers: {
        Args: { _user_id: string }
        Returns: {
          activity_private: boolean
          avatar_url: string
          display_name: string
          id: string
          location: string
          username: string
        }[]
      }
      get_following: {
        Args: { _user_id: string }
        Returns: {
          activity_private: boolean
          avatar_url: string
          display_name: string
          id: string
          location: string
          username: string
        }[]
      }
      get_public_profiles: {
        Args: { _ids: string[] }
        Returns: {
          activity_private: boolean
          avatar_url: string
          display_name: string
          id: string
          is_private: boolean
          location: string
          username: string
        }[]
      }
      get_user_been_here: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          listing_id: string
        }[]
      }
      get_user_favourites: {
        Args: { _item_type?: string; _user_id: string }
        Returns: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }[]
      }
      get_user_moderation_summary: {
        Args: { _user_id: string }
        Returns: {
          last_action: string
          last_action_at: string
          moderation_status: string
          pending_reports: number
          recent_upheld: number
          suspended_until: string
          total_reports: number
        }[]
      }
      get_user_saved_count: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_email_available: {
        Args: { _email: string; _exclude_id?: string }
        Returns: boolean
      }
      is_phone_available: {
        Args: { _exclude_id?: string; _phone: string }
        Returns: boolean
      }
      is_username_available: {
        Args: { _exclude_id?: string; _username: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      purge_expired_verification_codes: { Args: never; Returns: undefined }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      respond_to_follow_request: {
        Args: { _accept: boolean; _request_id: string }
        Returns: undefined
      }
      search_public_profiles: {
        Args: { _limit?: number; _term: string }
        Returns: {
          activity_private: boolean
          avatar_url: string
          display_name: string
          id: string
          is_private: boolean
          location: string
          username: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "business_owner"
      follow_status: "pending" | "accepted"
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
      app_role: ["admin", "user", "business_owner"],
      follow_status: ["pending", "accepted"],
    },
  },
} as const
