import React from 'react';
import {
  Container,
  Paper,
  Grid,
  Typography,
  Box,
  LinearProgress,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  LocalGasStation as FuelIcon,
  WaterDrop as WaterIcon,
  Build as BuildIcon,
  TrendingDown as TrendIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { PredictionResult } from '../types';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

interface Props {
  result: PredictionResult;
  onReset: () => void;
}

const ResultDashboard: React.FC<Props> = ({ result, onReset }) => {
  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
      case 'normal':
        return '#4caf50';
      case 'medium':
      case 'elevated':
        return '#ff9800';
      case 'high':
      case 'critical':
        return '#f44336';
      default:
        return '#2196f3';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
      case 'normal':
        return <CheckIcon sx={{ color: '#4caf50' }} />;
      case 'medium':
      case 'elevated':
        return <WarningIcon sx={{ color: '#ff9800' }} />;
      case 'high':
      case 'critical':
        return <ErrorIcon sx={{ color: '#f44336' }} />;
      default:
        return null;
    }
  };

  const radarData = [
    {
      subject: 'Fuel Quality',
      A: result.fuel_quality_score,
      fullMark: 100,
    },
    {
      subject: 'Engine Health',
      A: result.engine_health_score,
      fullMark: 100,
    },
    {
      subject: 'Mileage Impact',
      A: Math.max(0, 100 - result.expected_mileage_reduction),
      fullMark: 100,
    },
    {
      subject: 'Injector Risk',
      A: result.injector_deposit_risk === 'Low' ? 80 : result.injector_deposit_risk === 'Medium' ? 50 : 20,
      fullMark: 100,
    },
    {
      subject: 'Pump Status',
      A: result.fuel_pump_wear_status === 'Normal' ? 80 : result.fuel_pump_wear_status === 'Elevated' ? 50 : 20,
      fullMark: 100,
    },
  ];

  const barData = [
    {
      name: 'Injector Cleaner',
      km: result.recommended_injector_cleaner_km,
      color: '#ff9800',
    },
    {
      name: 'Fuel Filter',
      km: result.recommended_fuel_filter_km,
      color: '#2196f3',
    },
    {
      name: 'Component Life',
      km: result.predicted_component_life_km,
      color: '#4caf50',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">📊 Fuel Intelligence Report</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onReset}
          >
            New Analysis
          </Button>
        </Box>

        <Alert severity="success" sx={{ mb: 3 }}>
          Analysis complete! Here's your comprehensive fuel and engine health report.
        </Alert>

        {/* Score Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Fuel Quality Score
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <FuelIcon sx={{ mr: 1, color: getRiskColor(
                    result.fuel_quality_score > 80 ? 'Low' : 
                    result.fuel_quality_score > 60 ? 'Medium' : 'High'
                  ) }} />
                  <Typography variant="h4">
                    {Math.round(result.fuel_quality_score)}
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 1 }}>/100</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={result.fuel_quality_score}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  color={result.fuel_quality_score > 80 ? 'success' : 
                         result.fuel_quality_score > 60 ? 'warning' : 'error'}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Engine Health
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <SpeedIcon sx={{ mr: 1, color: getRiskColor(
                    result.engine_health_score > 80 ? 'Normal' : 
                    result.engine_health_score > 60 ? 'Elevated' : 'Critical'
                  ) }} />
                  <Typography variant="h4">
                    {Math.round(result.engine_health_score)}
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 1 }}>/100</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={result.engine_health_score}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  color={result.engine_health_score > 80 ? 'success' : 
                         result.engine_health_score > 60 ? 'warning' : 'error'}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Ethanol Content
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <WaterIcon sx={{ mr: 1, color: '#2196f3' }} />
                  <Typography variant="h4">
                    {result.estimated_ethanol.toFixed(1)}%
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Water: {result.water_contamination}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Mileage Impact
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendIcon sx={{ mr: 1, color: result.expected_mileage_reduction > 10 ? '#f44336' : '#ff9800' }} />
                  <Typography variant="h4">
                    -{result.expected_mileage_reduction.toFixed(1)}%
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Expected reduction in fuel economy
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: 300 }}>
              <Typography variant="subtitle1" gutterBottom align="center">
                Engine Health Radar
              </Typography>
              <ResponsiveContainer width="100%" height="85%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="Score"
                    dataKey="A"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: 300 }}>
              <Typography variant="subtitle1" gutterBottom align="center">
                Maintenance Recommendations (km)
              </Typography>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={barData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="km" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Risk Assessment */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Component Risk Assessment
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BuildIcon />
                    <Typography>Injector Deposit Risk</Typography>
                  </Box>
                  <Chip
                    label={result.injector_deposit_risk}
                    sx={{
                      bgcolor: getRiskColor(result.injector_deposit_risk),
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                    icon={getRiskIcon(result.injector_deposit_risk)}
                  />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FuelIcon />
                    <Typography>Fuel Pump Wear</Typography>
                  </Box>
                  <Chip
                    label={result.fuel_pump_wear_status}
                    sx={{
                      bgcolor: getRiskColor(result.fuel_pump_wear_status),
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                    icon={getRiskIcon(result.fuel_pump_wear_status)}
                  />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendIcon />
                    <Typography>Mileage Reduction</Typography>
                  </Box>
                  <Chip
                    label={`${result.expected_mileage_reduction.toFixed(1)}%`}
                    sx={{
                      bgcolor: result.expected_mileage_reduction > 10 ? '#f44336' : 
                               result.expected_mileage_reduction > 5 ? '#ff9800' : '#4caf50',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Actionable Recommendations
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Injector Cleaner
                  </Typography>
                  <Typography variant="h6">
                    {result.recommended_injector_cleaner_km.toLocaleString()} km
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (result.recommended_injector_cleaner_km / 15000) * 100)}
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    color={result.recommended_injector_cleaner_km < 5000 ? 'error' : 'warning'}
                  />
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Fuel Filter Replacement
                  </Typography>
                  <Typography variant="h6">
                    {result.recommended_fuel_filter_km.toLocaleString()} km
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (result.recommended_fuel_filter_km / 15000) * 100)}
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    color={result.recommended_fuel_filter_km < 5000 ? 'error' : 'warning'}
                  />
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Predicted Component Life
                  </Typography>
                  <Typography variant="h6">
                    {result.predicted_component_life_km.toLocaleString()} km
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (result.predicted_component_life_km / 20000) * 100)}
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    color="success"
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Water Contamination Alert */}
        {result.water_contamination !== 'Low' && (
          <Alert 
            severity={result.water_contamination === 'High' ? 'error' : 'warning'}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              <strong>Water Contamination Detected: {result.water_contamination}</strong>
              {result.water_contamination === 'High' && 
                ' - Immediate fuel system inspection recommended. Water can cause injector failure and fuel pump damage.'}
              {result.water_contamination === 'Medium' && 
                ' - Consider using a fuel water separator or switching to a higher quality fuel station.'}
            </Typography>
          </Alert>
        )}

        {/* Export Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="text"
            size="small"
            onClick={() => {
              const dataStr = JSON.stringify(result, null, 2);
              const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
              const exportFileDefaultName = `fuel_report_${new Date().toISOString().slice(0,10)}.json`;
              const linkElement = document.createElement('a');
              linkElement.setAttribute('href', dataUri);
              linkElement.setAttribute('download', exportFileDefaultName);
              linkElement.click();
            }}
          >
            Export Report (JSON)
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ResultDashboard;
