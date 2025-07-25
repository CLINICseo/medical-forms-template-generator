import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Avatar,
} from '@mui/material';
import {
  Help,
  ExpandMore,
  CloudUpload,
  Assignment,
  BugReport,
  Email,
  Phone,
  VideoLibrary,
  Search,
  QuestionAnswer,
  School,
  Support,
  Code,
  Download,
  Security,
  Speed,
  CheckCircle,
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
      id={`help-tabpanel-${index}`}
      aria-labelledby={`help-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export const HelpPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContactDialog, setShowContactDialog] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const faqData = [
    {
      category: 'Uso General',
      questions: [
        {
          question: '¿Cómo cargo un documento PDF para analizar?',
          answer: 'Ve a la sección "Cargar PDF" desde el menú lateral, arrastra tu archivo PDF al área de carga o haz clic en "Seleccionar archivo". El sistema admite archivos PDF de hasta 10MB.',
          tags: ['pdf', 'cargar', 'archivo']
        },
        {
          question: '¿Qué tipos de formularios médicos soporta el sistema?',
          answer: 'El sistema soporta formularios de las principales aseguradoras mexicanas: MAPFRE, AXA, GNP, INBURSA, Monterrey, MetLife, Plan Seguro, Atlas, y Banorte. Incluye formularios de reembolso, solicitudes de seguro, reportes de siniestro y pólizas.',
          tags: ['formularios', 'aseguradoras', 'tipos']
        },
        {
          question: '¿Cuánto tiempo toma el análisis de un documento?',
          answer: 'El análisis típicamente toma entre 15-60 segundos dependiendo del tamaño y complejidad del documento. Los formularios simples (Nivel 3) se procesan en ~15 segundos, mientras que los complejos (Nivel 1) pueden tomar hasta 2 minutos.',
          tags: ['tiempo', 'análisis', 'velocidad']
        }
      ]
    },
    {
      category: 'Validación',
      questions: [
        {
          question: '¿Qué significa el porcentaje de confianza?',
          answer: 'El porcentaje de confianza indica qué tan seguro está el sistema de que ha detectado correctamente un campo. 80%+ es alta confianza, 60-79% es media, y <60% es baja confianza.',
          tags: ['confianza', 'porcentaje', 'precisión']
        },
        {
          question: '¿Cómo funciona la validación avanzada?',
          answer: 'La validación avanzada aplica 15+ reglas específicas para formularios médicos mexicanos, incluyendo validación de RFC, CURP, NSS, códigos CIE-10, y consistencia entre campos relacionados.',
          tags: ['validación', 'reglas', 'méxico']
        },
        {
          question: '¿Puedo editar campos detectados incorrectamente?',
          answer: 'Sí, puedes editar cualquier campo en el panel de validación. Haz clic en el campo, selecciona "Editar Campo", modifica el tipo, nombre o valor, y guarda los cambios.',
          tags: ['editar', 'campos', 'corregir']
        }
      ]
    },
    {
      category: 'Problemas Técnicos',
      questions: [
        {
          question: '¿Qué hago si el análisis falla?',
          answer: 'Si el análisis falla, verifica que: 1) El PDF no esté protegido con contraseña, 2) El archivo no esté corrupto, 3) El documento contenga texto legible (no solo imágenes). Intenta con una versión escaneada de mayor calidad.',
          tags: ['error', 'falla', 'análisis']
        },
        {
          question: '¿Por qué algunos campos no se detectan?',
          answer: 'Los campos pueden no detectarse por: texto muy pequeño, mala calidad de escaneo, campos manuscritos ilegibles, o formularios con diseños muy personalizados. Puedes agregar campos manualmente.',
          tags: ['campos', 'detección', 'problemas']
        },
        {
          question: '¿El sistema funciona sin conexión a internet?',
          answer: 'No, el sistema requiere conexión a internet para acceder a Azure Document Intelligence y otras APIs de procesamiento. Los datos se procesan de forma segura en la nube de Microsoft.',
          tags: ['internet', 'conexión', 'offline']
        }
      ]
    }
  ];

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      !searchTerm || 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(category => category.questions.length > 0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Help color="primary" />
        Centro de Ayuda
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="help tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Guía Rápida" icon={<School />} />
          <Tab label="FAQ" icon={<QuestionAnswer />} />
          <Tab label="Tutoriales" icon={<VideoLibrary />} />
          <Tab label="API Docs" icon={<Code />} />
          <Tab label="Soporte" icon={<Support />} />
        </Tabs>

        {/* Quick Start Guide */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Guía de Inicio Rápido
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Bienvenido al Medical Forms Template Generator. Esta guía te ayudará a comenzar en menos de 5 minutos.
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>1</Avatar>
                      <Typography variant="h6">Cargar Documento</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Ve a "Cargar PDF" y selecciona un formulario médico de alguna aseguradora mexicana.
                    </Typography>
                    <Chip icon={<CloudUpload />} label="Cargar PDF" color="primary" variant="outlined" />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>2</Avatar>
                      <Typography variant="h6">Analizar & Validar</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      El sistema detectará automáticamente los campos y aplicará validaciones específicas.
                    </Typography>
                    <Chip icon={<Assignment />} label="Validación" color="secondary" variant="outlined" />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>3</Avatar>
                      <Typography variant="h6">Exportar & Usar</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Exporta los resultados en JSON, XML o como plantilla PDF para usar en otros sistemas.
                    </Typography>
                    <Chip icon={<Download />} label="Exportar" color="success" variant="outlined" />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
              Características Principales
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <List>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText 
                      primary="34 Tipos de Campos Médicos"
                      secondary="RFC, CURP, NSS, CIE-10, cédulas profesionales, etc."
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText 
                      primary="9+ Aseguradoras Soportadas"
                      secondary="MAPFRE, AXA, GNP, INBURSA y más"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText 
                      primary="Validación Avanzada"
                      secondary="15+ reglas específicas para México"
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} sm={6}>
                <List>
                  <ListItem>
                    <ListItemIcon><Speed color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Procesamiento Rápido"
                      secondary="15-60 segundos por documento"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Security color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Seguro y Confiable"
                      secondary="Azure Document Intelligence"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Download color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Múltiples Formatos"
                      secondary="JSON, XML, PDF-template"
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* FAQ */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Preguntas Frecuentes
            </Typography>

            <TextField
              fullWidth
              placeholder="Buscar en preguntas frecuentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            {filteredFAQ.map((category, categoryIndex) => (
              <Box key={categoryIndex} sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  {category.category}
                </Typography>
                
                {category.questions.map((faq, faqIndex) => (
                  <Accordion key={faqIndex}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1">
                        {faq.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        {faq.answer}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {faq.tags.map(tag => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            ))}

            {filteredFAQ.length === 0 && searchTerm && (
              <Alert severity="info">
                No se encontraron preguntas que coincidan con "{searchTerm}". 
                Intenta con otros términos o contacta a soporte.
              </Alert>
            )}
          </Box>
        </TabPanel>

        {/* Tutorials */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Tutoriales en Video
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Los tutoriales en video estarán disponibles próximamente. Mientras tanto, puedes consultar la guía rápida y las FAQ.
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VideoLibrary />
                      Tutorial Básico
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Aprende a cargar tu primer documento y navegar por la interfaz.
                    </Typography>
                    <Chip label="Próximamente" color="default" />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VideoLibrary />
                      Validación Avanzada
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Comprende cómo funciona el sistema de validación y cómo interpretarlo.
                    </Typography>
                    <Chip label="Próximamente" color="default" />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VideoLibrary />
                      Exportación y Uso
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Aprende a exportar resultados y integrarlos en otros sistemas.
                    </Typography>
                    <Chip label="Próximamente" color="default" />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VideoLibrary />
                      Solución de Problemas
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Resuelve los problemas más comunes y mejora la precisión.
                    </Typography>
                    <Chip label="Próximamente" color="default" />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* API Documentation */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Documentación de API
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Para desarrolladores que quieren integrar el sistema en sus aplicaciones.
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Endpoints Principales
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="POST /api/upload"
                          secondary="Cargar documento PDF"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="POST /api/analyze/{id}"
                          secondary="Analizar documento"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="GET /api/validate/{id}"
                          secondary="Validar campos detectados"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="POST /api/export/{id}"
                          secondary="Exportar resultados"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="POST /api/finalize/{id}"
                          secondary="Finalizar validación"
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Formatos de Respuesta
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Todas las respuestas siguen el formato estándar:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.100', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {`{
  "success": boolean,
  "data": object,
  "error"?: string,
  "message"?: string
}`}
                    </Paper>
                    
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Para más detalles técnicos, contacta al equipo de desarrollo.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Support */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Soporte Técnico
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Support />
                      Contacto Directo
                    </Typography>
                    
                    <List>
                      <ListItem>
                        <ListItemIcon><Email /></ListItemIcon>
                        <ListItemText 
                          primary="Email de Soporte"
                          secondary="soporte@clinicseo.com"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Phone /></ListItemIcon>
                        <ListItemText 
                          primary="Teléfono"
                          secondary="+52 (55) 1234-5678"
                        />
                      </ListItem>
                    </List>

                    <CardActions>
                      <Button 
                        variant="contained" 
                        startIcon={<Email />}
                        onClick={() => setShowContactDialog(true)}
                      >
                        Enviar Mensaje
                      </Button>
                    </CardActions>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BugReport />
                      Reportar Problema
                    </Typography>
                    
                    <Typography variant="body2" paragraph>
                      Si encuentras un bug o problema técnico, incluye la siguiente información:
                    </Typography>
                    
                    <List dense>
                      <ListItem>• Pasos para reproducir el problema</ListItem>
                      <ListItem>• Tipo de documento y aseguradora</ListItem>
                      <ListItem>• Mensaje de error (si aplica)</ListItem>
                      <ListItem>• Navegador y versión</ListItem>
                    </List>

                    <Alert severity="info" sx={{ mt: 2 }}>
                      Los reportes de bugs tienen prioridad alta y se atienden en 24-48 horas.
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Información del Sistema
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2">
                          <strong>Versión:</strong> 1.0.0
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2">
                          <strong>Build:</strong> 2025.07.23
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2">
                          <strong>Backend:</strong> Azure Functions
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2">
                          <strong>AI:</strong> Document Intelligence
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Contact Support Dialog */}
      <Dialog open={showContactDialog} onClose={() => setShowContactDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Contactar Soporte</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Asunto"
            margin="normal"
            placeholder="Describe brevemente tu consulta"
          />
          <TextField
            fullWidth
            label="Mensaje"
            margin="normal"
            multiline
            rows={4}
            placeholder="Describe detalladamente tu problema o consulta..."
          />
          <TextField
            fullWidth
            label="Email de Contacto"
            margin="normal"
            type="email"
            placeholder="tu@email.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowContactDialog(false)}>
            Cancelar
          </Button>
          <Button variant="contained" startIcon={<Email />}>
            Enviar Mensaje
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};