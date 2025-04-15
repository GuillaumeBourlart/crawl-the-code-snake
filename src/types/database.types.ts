export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          pseudo: string
          skins: Json[] | null
          created_at: string
          default_skin_id: number | null
        }
        Insert: {
          id: string
          pseudo: string
          skins?: Json[] | null
          created_at?: string
          default_skin_id?: number | null
        }
        Update: {
          id?: string
          pseudo?: string
          skins?: Json[] | null
          created_at?: string
          default_skin_id?: number | null
        }
      }
      skins: {
        Row: {
          id: number
          name: string
          description: string | null
          is_paid: boolean
          price: number | null
          data: {
            colors: string[]
          }
          stripe_product_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          is_paid: boolean
          price?: number | null
          data: {
            colors: string[]
          }
          stripe_product_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          is_paid?: boolean
          price?: number | null
          data?: {
            colors: string[]
          }
          stripe_product_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_skins: {
        Row: {
          id: number
          user_id: string
          skin_id: number
          purchased_at: string
          transaction_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          skin_id: number
          purchased_at: string
          transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          skin_id?: number
          purchased_at?: string
          transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}