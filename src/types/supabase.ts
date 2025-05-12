export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      surveys: {
        Row: {
          a_total: number
          azimuth: number
          b_total: number
          bit_depth: number
          created_at: string | null
          database_id: string | null
          dip: number
          id: string
          inclination: number
          measured_depth: number | null
          quality_check: Json | null
          rig_name: string | null
          sensor_offset: number | null
          timestamp: string
          tool_face: number
          tool_temp: number
          updated_at: string | null
          well_id: string | null
          well_name: string | null
        }
        Insert: {
          a_total: number
          azimuth: number
          b_total: number
          bit_depth: number
          created_at?: string | null
          database_id?: string | null
          dip: number
          id: string
          inclination: number
          measured_depth?: number | null
          quality_check?: Json | null
          rig_name?: string | null
          sensor_offset?: number | null
          timestamp: string
          tool_face: number
          tool_temp: number
          updated_at?: string | null
          well_id?: string | null
          well_name?: string | null
        }
        Update: {
          a_total?: number
          azimuth?: number
          b_total?: number
          bit_depth?: number
          created_at?: string | null
          database_id?: string | null
          dip?: number
          id?: string
          inclination?: number
          measured_depth?: number | null
          quality_check?: Json | null
          rig_name?: string | null
          sensor_offset?: number | null
          timestamp?: string
          tool_face?: number
          tool_temp?: number
          updated_at?: string | null
          well_id?: string | null
          well_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surveys_well_id_fkey"
            columns: ["well_id"]
            isOneToOne: false
            referencedRelation: "wells"
            referencedColumns: ["id"]
          },
        ]
      }
      wells: {
        Row: {
          api_number: string | null
          created_at: string | null
          current_depth: number | null
          field_name: string | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          operator: string | null
          rig_name: string | null
          sensor_offset: number | null
          status: string | null
          target_depth: number | null
          updated_at: string | null
        }
        Insert: {
          api_number?: string | null
          created_at?: string | null
          current_depth?: number | null
          field_name?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          operator?: string | null
          rig_name?: string | null
          sensor_offset?: number | null
          status?: string | null
          target_depth?: number | null
          updated_at?: string | null
        }
        Update: {
          api_number?: string | null
          created_at?: string | null
          current_depth?: number | null
          field_name?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          operator?: string | null
          rig_name?: string | null
          sensor_offset?: number | null
          status?: string | null
          target_depth?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
