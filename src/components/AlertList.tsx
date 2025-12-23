import { useState } from 'react';
import { WeatherAlert } from '../types';
import { supabase } from '../lib/supabase';
import { AlertTriangle, ThermometerSun, Snowflake, Wind, Droplets, TrendingUp, Bell, BellOff } from 'lucide-react';

interface AlertListProps {
  alerts: WeatherAlert[];
  onRefresh: () => void;
}

export default function AlertList({ alerts, onRefresh }: AlertListProps) {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'HIGH_TEMP':
        return <ThermometerSun className="w-5 h-5" />;
      case 'LOW_TEMP':
        return <Snowflake className="w-5 h-5" />;
      case 'STRONG_WIND':
        return <Wind className="w-5 h-5" />;
      case 'HIGH_HUMIDITY':
        return <Droplets className="w-5 h-5" />;
      case 'FEELS_LIKE_DIFF':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'extreme':
        return 'from-red-500 to-red-600 text-white';
      case 'high':
        return 'from-orange-500 to-orange-600 text-white';
      case 'medium':
        return 'from-yellow-400 to-yellow-500 text-gray-900';
      case 'low':
        return 'from-blue-400 to-blue-500 text-white';
      default:
        return 'from-gray-400 to-gray-500 text-white';
    }
  };

  const getSeverityBorder = (severity: string) => {
    switch (severity) {
      case 'extreme':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const markAsRead = async (alertId: string) => {
    await supabase
      .from('weather_alerts')
      .update({ is_read: true })
      .eq('id', alertId);
    onRefresh();
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {unreadCount > 0 ? (
              <Bell className="w-6 h-6 text-white" />
            ) : (
              <BellOff className="w-6 h-6 text-white" />
            )}
            <div>
              <h2 className="text-xl font-bold text-white">Active Alerts</h2>
              <p className="text-sm text-blue-100">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-h-[600px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">No alerts</p>
            <p className="text-sm text-gray-400">Weather conditions are normal</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-2 rounded-xl overflow-hidden transition-all ${
                  getSeverityBorder(alert.severity)
                } ${!alert.is_read ? 'ring-2 ring-offset-2 ring-blue-400' : ''}`}
              >
                <button
                  onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                  className="w-full p-4 text-left hover:bg-white/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${getSeverityColor(alert.severity)} flex-shrink-0`}>
                      {getAlertIcon(alert.alert_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {alert.title}
                        </h3>
                        {!alert.is_read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                      {expandedAlert === alert.id && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-700 mb-3">{alert.message}</p>
                          {!alert.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(alert.id);
                              }}
                              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Mark as Read
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
