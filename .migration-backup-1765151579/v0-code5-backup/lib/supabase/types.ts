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
          username: string | null
          email: string | null
          created_at: string
          updated_at: string
          eth_address: string | null
        }
        Insert: {
          id: string
          username?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
          eth_address?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
          eth_address?: string | null
        }
      }
      trades: {
        Row: {
          id: string
          user_id: string
          token_in: string
          token_out: string
          amount_in: string
          amount_out: string
          price: string
          timestamp: string
          tx_hash: string
          status: string
          gas_used: string
          gas_price: string
        }
        Insert: {
          id?: string
          user_id: string
          token_in: string
          token_out: string
          amount_in: string
          amount_out: string
          price: string
          timestamp?: string
          tx_hash: string
          status: string
          gas_used: string
          gas_price: string
        }
        Update: {
          id?: string
          user_id?: string
          token_in?: string
          token_out?: string
          amount_in?: string
          amount_out?: string
          price?: string
          timestamp?: string
          tx_hash?: string
          status?: string
          gas_used?: string
          gas_price?: string
        }
      }
      portfolios: {
        Row: {
          id: string
          user_id: string
          token: string
          amount: string
          value_usd: string
          last_updated: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          amount: string
          value_usd: string
          last_updated?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          amount?: string
          value_usd?: string
          last_updated?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          token: string
          amount: string
          price: string
          side: string
          status: string
          created_at: string
          updated_at: string
          expires_at: string | null
          filled_amount: string
          remaining_amount: string
          type: string
          signature: string | null
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          amount: string
          price: string
          side: string
          status: string
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          filled_amount?: string
          remaining_amount?: string
          type: string
          signature?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          amount?: string
          price?: string
          side?: string
          status?: string
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          filled_amount?: string
          remaining_amount?: string
          type?: string
          signature?: string | null
        }
      }
      price_history: {
        Row: {
          id: string
          token: string
          price: string
          timestamp: string
          volume: string
          high: string
          low: string
          open: string
          close: string
        }
        Insert: {
          id?: string
          token: string
          price: string
          timestamp: string
          volume: string
          high: string
          low: string
          open: string
          close: string
        }
        Update: {
          id?: string
          token?: string
          price?: string
          timestamp?: string
          volume?: string
          high?: string
          low?: string
          open?: string
          close?: string
        }
      }
      strategy_states: {
        Row: {
          strategy_id: string
          user_id: string
          active: boolean
          positions: Json
          last_update: string
          equity: number
          peak_equity: number
        }
        Insert: {
          strategy_id: string
          user_id: string
          active: boolean
          positions: Json
          last_update?: string
          equity: number
          peak_equity: number
        }
        Update: {
          strategy_id?: string
          user_id?: string
          active?: boolean
          positions?: Json
          last_update?: string
          equity?: number
          peak_equity?: number
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