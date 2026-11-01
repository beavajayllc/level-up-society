export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      announcement_admins: {
        Row: { lus_user_id: string; created_at: string };
        Insert: { lus_user_id: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      member_announcements: {
        Row: { id: string; body: string; created_by: string; created_at: string };
        Insert: { id?: string; body: string; created_by: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      profiles: {
        Row: { id: string; username: string; created_at: string; updated_at: string };
        Insert: { id: string; username: string; created_at?: string; updated_at?: string };
        Update: { username?: string; updated_at?: string };
        Relationships: [];
      };
      whop_accounts: {
        Row: {
          lus_user_id: string;
          whop_user_id: string;
          user_info: Json;
          credentials_ciphertext: string;
          token_obtained_at: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          lus_user_id: string;
          whop_user_id: string;
          user_info: Json;
          credentials_ciphertext: string;
          token_obtained_at: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          whop_user_id?: string;
          user_info?: Json;
          credentials_ciphertext?: string;
          token_obtained_at?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      affiliate_links: {
        Row: {
          lus_user_id: string;
          handle: string;
          whop_username: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          lus_user_id: string;
          handle: string;
          whop_username: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          handle?: string;
          whop_username?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
