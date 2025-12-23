export interface UserPreference {
  id: string;
  user_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  temp_threshold_high: number;
  temp_threshold_low: number;
  wind_speed_threshold: number;
  humidity_threshold: number;
  alerts_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeatherData {
  id: string;
  user_preference_id: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  pressure: number;
  weather_condition: string;
  weather_icon: string;
  fetched_at: string;
  created_at: string;
}

export interface WeatherAlert {
  id: string;
  user_preference_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'extreme';
  title: string;
  message: string;
  weather_data_id: string | null;
  is_read: boolean;
  created_at: string;
}
