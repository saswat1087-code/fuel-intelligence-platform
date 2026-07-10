import json
import random
from datetime import datetime, timedelta
import requests
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

VEHICLES = [
    {"make": "Skoda", "model": "Kushaq", "year": 2022, "engine": "1.5 TSI"},
    {"make": "Volkswagen", "model": "Taigun", "year": 2023, "engine": "1.5 TSI"},
    {"make": "Toyota", "model": "Hyryder", "year": 2023, "engine": "1.5L Hybrid"},
    {"make": "Honda", "model": "City", "year": 2022, "engine": "1.5L i-VTEC"},
    {"make": "Hyundai", "model": "Creta", "year": 2023, "engine": "1.5L CRDi"},
]

def generate_sensor_readings(quality="normal"):
    """Generate fuel sensor data with controlled variation"""
    if quality == "good":
        ethanol = random.uniform(8, 12)
        water = random.uniform(10, 40)
        temp = random.uniform(22, 28)
    elif quality == "poor":
        ethanol = random.uniform(18, 25)
        water = random.uniform(80, 200)
        temp = random.uniform(30, 38)
    else:  # normal
        ethanol = random.uniform(8, 18)
        water = random.uniform(20, 80)
        temp = random.uniform(25, 35)
    
    return {
        "ethanol_percent": round(ethanol, 1),
        "water_ppm": round(water, 1),
        "fuel_temp_celsius": round(temp, 1),
        "conductivity_uS": round(random.uniform(1.5, 3.5), 2)
    }

def generate_obd_data(ethanol_level):
    """OBD readings correlated with ethanol content"""
    fuel_trim_base = ethanol_level * 0.2
    
    return {
        "short_term_fuel_trim_1": round(random.uniform(-3, 3) + fuel_trim_base * 0.3, 2),
        "long_term_fuel_trim_1": round(random.uniform(0, 8) + fuel_trim_base * 0.5, 2),
        "knock_retard_degrees": round(max(0, random.uniform(0, 2) + (ethanol_level - 10) * 0.05), 2),
        "misfire_count": random.randint(0, 2),
        "injector_pulse_width_ms": round(random.uniform(2.5, 4.5) + (ethanol_level - 10) * 0.03, 2),
        "fuel_pressure_kpa": round(random.uniform(5500, 6100), 1),
        "intake_air_temp_c": round(random.uniform(30, 45), 1),
        "engine_rpm": random.randint(800, 2500),
        "vehicle_speed_kmh": round(random.uniform(20, 80), 1),
        "maf_g_s": round(random.uniform(8, 20), 1),
        "lambda": round(random.uniform(0.96, 1.02), 3)
    }

def generate_sample_record(quality="normal"):
    """Generate a complete sample record"""
    vehicle = random.choice(VEHICLES)
    sensor = generate_sensor_readings(quality)
    obd = generate_obd_data(sensor["ethanol_percent"])
    
    # Calculate ground truth
    ethanol_factor = 1 + (sensor["ethanol_percent"] - 10) * 0.015
    water_factor = 1 + (sensor["water_ppm"] / 5000)
    temp_factor = 1 + abs(sensor["fuel_temp_celsius"] - 25) * 0.002
    
    base_consumption = random.uniform(6.0, 8.0)
    actual_consumption = base_consumption * ethanol_factor * water_factor * temp_factor
    
    mileage_loss = ((actual_consumption - base_consumption) / base_consumption) * 100
    
    deposit_rate = (
        0.2 + 
        (sensor["ethanol_percent"] - 10) * 0.015 + 
        obd["knock_retard_degrees"] * 0.1 +
        random.uniform(-0.1, 0.1)
    )
    
    pump_wear_score = (
        abs(obd["fuel_pressure_kpa"] - 5800) / 1000 +
        sensor["water_ppm"] / 500 +
        (sensor["fuel_temp_celsius"] - 25) / 20
    )
    
    return {
        "vehicle": vehicle,
        "refueling": {
            "date": datetime.now().isoformat(),
            "station_id": f"STN-{random.randint(1,50):04d}",
            "gps_lat": 28.6 + random.uniform(-0.1, 0.1),
            "gps_lon": 77.2 + random.uniform(-0.1, 0.1),
            "fuel_amount_liters": round(random.uniform(25, 45), 1)
        },
        "sensor_readings": sensor,
        "obd_data": obd,
        "driving_context": {
            "trip_duration_min": random.randint(20, 90),
            "avg_speed_kmh": round(random.uniform(25, 65), 1),
            "idle_time_min": random.randint(2, 15),
            "road_type": random.choice(["highway", "city", "mixed"])
        },
        "ground_truth": {
            "actual_consumption_l_per_100km": round(actual_consumption, 2),
            "expected_consumption_l_per_100km": round(base_consumption, 2),
            "ground_truth_mileage_loss": round(mileage_loss, 2),
            "ground_truth_deposit_mg_per_100km": round(deposit_rate, 3),
            "ground_truth_pump_wear_score": round(pump_wear_score, 3)
        }
    }

def inject_batch(n_records=50, base_url="http://localhost:8000"):
    """Inject multiple records into the API"""
    success_count = 0
    for i in range(n_records):
        quality = random.choices(
            ["good", "normal", "poor"], 
            weights=[0.2, 0.6, 0.2]
        )[0]
        record = generate_sample_record(quality)
        
        try:
            response = requests.post(
                f"{base_url}/api/v1/ingest",
                json=record
            )
            if response.status_code == 200:
                success_count += 1
                print(f"✓ Record {i+1}/{n_records} injected")
            else:
                print(f"✗ Record {i+1} failed: {response.status_code}")
        except Exception as e:
            print(f"✗ Error: {e}")
    
    print(f"\n✅ Successfully injected {success_count}/{n_records} records")

if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    url = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8000"
    print(f"Generating and injecting {n} sample records...")
    inject_batch(n, url)
