import React from 'react';
import { Container, Paper, Typography, Button, Box } from '@mui/material';

interface ResultDashboardProps {
  result: any;
  onReset: () => void;
}

const ResultDashboard: React.FC<ResultDashboardProps> = ({ result, onReset }) => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom color="primary">
          Analysis Results
        </Typography>
        <Box sx={{ my: 3, textAlign: 'left', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </Box>
        <Button variant="contained" onClick={onReset}>
          Analyze Another Sample
        </Button>
      </Paper>
    </Container>
  );
};

export default ResultDashboard;
