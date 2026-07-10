// Vehicle Types
export interface Vehicle {
  make: string;
  model: string;
  year: number;
  engine: string;
  odometer_km: number;
}

// Sensor Types
export interface SensorReadings {
  ethanol_percent: number;
  water_ppm: number;
  fuel_temp_celsius: number;
  conductivity_uS?: number;
}

// OBD Data Types
export interface OBDData {
  short_term_fuel_trim_1: number;
  long_term_fuel_trim_1: number;
  knock_retard_degrees: number;
  misfire_count: number;
  injector_pulse_width_ms: number;
  fuel_pressure_kpa: number;
  intake_air_temp_c: number;
  engine_rpm: number;
  vehicle_speed_kmh: number;
  maf_g_s: number;
  lambda: number;
}

// Driving Context
export interface DrivingContext {
  trip_duration_min: number;
  avg_speed_kmh: number;
  idle_time_min: number;
  road_type: 'highway' | 'city' | 'mixed';
}

// Full Input
export interface FuelDataInput {
  vehicle: Vehicle;
  refueling: {
    date: string;
    station_id: string;
    gps_lat: number;
    gps_lon: number;
    fuel_amount_liters: number;
  };
  sensor_readings: SensorReadings;
  obd_data: OBDData;
  driving_context: DrivingContext;
  ground_truth?: Record<string, any>;
}

// Prediction Results
export interface PredictionResult {
  fuel_quality_score: number;
  estimated_ethanol: number;
  water_contamination: 'Low' | 'Medium' | 'High';
  expected_mileage_reduction: number;
  injector_deposit_risk: 'Low' | 'Medium' | 'High';
  fuel_pump_wear_status: 'Normal' | 'Elevated' | 'Critical';
  engine_health_score: number;
  recommended_injector_cleaner_km: number;
  recommended_fuel_filter_km: number;
  predicted_component_life_km: number;
}

export interface APIResponse {
  status: string;
  timestamp: string;
  prediction: PredictionResult;
  message?: string;
  data?: Record<string, any>;
}

// Form Data (flattened for React Hook Form)
export interface FormData {
  // Vehicle
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_engine: string;
  odometer_km: number;
  
  // Sensor
  ethanol_percent: number;
  water_ppm: number;
  fuel_temp_celsius: number;
  
  // OBD
  short_term_fuel_trim_1: number;
  long_term_fuel_trim_1: number;
  knock_retard_degrees: number;
  misfire_count: number;
  injector_pulse_width_ms: number;
  fuel_pressure_kpa: number;
  intake_air_temp_c: number;
  engine_rpm: number;
  vehicle_speed_kmh: number;
  maf_g_s: number;
  lambda: number;
  
  // Context
  trip_duration_min: number;
  avg_speed_kmh: number;
  idle_time_min: number;
  road_type: 'highway' | 'city' | 'mixed';
  
  // Refueling
  station_id: string;
  fuel_amount_liters: number;
}
