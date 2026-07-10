import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Thermostat as TempIcon,
  WaterDrop as WaterIcon,
  LocalGasStation as FuelIcon,
  CarRepair as EngineIcon,
  Info as InfoIcon,
  DirectionsCar as CarIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { fuelAPI } from '../services/api';
import { FuelDataInput, FormData } from '../types';
import ResultDashboard from './ResultDashboard';

// Zod validation schema
const formSchema = z.object({
  // Vehicle
  vehicle_make: z.string().min(1, 'Make is required'),
  vehicle_model: z.string().min(1, 'Model is required'),
  vehicle_year: z.number().min(1900).max(2026),
  vehicle_engine: z.string().min(1, 'Engine is required'),
  odometer_km: z.number().positive('Odometer must be positive'),

  // Sensor readings
  ethanol_percent: z.number().min(0).max(100, 'Ethanol must be between 0 and 100'),
  water_ppm: z.number().min(0, 'Water must be positive'),
  fuel_temp_celsius: z.number().min(-10).max(60, 'Temperature out of range'),

  // OBD Data
  short_term_fuel_trim_1: z.number(),
  long_term_fuel_trim_1: z.number(),
  knock_retard_degrees: z.number().min(0, 'Knock retard must be positive'),
  misfire_count: z.number().min(0, 'Misfire count must be positive'),
  injector_pulse_width_ms: z.number().positive('Injector pulse must be positive'),
  fuel_pressure_kpa: z.number().positive('Fuel pressure must be positive'),
  intake_air_temp_c: z.number(),
  engine_rpm: z.number().positive('RPM must be positive'),
  vehicle_speed_kmh: z.number().min(0, 'Speed must be positive'),
  maf_g_s: z.number().positive('MAF must be positive'),
  lambda: z.number().min(0.5).max(1.5, 'Lambda must be between 0.5 and 1.5'),

  // Driving context
  trip_duration_min: z.number().positive('Trip duration must be positive'),
  avg_speed_kmh: z.number().min(0, 'Average speed must be positive'),
  idle_time_min: z.number().min(0, 'Idle time must be positive'),
  road_type: z.enum(['highway', 'city', 'mixed']),

  // Refueling
  station_id: z.string().optional(),
  fuel_amount_liters: z.number().positive('Fuel amount must be positive'),
});

const steps = ['Vehicle Info', 'Fuel Sensor', 'OBD Data', 'Driving Context'];

const PredictionForm: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState<any>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicle_make: 'Skoda',
      vehicle_model: 'Kushaq',
      vehicle_year: 2022,
      vehicle_engine: '1.5 TSI',
      odometer_km: 15420,
      ethanol_percent: 19.2,
      water_ppm: 45,
      fuel_temp_celsius: 32.5,
      short_term_fuel_trim_1: -2.3,
      long_term_fuel_trim_1: 5.1,
      knock_retard_degrees: 1.2,
      misfire_count: 0,
      injector_pulse_width_ms: 3.8,
      fuel_pressure_kpa: 5800,
      intake_air_temp_c: 38,
      engine_rpm: 1850,
      vehicle_speed_kmh: 62,
      maf_g_s: 14.2,
      lambda: 0.98,
      trip_duration_min: 45,
      avg_speed_kmh: 42,
      idle_time_min: 8,
      road_type: 'highway',
      station_id: 'STN-0042',
      fuel_amount_liters: 35.5,
    },
  });

  const predictMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: FuelDataInput = {
        vehicle: {
          make: data.vehicle_make,
          model: data.vehicle_model,
          year: data.vehicle_year,
          engine: data.vehicle_engine,
          odometer_km: data.odometer_km,
        },
        sensor_readings: {
          ethanol_percent: data.ethanol_percent,
          water_ppm: data.water_ppm,
          fuel_temp_celsius: data.fuel_temp_celsius,
        },
        obd_data: {
          short_term_fuel_trim_1: data.short_term_fuel_trim_1,
          long_term_fuel_trim_1: data.long_term_fuel_trim_1,
          knock_retard_degrees: data.knock_retard_degrees,
          misfire_count: data.misfire_count,
          injector_pulse_width_ms: data.injector_pulse_width_ms,
          fuel_pressure_kpa: data.fuel_pressure_kpa,
          intake_air_temp_c: data.intake_air_temp_c,
          engine_rpm: data.engine_rpm,
          vehicle_speed_kmh: data.vehicle_speed_kmh,
          maf_g_s: data.maf_g_s,
          lambda: data.lambda,
        },
        refueling: {
          date: new Date().toISOString(),
          station_id: data.station_id || 'STN-0001',
          gps_lat: 28.6139,
          gps_lon: 77.2090,
          fuel_amount_liters: data.fuel_amount_liters,
        },
        driving_context: {
          trip_duration_min: data.trip_duration_min,
          avg_speed_kmh: data.avg_speed_kmh,
          idle_time_min: data.idle_time_min,
          road_type: data.road_type,
        },
      };
      return fuelAPI.predict(payload);
    },
    onSuccess: (data) => {
      setResult(data);
      setActiveStep(4);
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message || 'Failed to get prediction'}`);
    },
  });

  const handleNext = async () => {
    // Validate current step fields
    const fields = getStepFields(activeStep);
    const isValid = await trigger(fields as any);
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const getStepFields = (step: number): (keyof FormData)[] => {
    switch (step) {
      case 0:
        return ['vehicle_make', 'vehicle_model', 'vehicle_year', 'vehicle_engine', 'odometer_km'];
      case 1:
        return ['ethanol_percent', 'water_ppm', 'fuel_temp_celsius', 'fuel_amount_liters'];
      case 2:
        return [
          'short_term_fuel_trim_1',
          'long_term_fuel_trim_1',
          'knock_retard_degrees',
          'misfire_count',
          'injector_pulse_width_ms',
          'fuel_pressure_kpa',
          'intake_air_temp_c',
          'engine_rpm',
          'vehicle_speed_kmh',
          'maf_g_s',
          'lambda',
        ];
      case 3:
        return ['trip_duration_min', 'avg_speed_kmh', 'idle_time_min', 'road_type'];
      default:
        return [];
    }
  };

  const onSubmit = (data: FormData) => {
    predictMutation.mutate(data);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderVehicleStep();
      case 1:
        return renderSensorStep();
      case 2:
        return renderOBDStep();
      case 3:
        return renderContextStep();
      default:
        return null;
    }
  };

  const renderVehicleStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Controller
          name="vehicle_make"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Make"
              fullWidth
              error={!!errors.vehicle_make}
              helperText={errors.vehicle_make?.message}
              InputProps={{
                startAdornment: <CarIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          name="vehicle_model"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Model"
              fullWidth
              error={!!errors.vehicle_model}
              helperText={errors.vehicle_model?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="vehicle_year"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Year"
              type="number"
              fullWidth
              error={!!errors.vehicle_year}
              helperText={errors.vehicle_year?.message}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="vehicle_engine"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Engine"
              fullWidth
              error={!!errors.vehicle_engine}
              helperText={errors.vehicle_engine?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="odometer_km"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Odometer (km)"
              type="number"
              fullWidth
              error={!!errors.odometer_km}
              helperText={errors.odometer_km?.message}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="station_id"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Station ID (optional)"
              fullWidth
              placeholder="e.g., STN-0042"
            />
          )}
        />
      </Grid>
    </Grid>
  );

  const renderSensorStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Controller
          name="ethanol_percent"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Ethanol (%)"
              type="number"
              fullWidth
              error={!!errors.ethanol_percent}
              helperText={errors.ethanol_percent?.message}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: <FuelIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="water_ppm"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Water (ppm)"
              type="number"
              fullWidth
              error={!!errors.water_ppm}
              helperText={errors.water_ppm?.message}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: <WaterIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="fuel_temp_celsius"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Fuel Temp (°C)"
              type="number"
              fullWidth
              error={!!errors.fuel_temp_celsius}
              helperText={errors.fuel_temp_celsius?.message}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: <TempIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="fuel_amount_liters"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Fuel Amount (Liters)"
              type="number"
              fullWidth
              error={!!errors.fuel_amount_liters}
              helperText={errors.fuel_amount_liters?.message}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          )}
        />
      </Grid>
    </Grid>
  );

  const renderOBDStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Controller
          name="short_term_fuel_trim_1"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Short-term Fuel Trim"
              type="number"
              fullWidth
              error={!!errors.short_term_fuel_trim_1}
              helperText={errors.short_term_fuel_trim_1?.message}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          name="long_term_fuel_trim_1"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Long-term Fuel Trim"
              type="number"
              fullWidth
              error={!!errors.long_term_fuel_trim_1}
              helperText={errors.long_term_fuel_trim_1?.message}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="knock_retard_degrees"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Knock Retard (°)"
              type="number"
              fullWidth
              error={!!errors.knock_retard_degrees}
              helperText={errors.knock_retard_degrees?.message}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="misfire_count"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Misfire Count"
              type="number"
              fullWidth
              error={!!errors.misfire_count}
              helperText={errors.misfire_count?.message}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="injector_pulse_width_ms"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Injector Pulse (ms)"
              type="number"
              fullWidth
              error={!!errors.injector_pulse_width_ms}
              helperText={errors.injector_pulse_width_ms?.message}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="fuel_pressure_kpa"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Fuel Pressure (kPa)"
              type="number"
              fullWidth
              error={!!errors.fuel_pressure_kpa}
              helperText={errors.fuel_pressure_kpa?.message}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="intake_air_temp_c"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Intake Air Temp (°C)"
              type="number"
              fullWidth
              error={!!errors.intake_air_temp_c}
              helperText={errors.intake_air_temp_c?.message}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="engine_rpm"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Engine RPM"
              type="number"
              fullWidth
              error={!!errors.engine_rpm}
              helperText={errors.engine_rpm?.message}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="vehicle_speed_kmh"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Speed (km/h)"
              type="number"
              fullWidth
              error={!!errors.vehicle_speed_kmh}
              helperText={errors.vehicle_speed_kmh?.message}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: <SpeedIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="maf_g_s"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="MAF (g/s)"
              type="number"
              fullWidth
              error={!!errors.maf_g_s}
              helperText={errors.maf_g_s?.message}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="lambda"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Lambda"
              type="number"
              inputProps={{ step: "0.01" }}
              fullWidth
              error={!!errors.lambda}
              helperText={errors.lambda?.message}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          )}
        />
      </Grid>
    </Grid>
  );

  const renderContextStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Controller
          name="trip_duration_min"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Trip Duration (min)"
              type="number"
              fullWidth
              error={!!errors.trip_duration_min}
              helperText={errors.trip_duration_min?.message}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="avg_speed_kmh"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Avg Speed (km/h)"
              type="number"
              fullWidth
              error={!!errors.avg_speed_kmh}
              helperText={errors.avg_speed_kmh?.message}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Controller
          name="idle_time_min"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Idle Time (min)"
              type="number"
              fullWidth
              error={!!errors.idle_time_min}
              helperText={errors.idle_time_min?.message}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="road_type"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.road_type}>
              <InputLabel>Road Type</InputLabel>
              <Select {...field} label="Road Type">
                <MenuItem value="highway">Highway</MenuItem>
                <MenuItem value="city">City</MenuItem>
                <MenuItem value="mixed">Mixed</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Grid>
    </Grid>
  );

  if (result) {
    return <ResultDashboard result={result} onReset={() => {
      setResult(null);
      setActiveStep(0);
      window.scrollTo(0, 0);
    }} />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            ⛽ Fuel Intelligence Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter fuel sensor and OBD-II data to get real-time engine health predictions
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
          <Step>
            <StepLabel>Results</StepLabel>
          </Step>
        </Stepper>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ minHeight: 400 }}>{renderStepContent(activeStep)}</Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={predictMutation.isPending}
                  startIcon={
                    predictMutation.isPending ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <EngineIcon />
                    )
                  }
                >
                  {predictMutation.isPending ? 'Analyzing...' : 'Analyze Fuel'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  variant="contained"
                  color="primary"
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </form>

        <Box sx={{ mt: 3 }}>
          <Alert severity="info" icon={<InfoIcon />}>
            <Typography variant="body2">
              <strong>Tip:</strong> For accurate predictions, ensure all OBD-II values are read from a warm engine at idle or cruising speed.
              Fuel sensor data can be entered manually or read from compatible hardware.
            </Typography>
          </Alert>
        </Box>
      </Paper>
    </Container>
  );
};

export default PredictionForm;
