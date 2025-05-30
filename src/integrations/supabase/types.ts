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
      anomaly_detections: {
        Row: {
          anomaly_probability: number
          api_timestamp: string
          created_at: string
          id: string
          input_data: Json
          iot_data_id: string
          normal_probability: number
          prediction: string
          risk_level: string
          zone: string
        }
        Insert: {
          anomaly_probability: number
          api_timestamp: string
          created_at?: string
          id?: string
          input_data: Json
          iot_data_id: string
          normal_probability: number
          prediction: string
          risk_level: string
          zone: string
        }
        Update: {
          anomaly_probability?: number
          api_timestamp?: string
          created_at?: string
          id?: string
          input_data?: Json
          iot_data_id?: string
          normal_probability?: number
          prediction?: string
          risk_level?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "anomaly_detections_iot_data_id_fkey"
            columns: ["iot_data_id"]
            isOneToOne: false
            referencedRelation: "iot_data"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          dish_id: number
          dish_name: string
          dish_price: number
        }
        Insert: {
          dish_id?: number
          dish_name: string
          dish_price: number
        }
        Update: {
          dish_id?: number
          dish_name?: string
          dish_price?: number
        }
        Relationships: []
      }
      food_history: {
        Row: {
          dish_name: string
          food_rating: number | null
          gas_consumption: number | null
          order_price: number | null
          quantity_consumed: number | null
          quantity_prepared: number | null
          timestamp: string
          water_consumption: number | null
        }
        Insert: {
          dish_name: string
          food_rating?: number | null
          gas_consumption?: number | null
          order_price?: number | null
          quantity_consumed?: number | null
          quantity_prepared?: number | null
          timestamp: string
          water_consumption?: number | null
        }
        Update: {
          dish_name?: string
          food_rating?: number | null
          gas_consumption?: number | null
          order_price?: number | null
          quantity_consumed?: number | null
          quantity_prepared?: number | null
          timestamp?: string
          water_consumption?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "food_history_dish_name_fkey"
            columns: ["dish_name"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["dish_name"]
          },
        ]
      }
      iot_data: {
        Row: {
          air_purifier_status: Database["public"]["Enums"]["air_purifier_status"]
          battery_backup_level: number
          cleaning_status: Database["public"]["Enums"]["cleaning_status"]
          co2_level: number
          created_at: string
          energy_consumed_kwh: number
          fire_alarm_triggered: Database["public"]["Enums"]["alarm_status"]
          floor: number
          gas_leak_detected: Database["public"]["Enums"]["alarm_status"]
          humidity: number
          id: string
          last_cleaned_timestamp: string | null
          light_level: number
          motion_detected: Database["public"]["Enums"]["motion_status"]
          occupancy_count: number
          power_status: Database["public"]["Enums"]["power_status"]
          temperature: number
          timestamp: string
          zone: Database["public"]["Enums"]["zone_type"]
        }
        Insert: {
          air_purifier_status: Database["public"]["Enums"]["air_purifier_status"]
          battery_backup_level: number
          cleaning_status: Database["public"]["Enums"]["cleaning_status"]
          co2_level: number
          created_at?: string
          energy_consumed_kwh: number
          fire_alarm_triggered: Database["public"]["Enums"]["alarm_status"]
          floor: number
          gas_leak_detected: Database["public"]["Enums"]["alarm_status"]
          humidity: number
          id?: string
          last_cleaned_timestamp?: string | null
          light_level: number
          motion_detected: Database["public"]["Enums"]["motion_status"]
          occupancy_count: number
          power_status: Database["public"]["Enums"]["power_status"]
          temperature: number
          timestamp?: string
          zone: Database["public"]["Enums"]["zone_type"]
        }
        Update: {
          air_purifier_status?: Database["public"]["Enums"]["air_purifier_status"]
          battery_backup_level?: number
          cleaning_status?: Database["public"]["Enums"]["cleaning_status"]
          co2_level?: number
          created_at?: string
          energy_consumed_kwh?: number
          fire_alarm_triggered?: Database["public"]["Enums"]["alarm_status"]
          floor?: number
          gas_leak_detected?: Database["public"]["Enums"]["alarm_status"]
          humidity?: number
          id?: string
          last_cleaned_timestamp?: string | null
          light_level?: number
          motion_detected?: Database["public"]["Enums"]["motion_status"]
          occupancy_count?: number
          power_status?: Database["public"]["Enums"]["power_status"]
          temperature?: number
          timestamp?: string
          zone?: Database["public"]["Enums"]["zone_type"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      insert_random_food_history: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      air_purifier_status: "on" | "off"
      alarm_status: "yes" | "no"
      cleaning_status: "pending" | "inprogress" | "done"
      motion_status: "yes" | "no"
      power_status: "on" | "off"
      zone_type: "Zone01" | "Zone02" | "Zone03" | "Zone04"
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
    Enums: {
      air_purifier_status: ["on", "off"],
      alarm_status: ["yes", "no"],
      cleaning_status: ["pending", "inprogress", "done"],
      motion_status: ["yes", "no"],
      power_status: ["on", "off"],
      zone_type: ["Zone01", "Zone02", "Zone03", "Zone04"],
    },
  },
} as const
