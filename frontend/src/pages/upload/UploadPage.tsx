import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Home as HomeIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { UploadForm } from '../../components/upload/UploadForm';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/dashboard')}
          sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <UploadIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Cargar PDF
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom>
        Cargar Formulario Médico
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Selecciona un formulario PDF para generar automáticamente su plantilla digital
      </Typography>

      {/* Upload Form */}
      <Paper sx={{ p: 0, overflow: 'hidden' }}>
        <UploadForm />
      </Paper>

      {/* Help Information */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          📋 Formularios Soportados
        </Typography>
        <Typography variant="body2" paragraph>
          Puedes cargar formularios de las siguientes aseguradoras:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {[
            'MAPFRE', 'AXA', 'INBURSA', 'GNP Seguros', 'Seguros Monterrey',
            'Allianz', 'MetLife', 'Zurich', 'BBVA Seguros', 'Banorte Seguros'
          ].map((insurer) => (
            <Typography
              key={insurer}
              variant="body2"
              sx={{
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem'
              }}
            >
              {insurer}
            </Typography>
          ))}
        </Box>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          ⚡ Proceso Automático
        </Typography>
        <Typography variant="body2">
          1. <strong>Carga:</strong> Arrastra o selecciona tu archivo PDF<br />
          2. <strong>Análisis:</strong> Nuestro sistema analiza automáticamente el documento<br />
          3. <strong>Detección:</strong> Identificamos campos como RFC, CURP, NSS y más<br />
          4. <strong>Validación:</strong> Revisa y ajusta los campos detectados<br />
          5. <strong>Listo:</strong> Tu plantilla estará disponible para usar
        </Typography>
      </Paper>
    </Box>
  );
};