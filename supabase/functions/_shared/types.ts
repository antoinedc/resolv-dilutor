export interface Database {
  public: {
    Tables: {
      points_stats: {
        Row: {
          id: number;
          created_at: string;
          total_points: number;
          min_points_needed: number;
        };
        Insert: {
          id?: number;
          created_at?: string;
          total_points: number;
          min_points_needed: number;
        };
        Update: {
          id?: number;
          created_at?: string;
          total_points?: number;
          min_points_needed?: number;
        };
      };
    };
    Views: {
      [key: string]: any;
    };
    Functions: {
      [key: string]: any;
    };
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    stack?: string;
  };
} 