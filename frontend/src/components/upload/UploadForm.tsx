import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
  Chip,
  Alert,
} from '@mui/material';
import { FileUpload } from './FileUpload';
import { uploadService } from '../../services/api/upload.service';

interface UploadFormData {
  file: File | null;
  documentType: string;
  insurerName: string;
  description?: string;
}

const documentTypes = [
  { value: 'claim_form', label: 'Formulario de Reclamación' },
  { value: 'authorization', label: 'Autorización Médica' },
  { value: 'reimbursement', label: 'Reembolso' },
  { value: 'prescription', label: 'Receta Médica' },
  { value: 'medical_report', label: 'Informe Médico' },
  { value: 'other', label: 'Otro' },
];

const insurers = [
  'MAPFRE',
  'AXA',
  'INBURSA',
  'GNP Seguros',
  'Seguros Monterrey',
  'Allianz',
  'MetLife',
  'Zurich',
  'BBVA Seguros',
  'Banorte Seguros',
];

export const UploadForm: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<UploadFormData>({
    file: null,
    documentType: '',
    insurerName: '',
    description: '',
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = async (file: File) => {
    setFormData((prev) => ({ ...prev, file }));
    setActiveStep(1);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    if (!formData.file || !formData.documentType || !formData.insurerName) {
      setError('Please complete all required fields');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await uploadService.uploadDocument({
        file: formData.file,
        documentType: formData.documentType,
        insurerName: formData.insurerName,
        description: formData.description,
      });

      setSuccess(true);
      setActiveStep(3);
      
      // Redirect to validation after 2 seconds
      setTimeout(() => {
        window.location.href = `/validate/${result.documentId}`;
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const steps = [
    {
      label: 'Cargar PDF',
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Selecciona el formulario médico que deseas procesar
          </Typography>
          <FileUpload onFileUpload={handleFileUpload} />
          {formData.file && (
            <Box sx={{ mt: 2 }}>
              <Chip
                label={formData.file.name}
                color="primary"
                variant="outlined"
              />
            </Box>
          )}
        </Box>
      ),
    },
    {
      label: 'Información del Documento',
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Proporciona información sobre el documento
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Tipo de Documento"
                value={formData.documentType}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, documentType: e.target.value }))
                }
                required
              >
                {documentTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Aseguradora"
                value={formData.insurerName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, insurerName: e.target.value }))
                }
                required
              >
                {insurers.map((insurer) => (
                  <MenuItem key={insurer} value={insurer}>
                    {insurer}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción (opcional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </Grid>
          </Grid>
        </Box>
      ),
    },
    {
      label: 'Confirmar y Procesar',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom>
            Resumen
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Archivo:
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formData.file?.name}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Tipo de Documento:
            </Typography>
            <Typography variant="body1" gutterBottom>
              {documentTypes.find((t) => t.value === formData.documentType)?.label}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Aseguradora:
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formData.insurerName}
            </Typography>

            {formData.description && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Descripción:
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formData.description}
                </Typography>
              </>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={uploading}
            fullWidth
          >
            {uploading ? 'Procesando...' : 'Procesar Documento'}
          </Button>
        </Box>
      ),
    },
  ];

  if (success) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="success" sx={{ mb: 3 }}>
          ¡Documento cargado exitosamente!
        </Alert>
        <Typography variant="h6" gutterBottom>
          Procesando documento...
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Serás redirigido al análisis en unos momentos
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Cargar Formulario Médico
      </Typography>
      
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>{step.label}</StepLabel>
            <StepContent>
              {step.content}
              <Box sx={{ mt: 3 }}>
                <Button
                  disabled={index === 0}
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Atrás
                </Button>
                {index < steps.length - 1 && (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={
                      (index === 0 && !formData.file) ||
                      (index === 1 && (!formData.documentType || !formData.insurerName))
                    }
                  >
                    Siguiente
                  </Button>
                )}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};