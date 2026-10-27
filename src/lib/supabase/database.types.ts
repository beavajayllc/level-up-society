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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
