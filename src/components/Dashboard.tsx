import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserPreference, WeatherData, WeatherAlert } from '../types';
import WeatherCard from './WeatherCard';
import AlertList from './AlertList';
import SettingsModal from './SettingsModal';
import { LogOut, Settings, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    loadPreferences();
    loadAlerts();
  }, [user]);

  useEffect(() => {
    if (preferences) {
      fetchWeather();
    }
  }, [preferences]);

  const loadPreferences = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading preferences:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setPreferences(data);
    }
    setLoading(false);
  };

  const loadAlerts = async () => {
    if (!user) return;

    const { data: prefData } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (prefData) {
      const { data: alertData } = await supabase
        .from('weather_alerts')
        .select('*')
        .eq('user_preference_id', prefData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertData) {
        setAlerts(alertData);
      }
    }
  };

  const fetchWeather = async () => {
    if (!preferences) return;

    setRefreshing(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-weather`;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferenceId: preferences.id,
          lat: preferences.latitude,
          lon: preferences.longitude,
        }),
      });

      const result = await response.json();

      if (result.weather) {
        setWeather(result.weather);
      }
      if (result.location) {
        setLocationName(result.location);
      }
      if (result.alerts && result.alerts.length > 0) {
        loadAlerts();
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSettingsSave = async () => {
    await loadPreferences();
    setShowSettings(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Weather Alert AI</h2>
          <p className="text-gray-600 mb-6">
            Get started by setting up your location and alert preferences.
          </p>
          <button
            onClick={() => setShowSettings(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-all shadow-md"
          >
            Configure Settings
          </button>
        </div>
        {showSettings && (
          <SettingsModal
            preferences={null}
            onClose={() => setShowSettings(false)}
            onSave={handleSettingsSave}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Weather Alert AI</h1>
            <p className="text-gray-600">
              {locationName || preferences.location_name}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchWeather}
              disabled={refreshing}
              className="p-3 bg-white rounded-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              title="Refresh weather"
            >
              <RefreshCw className={`w-5 h-5 text-gray-700 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-3 bg-white rounded-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={signOut}
              className="p-3 bg-white rounded-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
              title="Sign out"
            >
              <LogOut className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WeatherCard weather={weather} preferences={preferences} />
          </div>
          <div>
            <AlertList alerts={alerts} onRefresh={loadAlerts} />
          </div>
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          preferences={preferences}
          onClose={() => setShowSettings(false)}
          onSave={handleSettingsSave}
        />
      )}
    </div>
  );
}
