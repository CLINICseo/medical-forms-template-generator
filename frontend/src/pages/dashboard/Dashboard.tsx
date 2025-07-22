import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Assignment as ValidationIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { documents, recentDocuments } = useSelector(
    (state: RootState) => state.documents
  );

  // Calculate stats
  const totalDocuments = Object.keys(documents).length;
  const completedDocuments = Object.values(documents).filter(
    (doc) => doc.status === 'completed'
  ).length;
  const inProgressDocuments = Object.values(documents).filter(
    (doc) => doc.status !== 'completed'
  ).length;

  const completionRate = totalDocuments > 0 ? (completedDocuments / totalDocuments) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'analyzing':
      case 'validating':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Cargando';
      case 'analyzing':
        return 'Analizando';
      case 'validating':
        return 'Validando';
      case 'completed':
        return 'Completado';
      case 'error':
        return 'Error';
      default:
        return status;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Bienvenido al generador de plantillas para formularios médicos
      </Typography>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Cargar Nuevo Formulario
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Carga un PDF para generar automáticamente la plantilla con IA
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/upload')}
              >
                Empezar Ahora
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <ValidationIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Validar Plantillas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Revisa y ajusta las plantillas generadas automáticamente
              </Typography>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/validation')}
                disabled={totalDocuments === 0}
              >
                Ver Pendientes
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Statistics */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Estadísticas del Proyecto
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary.main">
                    {totalDocuments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Documentos
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="success.main">
                    {completedDocuments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completados
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="warning.main">
                    {inProgressDocuments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    En Proceso
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="info.main">
                    {Math.round(completionRate)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tasa de Éxito
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {totalDocuments > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Progreso General: {Math.round(completionRate)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={completionRate}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Documents */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Documentos Recientes
            </Typography>
            
            {recentDocuments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No hay documentos aún
                </Typography>
                <Button
                  variant="text"
                  startIcon={<UploadIcon />}
                  onClick={() => navigate('/upload')}
                  sx={{ mt: 2 }}
                >
                  Cargar Primer Documento
                </Button>
              </Box>
            ) : (
              <List>
                {recentDocuments.slice(0, 5).map((docId, index) => {
                  const doc = documents[docId];
                  if (!doc) return null;
                  
                  return (
                    <React.Fragment key={docId}>
                      <ListItem
                        button
                        onClick={() => navigate(`/validate/${docId}`)}
                        sx={{ px: 0 }}
                      >
                        <ListItemText
                          primary={doc.fileName}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip
                                size="small"
                                label={getStatusText(doc.status)}
                                color={getStatusColor(doc.status) as any}
                                variant="outlined"
                              />
                              <Typography variant="caption" color="text.secondary">
                                {doc.insurerName}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < Math.min(recentDocuments.length, 5) - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Tips Section */}
      {totalDocuments === 0 && (
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <Typography variant="h6" gutterBottom>
            💡 Consejos para Empezar
          </Typography>
          <Typography variant="body2">
            1. Carga un formulario PDF de cualquier aseguradora mexicana<br />
            2. Nuestro sistema de IA detectará automáticamente los campos<br />
            3. Revisa y ajusta los campos detectados según sea necesario<br />
            4. ¡Listo! Tu plantilla estará disponible para usar
          </Typography>
        </Paper>
      )}
    </Box>
  );
};