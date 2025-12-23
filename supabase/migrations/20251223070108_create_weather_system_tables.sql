/*
  # Weather Alert System Database Schema

  ## Overview
  This migration creates the complete database structure for an AI-powered weather alert system
  that monitors weather patterns and notifies users about extreme conditions.

  ## New Tables
  
  ### 1. `user_preferences`
  Stores user location and alert preferences
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to auth.users
  - `location_name` (text) - City name for weather monitoring
  - `latitude` (numeric) - Geographic latitude
  - `longitude` (numeric) - Geographic longitude
  - `temp_threshold_high` (numeric) - High temperature alert threshold (°C)
  - `temp_threshold_low` (numeric) - Low temperature alert threshold (°C)
  - `wind_speed_threshold` (numeric) - Wind speed alert threshold (m/s)
  - `humidity_threshold` (numeric) - Humidity alert threshold (%)
  - `alerts_enabled` (boolean) - Whether alerts are active
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `weather_data`
  Stores fetched weather information
  - `id` (uuid, primary key) - Unique identifier
  - `user_preference_id` (uuid) - Reference to user_preferences
  - `temperature` (numeric) - Current temperature (°C)
  - `feels_like` (numeric) - Perceived temperature (°C)
  - `humidity` (numeric) - Humidity percentage
  - `wind_speed` (numeric) - Wind speed (m/s)
  - `wind_direction` (numeric) - Wind direction (degrees)
  - `pressure` (numeric) - Atmospheric pressure (hPa)
  - `weather_condition` (text) - Weather description (e.g., "Clear", "Rainy")
  - `weather_icon` (text) - Icon code from weather API
  - `fetched_at` (timestamptz) - When data was retrieved
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. `weather_alerts`
  Stores generated alerts for extreme weather conditions
  - `id` (uuid, primary key) - Unique identifier
  - `user_preference_id` (uuid) - Reference to user_preferences
  - `alert_type` (text) - Type of alert (e.g., "HIGH_TEMP", "STRONG_WIND")
  - `severity` (text) - Alert severity level ("low", "medium", "high", "extreme")
  - `title` (text) - Alert headline
  - `message` (text) - Detailed alert message
  - `weather_data_id` (uuid) - Reference to triggering weather data
  - `is_read` (boolean) - Whether user has acknowledged alert
  - `created_at` (timestamptz) - Alert generation time

  ## Security
  - Enable RLS on all tables
  - Users can only access their own preferences, weather data, and alerts
  - Policies enforce authentication and ownership checks
*/

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  location_name text NOT NULL,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  temp_threshold_high numeric DEFAULT 35,
  temp_threshold_low numeric DEFAULT 0,
  wind_speed_threshold numeric DEFAULT 15,
  humidity_threshold numeric DEFAULT 85,
  alerts_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create weather_data table
CREATE TABLE IF NOT EXISTS weather_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_preference_id uuid REFERENCES user_preferences(id) ON DELETE CASCADE,
  temperature numeric,
  feels_like numeric,
  humidity numeric,
  wind_speed numeric,
  wind_direction numeric,
  pressure numeric,
  weather_condition text,
  weather_icon text,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create weather_alerts table
CREATE TABLE IF NOT EXISTS weather_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_preference_id uuid REFERENCES user_preferences(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'extreme')),
  title text NOT NULL,
  message text NOT NULL,
  weather_data_id uuid REFERENCES weather_data(id) ON DELETE SET NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for user_preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for weather_data
CREATE POLICY "Users can view own weather data"
  ON weather_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_preferences
      WHERE user_preferences.id = weather_data.user_preference_id
      AND user_preferences.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own weather data"
  ON weather_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_preferences
      WHERE user_preferences.id = weather_data.user_preference_id
      AND user_preferences.user_id = auth.uid()
    )
  );

-- Policies for weather_alerts
CREATE POLICY "Users can view own alerts"
  ON weather_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_preferences
      WHERE user_preferences.id = weather_alerts.user_preference_id
      AND user_preferences.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own alerts"
  ON weather_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_preferences
      WHERE user_preferences.id = weather_alerts.user_preference_id
      AND user_preferences.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_preferences
      WHERE user_preferences.id = weather_alerts.user_preference_id
      AND user_preferences.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own alerts"
  ON weather_alerts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_preferences
      WHERE user_preferences.id = weather_alerts.user_preference_id
      AND user_preferences.user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_weather_data_user_pref ON weather_data(user_preference_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_user_pref ON weather_alerts(user_preference_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_is_read ON weather_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);