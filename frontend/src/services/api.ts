import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  phone_verified?: boolean;
  oauth_provider?: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface Build {
  id: number;
  user_id: number;
  name: string;
  slug: string;  // URL-safe slug for public sharing

  // Basic Info
  use_type?: string;
  fuel_type?: string;
  notes?: string;

  // Performance Targets
  target_hp?: number;
  target_torque?: number;
  rev_limit_rpm?: number;

  // Engine Specs
  displacement_ci?: number;
  bore_in?: number;
  stroke_in?: number;
  rod_len_in?: number;
  deck_clear_in?: number;
  piston_cc?: number;
  chamber_cc?: number;
  gasket_bore_in?: number;
  gasket_thickness_in?: number;
  quench_in?: number;
  static_cr?: number;
  dynamic_cr?: number;
  balance_oz?: number;
  flywheel_teeth?: number;
  firing_order?: string;

  // Camshaft Specs
  camshaft_model?: string;
  camshaft_duration_int?: string;
  camshaft_duration_exh?: string;
  camshaft_lift_int?: number;
  camshaft_lift_exh?: number;
  camshaft_lsa?: number;

  // Ring Gap Measurements
  ring_gap_top_in?: number;
  ring_gap_second_in?: number;
  ring_gap_oil_in?: number;

  // Bearing Clearances
  cam_bearing_clearance_in?: number;

  // Vehicle Information
  vehicle_year?: number;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_trim?: string;
  vin?: string;
  vehicle_weight_lbs?: number;

  // Transmission
  transmission_type?: string;
  transmission_model?: string;
  transmission_gears?: number;
  final_drive_ratio?: string;

  // Suspension & Handling
  suspension_front?: string;
  suspension_rear?: string;
  spring_rate_front?: string;
  spring_rate_rear?: string;
  sway_bar_front?: string;
  sway_bar_rear?: string;

  // Tires & Wheels
  tire_size_front?: string;
  tire_size_rear?: string;
  tire_brand?: string;
  tire_model?: string;
  wheel_size_front?: string;
  wheel_size_rear?: string;

  // Fluids & Lubricants
  engine_oil_type?: string;
  engine_oil_weight?: string;
  engine_oil_capacity?: string;
  transmission_fluid_type?: string;
  differential_fluid_type?: string;
  coolant_type?: string;

  // User info (from join)
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface BuildDetail extends Build {
  vehicle?: any;
  drivetrain?: any;
  engine_parts?: any[];
  vehicle_parts?: any[];
  tuning?: any;
  maintenance?: any[];
  performance?: any[];
  components?: {
    engine_internals?: Component;
    transmission?: Component;
    differential?: Component;
    suspension?: Component;
    tires_wheels?: Component;
    frame?: Component;
    cab_interior?: Component;
    brakes?: Component;
    fuel_system?: Component;
    induction_system?: Component;
    additional_components?: Component;
  };
}

// Component interfaces
export interface Component {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  is_template: boolean;
  component_data: any;  // Flexible JSONB data
  data_size_bytes: number;
  created_at: string;
  updated_at: string;
}

export type ComponentType =
  | 'engine-internals'
  | 'transmission'
  | 'differential'
  | 'suspension'
  | 'tires-wheels'
  | 'frame'
  | 'cab-interior'
  | 'brakes'
  | 'fuel-system'
  | 'induction-system'
  | 'additional-components';

export interface ComponentExport {
  export_version: string;
  component_type: string;
  name: string;
  description?: string;
  data: any;
  exported_at: string;
}

// Snapshot interfaces
export interface Snapshot {
  id: number;
  build_id: number;
  maintenance_id?: number;
  snapshot_type: string;
  change_description?: string;
  user_id?: number;
  created_at: string;
  first_name?: string;
  last_name?: string;
  maintenance_type?: string;
}

export interface SnapshotDiff {
  snapshot_before: {
    id: number;
    created_at: string;
    snapshot_type: string;
    change_description?: string;
  };
  snapshot_after: {
    id: number;
    created_at: string;
    snapshot_type: string;
    change_description?: string;
  };
  changes: {
    [key: string]: {
      before: any;
      after: any;
      has_changes: boolean;
    };
  };
}

// Subscription interfaces
export interface SubscriptionStatus {
  tier: 'default' | 'premier';
  status: string;
  builds_used: number;
  builds_limit: number;
  build_usage_percentage: number;
  storage_used_bytes: number;
  storage_used_mb: number;
  storage_limit_bytes: number;
  storage_limit_mb: number;
  storage_usage_percentage: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  start_date?: string;
  end_date?: string;
}

// Maintenance interfaces
export interface MaintenanceRecord {
  id: number;
  build_id: number;
  maintenance_type: string;
  timestamp: string;
  notes?: string;
  odometer_miles?: number;
  engine_hours?: number;
  cost?: number;
  brand?: string;
  part_number?: string;
  quantity?: number;
}

export interface MaintenanceAttachment {
  id: number;
  maintenance_id: number;
  file_path: string;
  file_name: string;
  file_size_bytes: number;
  file_type?: string;
  description?: string;
  uploaded_at: string;
}

export interface ComponentNote {
  id: string;
  timestamp: string;
  user_id: number;
  user_name: string;
  content: string;
  action_type: 'add' | 'edit' | 'delete';
  last_edited?: string;
}

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<TokenResponse> => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  googleAuth: async (credential: string): Promise<TokenResponse> => {
    const response = await api.post('/api/auth/google', { credential });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Builds API
export const buildsAPI = {
  getAll: async (): Promise<Build[]> => {
    const response = await api.get('/api/builds');
    return response.data;
  },

  getById: async (identifier: string | number): Promise<BuildDetail> => {
    const response = await api.get(`/api/builds/${identifier}`);
    return response.data;
  },

  create: async (data: Partial<Build>): Promise<Build> => {
    const response = await api.post('/api/builds', data);
    return response.data;
  },

  update: async (identifier: string | number, changes: Partial<Build>): Promise<any> => {
    const response = await api.patch(`/api/builds/${identifier}`, changes);
    return response.data;
  },

  // Component JSON updates
  updateEngineInternals: async (id: number, data: any) => {
    const response = await api.put(`/api/builds/${id}/engine-internals`, data);
    return response.data;
  },

  updateSuspension: async (id: number, data: any) => {
    const response = await api.put(`/api/builds/${id}/suspension`, data);
    return response.data;
  },

  updateRearDifferential: async (id: number, data: any) => {
    const response = await api.put(`/api/builds/${id}/rear-differential`, data);
    return response.data;
  },

  updateTransmission: async (id: number, data: any) => {
    const response = await api.put(`/api/builds/${id}/transmission`, data);
    return response.data;
  },

  updateFrame: async (id: number, data: any) => {
    const response = await api.put(`/api/builds/${id}/frame`, data);
    return response.data;
  },

  updateCabInterior: async (id: number, data: any) => {
    const response = await api.put(`/api/builds/${id}/cab-interior`, data);
    return response.data;
  },

  updateTiresWheels: async (id: number, data: any) => {
    const response = await api.put(`/api/builds/${id}/tires-wheels`, data);
    return response.data;
  },

  // File upload
  uploadComponentPhoto: async (id: number, componentType: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('component_type', componentType);
    const response = await api.post(`/api/builds/${id}/upload-component-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};

// Snapshots API
export const snapshotsAPI = {
  getHistory: async (buildId: number): Promise<Snapshot[]> => {
    const response = await api.get(`/api/builds/${buildId}/snapshots`);
    return response.data;
  },

  getById: async (snapshotId: number): Promise<Snapshot> => {
    const response = await api.get(`/api/snapshots/${snapshotId}`);
    return response.data;
  },

  compareDiff: async (snapshotId: number, compareToId: number): Promise<SnapshotDiff> => {
    const response = await api.get(`/api/snapshots/${snapshotId}/diff/${compareToId}`);
    return response.data;
  },

  restore: async (buildId: number, snapshotId: number) => {
    const response = await api.post(`/api/builds/${buildId}/restore/${snapshotId}`);
    return response.data;
  },
};

// Subscription API
export const subscriptionAPI = {
  getStatus: async (): Promise<SubscriptionStatus> => {
    const response = await api.get('/api/subscription');
    return response.data;
  },

  createCheckoutSession: async () => {
    const response = await api.post('/api/subscription/checkout');
    return response.data;
  },

  createPortalSession: async () => {
    const response = await api.post('/api/subscription/portal');
    return response.data;
  },
};

// Maintenance API
export const maintenanceAPI = {
  create: async (buildId: number, data: Partial<MaintenanceRecord>) => {
    const response = await api.post(`/api/builds/${buildId}/maintenance`, data);
    return response.data;
  },

  update: async (buildId: number, maintenanceId: number, data: Partial<MaintenanceRecord>) => {
    const response = await api.put(`/api/builds/${buildId}/maintenance/${maintenanceId}`, data);
    return response.data;
  },

  uploadAttachment: async (maintenanceId: number, file: File, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    const response = await api.post(`/api/maintenance/${maintenanceId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getAttachments: async (maintenanceId: number): Promise<MaintenanceAttachment[]> => {
    const response = await api.get(`/api/maintenance/${maintenanceId}/attachments`);
    return response.data;
  },
};

// Component Notes API
export const componentNotesAPI = {
  getAll: async (buildId: number, component: ComponentType): Promise<ComponentNote[]> => {
    const response = await api.get(`/api/builds/${buildId}/${component}/notes`);
    return response.data.notes;
  },

  add: async (buildId: number, component: ComponentType, content: string): Promise<ComponentNote> => {
    const response = await api.post(`/api/builds/${buildId}/${component}/notes`, { content });
    return response.data.note;
  },

  update: async (buildId: number, component: ComponentType, noteId: string, content: string): Promise<ComponentNote> => {
    const response = await api.put(`/api/builds/${buildId}/${component}/notes/${noteId}`, { content });
    return response.data.note;
  },

  delete: async (buildId: number, component: ComponentType, noteId: string): Promise<void> => {
    await api.delete(`/api/builds/${buildId}/${component}/notes/${noteId}`);
  },
};

// Components API
export const componentsAPI = {
  create: async (componentType: ComponentType, data: {
    name: string;
    component_data: any;
    description?: string;
    is_template?: boolean;
  }): Promise<Component> => {
    const response = await api.post(`/api/components/${componentType}`, data);
    return response.data;
  },

  getById: async (componentType: ComponentType, id: number): Promise<Component> => {
    const response = await api.get(`/api/components/${componentType}/${id}`);
    return response.data;
  },

  update: async (componentType: ComponentType, id: number, updates: Partial<Component>): Promise<Component> => {
    const response = await api.patch(`/api/components/${componentType}/${id}`, updates);
    return response.data;
  },

  delete: async (componentType: ComponentType, id: number): Promise<void> => {
    await api.delete(`/api/components/${componentType}/${id}`);
  },

  listTemplates: async (componentType: ComponentType): Promise<Component[]> => {
    const response = await api.get(`/api/templates/${componentType}`);
    return response.data;
  },

  clone: async (componentType: ComponentType, id: number, newName: string): Promise<Component> => {
    const response = await api.post(`/api/components/${componentType}/${id}/clone`, { name: newName });
    return response.data;
  },

  export: async (componentType: ComponentType, id: number): Promise<ComponentExport> => {
    const response = await api.get(`/api/components/${componentType}/${id}/export`);
    return response.data;
  },

  import: async (componentType: ComponentType, importData: ComponentExport): Promise<Component> => {
    const response = await api.post(`/api/components/${componentType}/import`, importData);
    return response.data;
  },
};

export default api;
