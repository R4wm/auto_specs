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

  getById: async (id: number): Promise<BuildDetail> => {
    const response = await api.get(`/api/builds/${id}`);
    return response.data;
  },

  create: async (data: Partial<Build>): Promise<Build> => {
    const response = await api.post('/api/builds', data);
    return response.data;
  },
};

export default api;
