import { WeatherData, UserPreference } from '../types';
import { Thermometer, Droplets, Wind, Gauge, Navigation, Eye } from 'lucide-react';

interface WeatherCardProps {
  weather: WeatherData | null;
  preferences: UserPreference;
}

export default function WeatherCard({ weather, preferences }: WeatherCardProps) {
  if (!weather) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No weather data available</p>
          <p className="text-sm text-gray-400">Click refresh to fetch current weather</p>
        </div>
      </div>
    );
  }

  const getWeatherIcon = (icon: string) => {
    return `https://openweathermap.org/img/wn/${icon}@4x.png`;
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const tempStatus = weather.temperature > preferences.temp_threshold_high
    ? 'hot'
    : weather.temperature < preferences.temp_threshold_low
    ? 'cold'
    : 'normal';

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className={`p-8 ${
        tempStatus === 'hot' ? 'bg-gradient-to-br from-orange-50 to-red-50' :
        tempStatus === 'cold' ? 'bg-gradient-to-br from-blue-50 to-cyan-50' :
        'bg-gradient-to-br from-blue-50 to-purple-50'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <h2 className="text-6xl font-bold text-gray-900">
                {weather.temperature.toFixed(1)}°
              </h2>
              <span className="text-2xl text-gray-600">C</span>
            </div>
            <p className="text-xl text-gray-700 mb-1 capitalize">{weather.weather_condition}</p>
            <p className="text-sm text-gray-600">
              Feels like {weather.feels_like.toFixed(1)}°C
            </p>
          </div>
          <div className="text-right">
            <img
              src={getWeatherIcon(weather.weather_icon)}
              alt={weather.weather_condition}
              className="w-32 h-32"
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Thermometer className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Temperature Range</p>
              <p className="text-lg font-semibold text-gray-900">
                {preferences.temp_threshold_low}° - {preferences.temp_threshold_high}°
              </p>
              <p className="text-xs text-gray-500">Alert thresholds</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Droplets className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Humidity</p>
              <p className="text-lg font-semibold text-gray-900">
                {weather.humidity.toFixed(0)}%
              </p>
              <p className={`text-xs ${
                weather.humidity >= preferences.humidity_threshold
                  ? 'text-orange-600 font-medium'
                  : 'text-gray-500'
              }`}>
                {weather.humidity >= preferences.humidity_threshold
                  ? 'Above threshold'
                  : `Threshold: ${preferences.humidity_threshold}%`}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wind className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Wind Speed</p>
              <p className="text-lg font-semibold text-gray-900">
                {weather.wind_speed.toFixed(1)} m/s
              </p>
              <p className={`text-xs ${
                weather.wind_speed >= preferences.wind_speed_threshold
                  ? 'text-orange-600 font-medium'
                  : 'text-gray-500'
              }`}>
                {weather.wind_speed >= preferences.wind_speed_threshold
                  ? 'Above threshold'
                  : `Threshold: ${preferences.wind_speed_threshold} m/s`}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Navigation className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Wind Direction</p>
              <p className="text-lg font-semibold text-gray-900">
                {getWindDirection(weather.wind_direction)}
              </p>
              <p className="text-xs text-gray-500">
                {weather.wind_direction.toFixed(0)}°
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Gauge className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Pressure</p>
              <p className="text-lg font-semibold text-gray-900">
                {weather.pressure.toFixed(0)} hPa
              </p>
              <p className="text-xs text-gray-500">Atmospheric</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Eye className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Last Updated</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(weather.fetched_at).toLocaleTimeString()}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(weather.fetched_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
