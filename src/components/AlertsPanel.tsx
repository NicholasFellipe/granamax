// 🚨 PAINEL DE ALERTAS INTELIGENTES

import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Card } from './ui/Card';
import { useState } from 'react';

interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  icon: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  if (alerts.length === 0) {
    return null;
  }

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id));

  if (visibleAlerts.length === 0) {
    return null;
  }

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts([...dismissedAlerts, alertId]);
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'danger':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
        return <Info size={20} />;
    }
  };

  return (
    <div className="alerts-panel">
      {visibleAlerts.map((alert) => (
        <Card 
          key={alert.id} 
          className={`alert-card alert-card-${alert.type}`}
          padding="md"
        >
          <div className="alert-content">
            <div className="alert-icon-wrapper">
              <span className="alert-emoji">{alert.icon}</span>
              <div className={`alert-icon alert-icon-${alert.type}`}>
                {getAlertIcon(alert.type)}
              </div>
            </div>
            
            <div className="alert-text">
              <h4 className="alert-title">{alert.title}</h4>
              <p className="alert-message">{alert.message}</p>
            </div>

            <button
              onClick={() => handleDismiss(alert.id)}
              className="alert-dismiss"
              aria-label="Dispensar alerta"
            >
              <X size={20} />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
