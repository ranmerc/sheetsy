export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          project_name: string;
          sheet_url: string;
        };
        Insert: {
          id: string;
          project_name: string;
          sheet_id: string;
        };
        Update: {
          id?: string;
          project_name?: string;
          sheet_id?: string;
        };
      };
      users: {
        Row: {
          api_key: string;
          id: string;
          username: string | null;
        };
        Insert: {
          api_key?: string;
          id: string;
          username?: string | null;
        };
        Update: {
          api_key?: string;
          id?: string;
          username?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
