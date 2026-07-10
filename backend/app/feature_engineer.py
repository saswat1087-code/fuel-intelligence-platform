import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from typing import List, Tuple
import joblib
import os

class FeatureEngineer:
    def __init__(self, model_dir: str = "./models"):
        self.model_dir = model_dir
        os.makedirs(model_dir, exist_ok=True)
        self.scaler = StandardScaler()
        self.road_encoder = LabelEncoder()
        self._fitted = False
        self.feature_columns = None

    def create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract engineered features from raw data"""
        df_copy = df.copy()
        
        # Fuel quality composite score (proprietary weighting)
        df_copy['fuel_quality_score'] = (
            (100 - df_copy['ethanol_percent'] * 2.5) * 0.6 +
            (100 - np.clip(df_copy['water_ppm'] * 0.15, 0, 100)) * 0.3 +
            (100 - np.abs(df_copy['fuel_temp_celsius'] - 25) * 0.5) * 0.1
        ).clip(0, 100)

        # Fuel trim deviation (how much ECU is compensating)
        df_copy['fuel_trim_deviation'] = np.abs(
            df_copy['short_term_fuel_trim_1'] + df_copy['long_term_fuel_trim_1']
        )

        # Knock severity index
        df_copy['knock_severity'] = df_copy['knock_retard_degrees'] * (df_copy['engine_rpm'] / 1000)

        # Injector duty cycle
        df_copy['injector_duty_cycle'] = (
            df_copy['injector_pulse_width_ms'] * df_copy['engine_rpm'] / 1200
        )

        # Fuel pressure deviation from ideal (for this engine)
        df_copy['fuel_pressure_deviation'] = np.abs(df_copy['fuel_pressure_kpa'] - 5800) / 5800

        # Efficiency ratio (MAF / speed)
        df_copy['efficiency_ratio'] = df_copy['maf_g_s'] / (df_copy['vehicle_speed_kmh'] + 1)

        # Lambda deviation (ideal = 1.0)
        df_copy['lambda_deviation'] = np.abs(df_copy['lambda'] - 1.0) * 100

        # Ethanol impact on stoich (stoich AFR drops with ethanol)
        df_copy['stoich_afr_estimate'] = 14.7 - (df_copy['ethanol_percent'] / 100 * 3.0)

        # Road type encoding
        if 'road_type' in df_copy.columns:
            if not self._fitted:
                self.road_encoder.fit(df_copy['road_type'].astype(str))
                self._fitted = True
            df_copy['road_type_encoded'] = self.road_encoder.transform(
                df_copy['road_type'].astype(str)
            )

        # Calculate component risk scores
        df_copy['deposit_risk_score'] = (
            (df_copy['ethanol_percent'] - 10) * 0.5 +
            df_copy['knock_retard_degrees'] * 2 +
            df_copy['injector_duty_cycle'] / 10
        ).clip(0, 10)

        df_copy['pump_wear_score'] = (
            df_copy['fuel_pressure_deviation'] * 5 +
            df_copy['water_ppm'] / 200 +
            df_copy['fuel_temp_celsius'] / 50
        ).clip(0, 10)

        return df_copy

    def get_feature_columns(self) -> List[str]:
        """Return the list of feature columns used for model training"""
        return [
            'ethanol_percent', 'water_ppm', 'fuel_temp_celsius',
            'fuel_quality_score', 'fuel_trim_deviation', 'knock_severity',
            'injector_duty_cycle', 'fuel_pressure_deviation',
            'efficiency_ratio', 'lambda_deviation', 'stoich_afr_estimate',
            'avg_speed_kmh', 'engine_rpm', 'road_type_encoded',
            'deposit_risk_score', 'pump_wear_score'
        ]

    def normalize_features(self, df: pd.DataFrame, feature_cols: List[str]) -> pd.DataFrame:
        """Apply standardization to numeric features"""
        df_scaled = df.copy()
        
        if not self._fitted:
            self.scaler.fit(df_scaled[feature_cols])
            self._fitted = True
            # Save scaler
            joblib.dump(self.scaler, f"{self.model_dir}/scaler.pkl")
        
        df_scaled[feature_cols] = self.scaler.transform(df_scaled[feature_cols])
        return df_scaled

    def load_scaler(self):
        """Load pre-trained scaler"""
        scaler_path = f"{self.model_dir}/scaler.pkl"
        if os.path.exists(scaler_path):
            self.scaler = joblib.load(scaler_path)
            self._fitted = True
