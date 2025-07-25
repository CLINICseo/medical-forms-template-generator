import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  FormControlLabel,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Settings,
  Security,
  Notifications,
  Language,
  Palette,
  Storage,
  Analytics,
  ExpandMore,
  Save,
  RestoreFromTrash,
  CloudSync,
  Speed,
  Visibility,
  VolumeUp,
  Brightness6,
  ConnectedTv,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const SettingsPage: React.FC = () => {
  const { settings, updateSetting, resetSettings, saveSettings } = useSettings();
  const [activeTab, setActiveTab] = useState(0);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSave = () => {
    try {
      saveSettings();
      setSavedMessage('Configuración guardada exitosamente');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSavedMessage('Error al guardar la configuración');
      setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  const handleReset = () => {
    resetSettings();
    setShowResetDialog(false);
    setSavedMessage('Configuración restablecida a valores por defecto');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings color="primary" />
        Configuración del Sistema
      </Typography>

      {savedMessage && (
        <Alert severity={savedMessage.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {savedMessage}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="settings tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="General" icon={<Settings />} />
          <Tab label="Validación" icon={<Analytics />} />
          <Tab label="Interfaz" icon={<Palette />} />
          <Tab label="Avanzado" icon={<Speed />} />
          <Tab label="API" icon={<CloudSync />} />
        </Tabs>

        {/* General Settings */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Language />
                    Idioma y Región
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Idioma</InputLabel>
                    <Select
                      value={settings.language}
                      onChange={(e) => updateSetting('language', e.target.value as any)}
                      label="Idioma"
                    >
                      <MenuItem value="es-MX">Español (México)</MenuItem>
                      <MenuItem value="es-ES">Español (España)</MenuItem>
                      <MenuItem value="en-US">English (US)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Tema</InputLabel>
                    <Select
                      value={settings.theme}
                      onChange={(e) => updateSetting('theme', e.target.value as any)}
                      label="Tema"
                    >
                      <MenuItem value="light">Claro</MenuItem>
                      <MenuItem value="dark">Oscuro</MenuItem>
                      <MenuItem value="auto">Automático</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Notifications />
                    Comportamiento
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Save />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Auto-guardado" 
                        secondary="Guardar cambios automáticamente"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.autoSave}
                          onChange={(e) => updateSetting('autoSave', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <ListItem>
                      <ListItemIcon>
                        <VolumeUp />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Notificaciones" 
                        secondary="Mostrar notificaciones del sistema"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.notifications}
                          onChange={(e) => updateSetting('notifications', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Validation Settings */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Analytics />
                    Parámetros de Validación
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>
                      Umbral de Confianza: {settings.confidenceThreshold}%
                    </Typography>
                    <Slider
                      value={settings.confidenceThreshold}
                      onChange={(e, value) => updateSetting('confidenceThreshold', Array.isArray(value) ? value[0] : value)}
                      valueLabelDisplay="auto"
                      step={5}
                      marks
                      min={50}
                      max={100}
                      valueLabelFormat={(value) => `${value}%`}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Confianza mínima requerida para aprobar campos automáticamente
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>
                      Timeout de Validación: {settings.validationTimeout}s
                    </Typography>
                    <Slider
                      value={settings.validationTimeout}
                      onChange={(e, value) => updateSetting('validationTimeout', Array.isArray(value) ? value[0] : value)}
                      valueLabelDisplay="auto"
                      step={5}
                      marks
                      min={10}
                      max={120}
                      valueLabelFormat={(value) => `${value}s`}
                    />
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoValidation}
                        onChange={(e) => updateSetting('autoValidation', e.target.checked)}
                      />
                    }
                    label="Validación Automática"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.strictMode}
                        onChange={(e) => updateSetting('strictMode', e.target.checked)}
                      />
                    }
                    label="Modo Estricto"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configuración por Tipo de Formulario
                  </Typography>
                  
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>Reembolso Gastos Médicos</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <FormControl component="fieldset">
                        <Typography variant="subtitle2" gutterBottom>
                          Campos Requeridos
                        </Typography>
                        <FormControlLabel control={<Switch defaultChecked />} label="RFC" />
                        <FormControlLabel control={<Switch defaultChecked />} label="CURP" />
                        <FormControlLabel control={<Switch />} label="NSS" />
                        <FormControlLabel control={<Switch defaultChecked />} label="Fecha de Nacimiento" />
                      </FormControl>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>Pólizas de Vida</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <FormControl component="fieldset">
                        <Typography variant="subtitle2" gutterBottom>
                          Validaciones Específicas
                        </Typography>
                        <FormControlLabel control={<Switch defaultChecked />} label="Verificar Beneficiarios" />
                        <FormControlLabel control={<Switch />} label="Validar Suma Asegurada" />
                        <FormControlLabel control={<Switch defaultChecked />} label="Comprobar Edad" />
                      </FormControl>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Interface Settings */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Visibility />
                    Visualización de PDF
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Calidad de PDF</InputLabel>
                    <Select
                      value={settings.pdfQuality}
                      onChange={(e) => updateSetting('pdfQuality', e.target.value as 'low' | 'medium' | 'high')}
                      label="Calidad de PDF"
                    >
                      <MenuItem value="low">Baja (Rápida)</MenuItem>
                      <MenuItem value="medium">Media</MenuItem>
                      <MenuItem value="high">Alta (Lenta)</MenuItem>
                    </Select>
                  </FormControl>

                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Resaltar Campos" 
                        secondary="Mostrar recuadros alrededor de campos detectados"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.fieldHighlight}
                          onChange={(e) => updateSetting('fieldHighlight', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <ListItem>
                      <ListItemText 
                        primary="Mostrar Coordenadas" 
                        secondary="Mostrar coordenadas de campos (modo debug)"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.showCoordinates}
                          onChange={(e) => updateSetting('showCoordinates', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Brightness6 />
                    Experiencia de Usuario
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Animaciones" 
                        secondary="Habilitar transiciones y animaciones"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.animationsEnabled}
                          onChange={(e) => updateSetting('animationsEnabled', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>

                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Información del Sistema
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Chip label="Versión: 1.0.0" variant="outlined" size="small" />
                    <Chip label="Build: 2025.07.23" variant="outlined" size="small" />
                    <Chip label="Azure Document Intelligence: Activo" color="success" variant="outlined" size="small" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Advanced Settings */}
        <TabPanel value={activeTab} index={3}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            ⚠️ Configuración avanzada. Modificar estos valores puede afectar el rendimiento del sistema.
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Speed />
                    Rendimiento
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>
                      Análisis Concurrentes: {settings.maxConcurrentAnalysis}
                    </Typography>
                    <Slider
                      value={settings.maxConcurrentAnalysis}
                      onChange={(e, value) => updateSetting('maxConcurrentAnalysis', Array.isArray(value) ? value[0] : value)}
                      valueLabelDisplay="auto"
                      step={1}
                      marks
                      min={1}
                      max={10}
                    />
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.cachingEnabled}
                        onChange={(e) => updateSetting('cachingEnabled', e.target.checked)}
                      />
                    }
                    label="Caché Habilitado"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.debugMode}
                        onChange={(e) => updateSetting('debugMode', e.target.checked)}
                      />
                    }
                    label="Modo Debug"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Logs y Depuración
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Nivel de Log</InputLabel>
                    <Select
                      value={settings.logLevel}
                      onChange={(e) => updateSetting('logLevel', e.target.value as 'error' | 'warn' | 'info' | 'debug')}
                      label="Nivel de Log"
                    >
                      <MenuItem value="error">Error</MenuItem>
                      <MenuItem value="warn">Warning</MenuItem>
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="debug">Debug</MenuItem>
                    </Select>
                  </FormControl>

                  <Typography variant="body2" color="text.secondary">
                    Los logs detallados pueden impactar el rendimiento pero ayudan en la resolución de problemas.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* API Settings */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CloudSync />
                    Configuración de API
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>
                      Timeout de API: {settings.apiTimeout}s
                    </Typography>
                    <Slider
                      value={settings.apiTimeout}
                      onChange={(e, value) => updateSetting('apiTimeout', Array.isArray(value) ? value[0] : value)}
                      valueLabelDisplay="auto"
                      step={10}
                      marks
                      min={30}
                      max={300}
                      valueLabelFormat={(value) => `${value}s`}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>
                      Reintentos: {settings.retryAttempts}
                    </Typography>
                    <Slider
                      value={settings.retryAttempts}
                      onChange={(e, value) => updateSetting('retryAttempts', Array.isArray(value) ? value[0] : value)}
                      valueLabelDisplay="auto"
                      step={1}
                      marks
                      min={0}
                      max={10}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>
                      Tamaño de Lote: {settings.batchSize}
                    </Typography>
                    <Slider
                      value={settings.batchSize}
                      onChange={(e, value) => updateSetting('batchSize', Array.isArray(value) ? value[0] : value)}
                      valueLabelDisplay="auto"
                      step={5}
                      marks
                      min={5}
                      max={50}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Estado de Servicios
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <ConnectedTv color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Document Intelligence" 
                        secondary="Conectado y funcionando"
                      />
                      <Chip label="Activo" color="success" size="small" />
                    </ListItem>

                    <ListItem>
                      <ListItemIcon>
                        <Storage color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Azure Blob Storage" 
                        secondary="Configuración pendiente"
                      />
                      <Chip label="Configurar" color="warning" size="small" />
                    </ListItem>

                    <ListItem>
                      <ListItemIcon>
                        <Security color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Cosmos DB" 
                        secondary="Base de datos conectada"
                      />
                      <Chip label="Activo" color="success" size="small" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Action Buttons */}
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Grid container spacing={2} justifyContent="flex-end">
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<RestoreFromTrash />}
                onClick={() => setShowResetDialog(true)}
              >
                Restablecer
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
              >
                Guardar Configuración
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onClose={() => setShowResetDialog(false)}>
        <DialogTitle>Confirmar Restablecimiento</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas restablecer toda la configuración a los valores por defecto? 
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleReset} color="error" variant="contained">
            Restablecer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};