import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      polls: {
        Row: {
          id: string
          title: string
          description: string | null
          creator_id: string
          is_public: boolean
          allow_multiple_votes: boolean
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          creator_id: string
          is_public?: boolean
          allow_multiple_votes?: boolean
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          creator_id?: string
          is_public?: boolean
          allow_multiple_votes?: boolean
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      poll_options: {
        Row: {
          id: string
          poll_id: string
          option_text: string
          option_order: number
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          option_text: string
          option_order: number
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          option_text?: string
          option_order?: number
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          poll_id: string
          option_id: string
          voter_id: string | null
          voter_ip: string | null
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          option_id: string
          voter_id?: string | null
          voter_ip?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          option_id?: string
          voter_id?: string | null
          voter_ip?: string | null
          created_at?: string
        }
      }
    }
  }
}