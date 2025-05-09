export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          position?: string;
          company?: string;
          location?: string;
          bio?: string;
          email_signature?: string;
          profile_image?: string;
          created_at: string;
          updated_at?: string;
          current_well_id?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          position?: string;
          company?: string;
          location?: string;
          bio?: string;
          email_signature?: string;
          profile_image?: string;
          created_at?: string;
          updated_at?: string;
          current_well_id?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          position?: string;
          company?: string;
          location?: string;
          bio?: string;
          email_signature?: string;
          profile_image?: string;
          created_at?: string;
          updated_at?: string;
          current_well_id?: string;
        };
      };
      wells: {
        Row: {
          id: string;
          name: string;
          api_number?: string;
          operator?: string;
          location?: string;
          created_at: string;
          updated_at?: string;
          status?: string;
          rig_name?: string;
          field_name?: string;
          target_depth?: number;
          current_depth?: number;
          sensor_offset?: number;
          is_active?: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          api_number?: string;
          operator?: string;
          location?: string;
          created_at?: string;
          updated_at?: string;
          status?: string;
          rig_name?: string;
          field_name?: string;
          target_depth?: number;
          current_depth?: number;
          sensor_offset?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          api_number?: string;
          operator?: string;
          location?: string;
          created_at?: string;
          updated_at?: string;
          status?: string;
          rig_name?: string;
          field_name?: string;
          target_depth?: number;
          current_depth?: number;
          sensor_offset?: number;
          is_active?: boolean;
        };
      };
      surveys: {
        Row: {
          id: string;
          well_id: string;
          measured_depth: number;
          inclination: number;
          azimuth: number;
          timestamp: string;
          created_at: string;
          updated_at?: string;
          tool_face?: number;
          gravity_toolface?: number;
          magnetic_toolface?: number;
          temperature?: number;
          survey_type?: string;
          quality_flag?: string;
          notes?: string;
        };
        Insert: {
          id?: string;
          well_id: string;
          measured_depth: number;
          inclination: number;
          azimuth: number;
          timestamp: string;
          created_at?: string;
          updated_at?: string;
          tool_face?: number;
          gravity_toolface?: number;
          magnetic_toolface?: number;
          temperature?: number;
          survey_type?: string;
          quality_flag?: string;
          notes?: string;
        };
        Update: {
          id?: string;
          well_id?: string;
          measured_depth?: number;
          inclination?: number;
          azimuth?: number;
          timestamp?: string;
          created_at?: string;
          updated_at?: string;
          tool_face?: number;
          gravity_toolface?: number;
          magnetic_toolface?: number;
          temperature?: number;
          survey_type?: string;
          quality_flag?: string;
          notes?: string;
        };
      };
      wits_connections: {
        Row: {
          id: string;
          name: string;
          connection_type: string;
          host?: string;
          port?: number;
          protocol?: string;
          created_at: string;
          updated_at?: string;
          status?: string;
          well_id?: string;
          last_connected_at?: string;
          connection_settings?: Json;
        };
        Insert: {
          id?: string;
          name: string;
          connection_type: string;
          host?: string;
          port?: number;
          protocol?: string;
          created_at?: string;
          updated_at?: string;
          status?: string;
          well_id?: string;
          last_connected_at?: string;
          connection_settings?: Json;
        };
        Update: {
          id?: string;
          name?: string;
          connection_type?: string;
          host?: string;
          port?: number;
          protocol?: string;
          created_at?: string;
          updated_at?: string;
          status?: string;
          well_id?: string;
          last_connected_at?: string;
          connection_settings?: Json;
        };
      };
      wits_channel_mappings: {
        Row: {
          id: string;
          connection_id: string;
          channel_number: number;
          parameter_name: string;
          unit?: string;
          created_at: string;
          updated_at?: string;
          scaling_factor?: number;
          offset?: number;
          description?: string;
        };
        Insert: {
          id?: string;
          connection_id: string;
          channel_number: number;
          parameter_name: string;
          unit?: string;
          created_at?: string;
          updated_at?: string;
          scaling_factor?: number;
          offset?: number;
          description?: string;
        };
        Update: {
          id?: string;
          connection_id?: string;
          channel_number?: number;
          parameter_name?: string;
          unit?: string;
          created_at?: string;
          updated_at?: string;
          scaling_factor?: number;
          offset?: number;
          description?: string;
        };
      };
      wits_logs: {
        Row: {
          id: string;
          connection_id: string;
          log_type: string;
          timestamp: string;
          data: Json;
          created_at: string;
          channel_number?: number;
          value?: number;
          raw_message?: string;
          quality_flag?: string;
        };
        Insert: {
          id?: string;
          connection_id: string;
          log_type: string;
          timestamp: string;
          data: Json;
          created_at?: string;
          channel_number?: number;
          value?: number;
          raw_message?: string;
          quality_flag?: string;
        };
        Update: {
          id?: string;
          connection_id?: string;
          log_type?: string;
          timestamp?: string;
          data?: Json;
          created_at?: string;
          channel_number?: number;
          value?: number;
          raw_message?: string;
          quality_flag?: string;
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
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
