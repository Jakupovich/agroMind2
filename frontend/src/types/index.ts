export interface User {
  id: number;
  organization_id: number | null;
  email: string;
  full_name: string;
  role: 'super_admin' | 'org_admin' | 'operator';
  is_active: boolean;
  phone: string | null;
  avatar_url: string | null;
  email_alerts: boolean;
  sms_alerts: boolean;
  created_at: string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  subscription_plan: string;
  subscription_status: string;
  created_at: string;
}

export interface Location {
  id: number;
  organization_id: number;
  name: string;
  address: string | null;
  location_type: string;
  is_active: boolean;
  timezone: string;
  created_at: string;
}

export interface Zone {
  id: number;
  location_id: number;
  name: string;
  zone_type: string;
  risk_score: number;
  is_active: boolean;
  created_at: string;
}

export interface Camera {
  id: number;
  location_id: number;
  zone_id: number | null;
  name: string;
  rtsp_url: string;
  camera_type: string;
  status: string;
  is_active: boolean;
  thumbnail_url: string | null;
  detection_enabled: boolean;
  violence_detection: boolean;
  bullying_detection: boolean;
  weapon_detection: boolean;
  created_at: string;
}

export interface Incident {
  id: number;
  camera_id: number;
  organization_id: number;
  location_id: number;
  incident_type: 'violence' | 'bullying' | 'weapon';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'resolved';
  confidence: number;
  screenshot_url: string | null;
  clip_url: string | null;
  detected_at: string;
  resolved_at: string | null;
  resolved_by_id: number | null;
  created_at: string;
}

export interface IncidentStats {
  total: number;
  open: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  by_type: Record<string, number>;
}

export interface DashboardStats {
  total_cameras: number;
  active_cameras: number;
  total_incidents_today: number;
  open_incidents: number;
  critical_alerts: number;
  avg_risk_score: number;
}

export interface IncidentTrend {
  date: string;
  violence: number;
  bullying: number;
  weapon: number;
  total: number;
}

export interface ZoneRisk {
  zone_id: number;
  zone_name: string;
  risk_score: number;
  risk_level: string;
  incident_count: number;
  peak_hours: string | null;
}

export interface HeatmapData {
  zone_id: number;
  zone_name: string;
  location_name: string;
  incident_count: number;
  risk_score: number;
  severity_breakdown: Record<string, number>;
}

export interface RiskPrediction {
  zone_id: number;
  zone_name: string;
  risk_score: number;
  risk_level: string;
  peak_hour_start: number | null;
  peak_hour_end: number | null;
  incident_probability: number;
  trend: string;
  recommendation: string;
}

export interface SubscriptionPlan {
  name: string;
  price_monthly: number;
  max_cameras: number;
  features: string[];
}

export interface AlertEvent {
  type: 'alert';
  data: {
    incident_id: number;
    incident_type: string;
    severity: string;
    camera_name: string;
    description: string;
    screenshot_url: string | null;
  };
}
