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
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          meta: string | null
          platform: string
          sort_order: number
          tag_1: string | null
          tag_2: string | null
          title: string
          tone: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          meta?: string | null
          platform: string
          sort_order?: number
          tag_1?: string | null
          tag_2?: string | null
          title: string
          tone?: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          meta?: string | null
          platform?: string
          sort_order?: number
          tag_1?: string | null
          tag_2?: string | null
          title?: string
          tone?: string
          updated_at?: string
          url?: string
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
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          booking_link: string | null
          booking_link_label: string | null
          business_id: string | null
          contact_email: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          date: string
          description: string | null
          end_date: string | null
          end_time: string | null
          gallery_images: string[] | null
          google_maps_link: string | null
          hosted_by_image_url: string | null
          hosted_by_image_url_2: string | null
          hosted_by_image_url_3: string | null
          hosted_by_name: string | null
          hosted_by_name_2: string | null
          hosted_by_name_3: string | null
          hosted_by_subtitle: string | null
          hosted_by_subtitle_2: string | null
          hosted_by_subtitle_3: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          location: string | null
          notes: string | null
          price: string | null
          recurrence: string | null
          social_media_label: string | null
          social_media_link: string | null
          start_date: string | null
          start_time: string | null
          sub_tag_1: string | null
          sub_tag_2: string | null
          tag: string | null
          title: string
          updated_at: string
        }
        Insert: {
          booking_link?: string | null
          booking_link_label?: string | null
          business_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          date: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          gallery_images?: string[] | null
          google_maps_link?: string | null
          hosted_by_image_url?: string | null
          hosted_by_image_url_2?: string | null
          hosted_by_image_url_3?: string | null
          hosted_by_name?: string | null
          hosted_by_name_2?: string | null
          hosted_by_name_3?: string | null
          hosted_by_subtitle?: string | null
          hosted_by_subtitle_2?: string | null
          hosted_by_subtitle_3?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          location?: string | null
          notes?: string | null
          price?: string | null
          recurrence?: string | null
          social_media_label?: string | null
          social_media_link?: string | null
          start_date?: string | null
          start_time?: string | null
          sub_tag_1?: string | null
          sub_tag_2?: string | null
          tag?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          booking_link?: string | null
          booking_link_label?: string | null
          business_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          date?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          gallery_images?: string[] | null
          google_maps_link?: string | null
          hosted_by_image_url?: string | null
          hosted_by_image_url_2?: string | null
          hosted_by_image_url_3?: string | null
          hosted_by_name?: string | null
          hosted_by_name_2?: string | null
          hosted_by_name_3?: string | null
          hosted_by_subtitle?: string | null
          hosted_by_subtitle_2?: string | null
          hosted_by_subtitle_3?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          location?: string | null
          notes?: string | null
          price?: string | null
          recurrence?: string | null
          social_media_label?: string | null
          social_media_link?: string | null
          start_date?: string | null
          start_time?: string | null
          sub_tag_1?: string | null
          sub_tag_2?: string | null
          tag?: string | null
          title?: string
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
      feedback: {
        Row: {
          created_at: string
          feedback_type: string
          id: string
          is_read: boolean
          message: string
          subject: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_type: string
          id?: string
          is_read?: boolean
          message: string
          subject?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: string
          is_read?: boolean
          message?: string
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
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
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
          air_conditioned: boolean | null
          airport_shuttle_free: boolean | null
          amenities: string[] | null
          breakfast_included: boolean | null
          category_id: string | null
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
          email: string | null
          gallery_images: string[] | null
          good_for_kids: boolean | null
          google_maps_link: string | null
          google_rating: number | null
          google_reviews_count: number | null
          google_reviews_url: string | null
          has_aircon: boolean | null
          has_airport_shuttle: boolean | null
          has_bar: boolean | null
          has_breakfast: boolean | null
          has_fitness_centre: boolean | null
          has_free_parking: boolean | null
          has_free_wifi: boolean | null
          has_laundry: boolean | null
          has_restaurant: boolean | null
          has_room_service: boolean | null
          has_secure_parking: boolean | null
          has_spa: boolean | null
          has_swimming_pool: boolean | null
          has_toilet: boolean | null
          has_wifi: boolean | null
          has_wifi_accom: boolean | null
          high_chairs: boolean | null
          id: string
          image_url: string | null
          is_featured: boolean
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
          price_level: number | null
          price_range: string | null
          product_categories: string[] | null
          seating: string[] | null
          service_type: string[] | null
          shop_type: string | null
          show_attributes: boolean
          sleeps: number | null
          smoking_allowed: boolean | null
          title: string
          updated_at: string
          vibe: string[] | null
          website: string | null
          website_label: string | null
          whatsapp: string | null
          wheelchair_car_park: boolean | null
          wheelchair_entrance: boolean | null
          wheelchair_friendly: boolean | null
          wheelchair_seating: boolean | null
          wheelchair_toilet: boolean | null
        }
        Insert: {
          air_conditioned?: boolean | null
          airport_shuttle_free?: boolean | null
          amenities?: string[] | null
          breakfast_included?: boolean | null
          category_id?: string | null
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
          email?: string | null
          gallery_images?: string[] | null
          good_for_kids?: boolean | null
          google_maps_link?: string | null
          google_rating?: number | null
          google_reviews_count?: number | null
          google_reviews_url?: string | null
          has_aircon?: boolean | null
          has_airport_shuttle?: boolean | null
          has_bar?: boolean | null
          has_breakfast?: boolean | null
          has_fitness_centre?: boolean | null
          has_free_parking?: boolean | null
          has_free_wifi?: boolean | null
          has_laundry?: boolean | null
          has_restaurant?: boolean | null
          has_room_service?: boolean | null
          has_secure_parking?: boolean | null
          has_spa?: boolean | null
          has_swimming_pool?: boolean | null
          has_toilet?: boolean | null
          has_wifi?: boolean | null
          has_wifi_accom?: boolean | null
          high_chairs?: boolean | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
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
          price_level?: number | null
          price_range?: string | null
          product_categories?: string[] | null
          seating?: string[] | null
          service_type?: string[] | null
          shop_type?: string | null
          show_attributes?: boolean
          sleeps?: number | null
          smoking_allowed?: boolean | null
          title: string
          updated_at?: string
          vibe?: string[] | null
          website?: string | null
          website_label?: string | null
          whatsapp?: string | null
          wheelchair_car_park?: boolean | null
          wheelchair_entrance?: boolean | null
          wheelchair_friendly?: boolean | null
          wheelchair_seating?: boolean | null
          wheelchair_toilet?: boolean | null
        }
        Update: {
          air_conditioned?: boolean | null
          airport_shuttle_free?: boolean | null
          amenities?: string[] | null
          breakfast_included?: boolean | null
          category_id?: string | null
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
          email?: string | null
          gallery_images?: string[] | null
          good_for_kids?: boolean | null
          google_maps_link?: string | null
          google_rating?: number | null
          google_reviews_count?: number | null
          google_reviews_url?: string | null
          has_aircon?: boolean | null
          has_airport_shuttle?: boolean | null
          has_bar?: boolean | null
          has_breakfast?: boolean | null
          has_fitness_centre?: boolean | null
          has_free_parking?: boolean | null
          has_free_wifi?: boolean | null
          has_laundry?: boolean | null
          has_restaurant?: boolean | null
          has_room_service?: boolean | null
          has_secure_parking?: boolean | null
          has_spa?: boolean | null
          has_swimming_pool?: boolean | null
          has_toilet?: boolean | null
          has_wifi?: boolean | null
          has_wifi_accom?: boolean | null
          high_chairs?: boolean | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
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
          price_level?: number | null
          price_range?: string | null
          product_categories?: string[] | null
          seating?: string[] | null
          service_type?: string[] | null
          shop_type?: string | null
          show_attributes?: boolean
          sleeps?: number | null
          smoking_allowed?: boolean | null
          title?: string
          updated_at?: string
          vibe?: string[] | null
          website?: string | null
          website_label?: string | null
          whatsapp?: string | null
          wheelchair_car_park?: boolean | null
          wheelchair_entrance?: boolean | null
          wheelchair_friendly?: boolean | null
          wheelchair_seating?: boolean | null
          wheelchair_toilet?: boolean | null
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
      notification_preferences: {
        Row: {
          community_activity: boolean
          community_followers: boolean
          events_new: boolean
          events_reminders: boolean
          events_updates: boolean
          hh_app_updates: boolean
          hh_tips: boolean
          id: string
          listings_new: boolean
          listings_updates: boolean
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          community_activity?: boolean
          community_followers?: boolean
          events_new?: boolean
          events_reminders?: boolean
          events_updates?: boolean
          hh_app_updates?: boolean
          hh_tips?: boolean
          id?: string
          listings_new?: boolean
          listings_updates?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          community_activity?: boolean
          community_followers?: boolean
          events_new?: boolean
          events_reminders?: boolean
          events_updates?: boolean
          hh_app_updates?: boolean
          hh_tips?: boolean
          id?: string
          listings_new?: boolean
          listings_updates?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          location: string | null
          phone: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          location?: string | null
          phone?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          location?: string | null
          phone?: string | null
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
          booking_link: string | null
          booking_link_label: string | null
          booking_required: boolean
          business_id: string | null
          business_name: string
          category: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          day_of_week: string[] | null
          deal_label: string
          description: string | null
          duration_headline: string | null
          duration_sublabel: string | null
          eyebrow_categories: string[] | null
          id: string
          image_url: string | null
          is_active: boolean
          offer_headline: string | null
          offer_sublabel: string | null
          original_price: string | null
          price: string | null
          price_label: string | null
          promo_code: string | null
          sort_order: number
          special_type: string | null
          terms: string | null
          title: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          booking_link?: string | null
          booking_link_label?: string | null
          booking_required?: boolean
          business_id?: string | null
          business_name: string
          category?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          day_of_week?: string[] | null
          deal_label: string
          description?: string | null
          duration_headline?: string | null
          duration_sublabel?: string | null
          eyebrow_categories?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          offer_headline?: string | null
          offer_sublabel?: string | null
          original_price?: string | null
          price?: string | null
          price_label?: string | null
          promo_code?: string | null
          sort_order?: number
          special_type?: string | null
          terms?: string | null
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          booking_link?: string | null
          booking_link_label?: string | null
          booking_required?: boolean
          business_id?: string | null
          business_name?: string
          category?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          day_of_week?: string[] | null
          deal_label?: string
          description?: string | null
          duration_headline?: string | null
          duration_sublabel?: string | null
          eyebrow_categories?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          offer_headline?: string | null
          offer_sublabel?: string | null
          original_price?: string | null
          price?: string | null
          price_label?: string | null
          promo_code?: string | null
          sort_order?: number
          special_type?: string | null
          terms?: string | null
          title?: string
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
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          location: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          location?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          location?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
