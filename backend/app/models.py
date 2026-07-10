from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class RoadType(str, Enum):
    HIGHWAY = "highway"
    CITY = "city"
    MIXED = "mixed"

class Vehicle(BaseModel):
    make: str = Field(..., min_length=1, description="Vehicle manufacturer")
    model: str = Field(..., min_length=1, description="Vehicle model")
    year: int = Field(..., ge=1900, le=2026, description="Manufacturing year")
    engine: str = Field(..., min_length=1, description="Engine specification")
    odometer_km: float = Field(..., ge=0, description="Current odometer reading")

class SensorReadings(BaseModel):
    ethanol_percent: float = Field(..., ge=0, le=100, description="Ethanol content percentage")
    water_ppm: float = Field(..., ge=0, description="Water contamination in PPM")
    fuel_temp_celsius: float = Field(..., ge=-20, le=80, description="Fuel temperature in Celsius")
    conductivity_uS: Optional[float] = Field(None, description="Fuel conductivity in microsiemens")

class OBDData(BaseModel):
    short_term_fuel_trim_1: float = Field(..., description="Short-term fuel trim bank 1")
    long_term_fuel_trim_1: float = Field(..., description="Long-term fuel trim bank 1")
    knock_retard_degrees: float = Field(..., ge=0, description="Knock retard in degrees")
    misfire_count: int = Field(..., ge=0, description="Number of misfires detected")
    injector_pulse_width_ms: float = Field(..., gt=0, description="Injector pulse width in ms")
    fuel_pressure_kpa: float = Field(..., gt=0, description="Fuel rail pressure in kPa")
    intake_air_temp_c: float = Field(..., description="Intake air temperature in Celsius")
    engine_rpm: int = Field(..., gt=0, description="Engine speed in RPM")
    vehicle_speed_kmh: float = Field(..., ge=0, description="Vehicle speed in km/h")
    maf_g_s: float = Field(..., gt=0, description="Mass air flow in g/s")
    lambda_value: float = Field(..., ge=0.5, le=1.5, description="Lambda value (air-fuel ratio)")
    
    @validator('lambda', pre=True)
    def validate_lambda(cls, v):
        if v is None:
            return 1.0
        return v

class DrivingContext(BaseModel):
    trip_duration_min: int = Field(..., gt=0, description="Trip duration in minutes")
    avg_speed_kmh: float = Field(..., ge=0, description="Average speed in km/h")
    idle_time_min: int = Field(..., ge=0, description="Idle time in minutes")
    road_type: RoadType = Field(..., description="Type of road driven on")

class Refueling(BaseModel):
    date: datetime = Field(default_factory=datetime.now)
    station_id: str = Field(..., description="Fuel station identifier")
    gps_lat: float = Field(..., ge=-90, le=90, description="GPS latitude")
    gps_lon: float = Field(..., ge=-180, le=180, description="GPS longitude")
    fuel_amount_liters: float = Field(..., gt=0, description="Fuel amount in liters")

class GroundTruth(BaseModel):
    actual_consumption_l_per_100km: Optional[float] = None
    expected_consumption_l_per_100km: Optional[float] = None
    ground_truth_mileage_loss: Optional[float] = None
    ground_truth_deposit_mg_per_100km: Optional[float] = None
    ground_truth_pump_wear_score: Optional[float] = None

class FuelDataInput(BaseModel):
    vehicle: Vehicle
    refueling: Refueling
    sensor_readings: SensorReadings
    obd_data: OBDData
    driving_context: DrivingContext
    ground_truth: Optional[GroundTruth] = None

class PredictionResult(BaseModel):
    fuel_quality_score: float = Field(..., ge=0, le=100)
    estimated_ethanol: float = Field(..., ge=0, le=100)
    water_contamination: str = Field(..., description="Low, Medium, or High")
    expected_mileage_reduction: float = Field(..., ge=0, description="Percentage reduction in mileage")
    injector_deposit_risk: str = Field(..., description="Low, Medium, or High")
    fuel_pump_wear_status: str = Field(..., description="Normal, Elevated, or Critical")
    engine_health_score: float = Field(..., ge=0, le=100)
    recommended_injector_cleaner_km: int = Field(..., gt=0)
    recommended_fuel_filter_km: int = Field(..., gt=0)
    predicted_component_life_km: int = Field(..., gt=0)

class APIResponse(BaseModel):
    status: str
    timestamp: datetime = Field(default_factory=datetime.now)
    prediction: Optional[PredictionResult] = None
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
