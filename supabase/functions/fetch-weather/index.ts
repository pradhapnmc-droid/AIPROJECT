import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface WeatherData {
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  pressure: number;
  weather_condition: string;
  weather_icon: string;
}

interface AlertThresholds {
  temp_threshold_high: number;
  temp_threshold_low: number;
  wind_speed_threshold: number;
  humidity_threshold: number;
}

function analyzeWeatherForAlerts(
  weather: WeatherData,
  thresholds: AlertThresholds
): Array<{ type: string; severity: string; title: string; message: string }> {
  const alerts = [];

  if (weather.temperature >= thresholds.temp_threshold_high) {
    const severity = weather.temperature >= thresholds.temp_threshold_high + 5 ? 'extreme' : 'high';
    alerts.push({
      type: 'HIGH_TEMP',
      severity,
      title: 'High Temperature Alert',
      message: `Temperature has reached ${weather.temperature.toFixed(1)}°C, which exceeds your threshold of ${thresholds.temp_threshold_high}°C. Stay hydrated and avoid prolonged sun exposure.`,
    });
  }

  if (weather.temperature <= thresholds.temp_threshold_low) {
    const severity = weather.temperature <= thresholds.temp_threshold_low - 5 ? 'extreme' : 'high';
    alerts.push({
      type: 'LOW_TEMP',
      severity,
      title: 'Low Temperature Alert',
      message: `Temperature has dropped to ${weather.temperature.toFixed(1)}°C, which is below your threshold of ${thresholds.temp_threshold_low}°C. Dress warmly and protect against cold exposure.`,
    });
  }

  if (weather.wind_speed >= thresholds.wind_speed_threshold) {
    const severity = weather.wind_speed >= thresholds.wind_speed_threshold + 10 ? 'extreme' : 'high';
    alerts.push({
      type: 'STRONG_WIND',
      severity,
      title: 'Strong Wind Alert',
      message: `Wind speed has reached ${weather.wind_speed.toFixed(1)} m/s, exceeding your threshold of ${thresholds.wind_speed_threshold} m/s. Secure loose objects and avoid outdoor activities.`,
    });
  }

  if (weather.humidity >= thresholds.humidity_threshold) {
    const severity = weather.humidity >= thresholds.humidity_threshold + 10 ? 'high' : 'medium';
    alerts.push({
      type: 'HIGH_HUMIDITY',
      severity,
      title: 'High Humidity Alert',
      message: `Humidity level has reached ${weather.humidity.toFixed(0)}%, exceeding your threshold of ${thresholds.humidity_threshold}%. Expect discomfort and potential health impacts.`,
    });
  }

  const tempDiff = Math.abs(weather.temperature - weather.feels_like);
  if (tempDiff > 5) {
    alerts.push({
      type: 'FEELS_LIKE_DIFF',
      severity: 'medium',
      title: 'Temperature Perception Alert',
      message: `Actual temperature is ${weather.temperature.toFixed(1)}°C but feels like ${weather.feels_like.toFixed(1)}°C. Adjust your clothing accordingly.`,
    });
  }

  return alerts;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { preferenceId, lat, lon } = await req.json();

    if (!lat || !lon) {
      throw new Error('Missing latitude or longitude');
    }

    const weatherApiKey = '8f3c1d87e8f3d8c4e62a5f7b1e9d2c4a';
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;
    
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.statusText}`);
    }

    const weatherApiData = await weatherResponse.json();

    const weatherData: WeatherData = {
      temperature: weatherApiData.main.temp,
      feels_like: weatherApiData.main.feels_like,
      humidity: weatherApiData.main.humidity,
      wind_speed: weatherApiData.wind.speed,
      wind_direction: weatherApiData.wind.deg,
      pressure: weatherApiData.main.pressure,
      weather_condition: weatherApiData.weather[0].main,
      weather_icon: weatherApiData.weather[0].icon,
    };

    const { data: insertedWeather, error: weatherInsertError } = await supabase
      .from('weather_data')
      .insert({
        user_preference_id: preferenceId,
        ...weatherData,
      })
      .select()
      .single();

    if (weatherInsertError) {
      throw weatherInsertError;
    }

    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('temp_threshold_high, temp_threshold_low, wind_speed_threshold, humidity_threshold, alerts_enabled')
      .eq('id', preferenceId)
      .single();

    let generatedAlerts = [];

    if (preferences && preferences.alerts_enabled) {
      const alerts = analyzeWeatherForAlerts(weatherData, preferences);

      if (alerts.length > 0) {
        const alertsToInsert = alerts.map((alert) => ({
          user_preference_id: preferenceId,
          alert_type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          weather_data_id: insertedWeather.id,
        }));

        const { data: insertedAlerts, error: alertInsertError } = await supabase
          .from('weather_alerts')
          .insert(alertsToInsert)
          .select();

        if (!alertInsertError) {
          generatedAlerts = insertedAlerts;
        }
      }
    }

    return new Response(
      JSON.stringify({
        weather: { ...weatherData, id: insertedWeather.id },
        alerts: generatedAlerts,
        location: weatherApiData.name,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});