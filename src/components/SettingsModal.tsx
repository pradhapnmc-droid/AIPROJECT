import { useState, useEffect } from 'react';
import { X, MapPin, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserPreference } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SettingsModalProps {
  preferences: UserPreference | null;
  onClose: () => void;
  onSave: () => void;
}

interface LocationResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export default function SettingsModal({ preferences, onClose, onSave }: SettingsModalProps) {
  const { user } = useAuth();
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    location_name: preferences?.location_name || '',
    latitude: preferences?.latitude || 0,
    longitude: preferences?.longitude || 0,
    temp_threshold_high: preferences?.temp_threshold_high || 35,
    temp_threshold_low: preferences?.temp_threshold_low || 0,
    wind_speed_threshold: preferences?.wind_speed_threshold || 15,
    humidity_threshold: preferences?.humidity_threshold || 85,
    alerts_enabled: preferences?.alerts_enabled ?? true,
  });

  const searchLocation = async () => {
    if (!locationSearch.trim()) return;

    setSearching(true);
    try {
      const apiKey = '8f3c1d87e8f3d8c4e62a5f7b1e9d2c4a';
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationSearch)}&limit=5&appid=${apiKey}`
      );
      const data = await response.json();
      setLocationResults(data);
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (location: LocationResult) => {
    setFormData({
      ...formData,
      location_name: `${location.name}${location.state ? ', ' + location.state : ''}, ${location.country}`,
      latitude: location.lat,
      longitude: location.lon,
    });
    setLocationResults([]);
    setLocationSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (preferences) {
        await supabase
          .from('user_preferences')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', preferences.id);
      } else {
        await supabase
          .from('user_preferences')
          .insert({
            ...formData,
            user_id: user?.id,
          });
      }
      onSave();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            {formData.location_name ? (
              <div className="flex items-center gap-2 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{formData.location_name}</p>
                  <p className="text-sm text-gray-600">
                    {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, location_name: '', latitude: 0, longitude: 0 })}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Change
                </button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), searchLocation())}
                    placeholder="Search for a city..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={searchLocation}
                  disabled={searching}
                  className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>

                {locationResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                    {locationResults.map((location, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectLocation(location)}
                        className="w-full text-left p-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <p className="font-medium text-gray-900">
                          {location.name}{location.state ? `, ${location.state}` : ''}
                        </p>
                        <p className="text-sm text-gray-600">{location.country}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Thresholds</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    High Temperature (°C)
                  </label>
                  <input
                    type="number"
                    value={formData.temp_threshold_high}
                    onChange={(e) => setFormData({ ...formData, temp_threshold_high: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Low Temperature (°C)
                  </label>
                  <input
                    type="number"
                    value={formData.temp_threshold_low}
                    onChange={(e) => setFormData({ ...formData, temp_threshold_low: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wind Speed (m/s)
                </label>
                <input
                  type="number"
                  value={formData.wind_speed_threshold}
                  onChange={(e) => setFormData({ ...formData, wind_speed_threshold: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Humidity (%)
                </label>
                <input
                  type="number"
                  value={formData.humidity_threshold}
                  onChange={(e) => setFormData({ ...formData, humidity_threshold: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="alerts_enabled"
                  checked={formData.alerts_enabled}
                  onChange={(e) => setFormData({ ...formData, alerts_enabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="alerts_enabled" className="text-sm font-medium text-gray-700">
                  Enable weather alerts
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.location_name}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
