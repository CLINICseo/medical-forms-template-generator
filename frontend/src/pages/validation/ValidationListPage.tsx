import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  FilterList,
  Assignment,
  CheckCircle,
  Error,
  Warning,
  Visibility,
  Refresh,
  Analytics,
} from '@mui/icons-material';

interface DocumentSummary {
  documentId: string;
  fileName: string;
  status: 'analyzed' | 'validated' | 'approved' | 'rejected' | 'pending';
  confidence: number;
  fieldCount: number;
  validatedAt?: string;
  analyzedAt: string;
  validationScore?: number;
  formType: string;
  insurer: string;
}

export const ValidationListPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, searchTerm, statusFilter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular carga de documentos - en producción vendría de una API
      const mockDocuments: DocumentSummary[] = [
        {
          documentId: 'doc-001',
          fileName: 'formulario_mapfre_reembolso.pdf',
          status: 'validated',
          confidence: 0.92,
          fieldCount: 15,
          validatedAt: '2025-07-23T20:30:00.000Z',
          analyzedAt: '2025-07-23T20:25:00.000Z',
          validationScore: 87,
          formType: 'reembolso-gastos-medicos',
          insurer: 'MAPFRE'
        },
        {
          documentId: 'doc-002',
          fileName: 'solicitud_axa_vida.pdf',
          status: 'approved',
          confidence: 0.88,
          fieldCount: 23,
          validatedAt: '2025-07-23T19:45:00.000Z',
          analyzedAt: '2025-07-23T19:40:00.000Z',
          validationScore: 94,
          formType: 'solicitud-seguro-vida',
          insurer: 'AXA'
        },
        {
          documentId: 'doc-003',
          fileName: 'reporte_gnp_siniestro.pdf',
          status: 'pending',
          confidence: 0.76,
          fieldCount: 18,
          analyzedAt: '2025-07-23T21:10:00.000Z',
          formType: 'reporte-siniestro',
          insurer: 'GNP'
        },
        {
          documentId: 'doc-004',
          fileName: 'formulario_inbursa_gastos.pdf',
          status: 'rejected',
          confidence: 0.65,
          fieldCount: 12,
          validatedAt: '2025-07-23T18:20:00.000Z',
          analyzedAt: '2025-07-23T18:15:00.000Z',
          validationScore: 45,
          formType: 'reembolso-gastos-medicos',
          insurer: 'INBURSA'
        },
        {
          documentId: 'doc-005',
          fileName: 'poliza_monterrey_dental.pdf',
          status: 'analyzed',
          confidence: 0.84,
          fieldCount: 20,
          analyzedAt: '2025-07-23T22:00:00.000Z',
          formType: 'poliza-dental',
          insurer: 'Monterrey'
        }
      ];

      setDocuments(mockDocuments);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Error al cargar los documentos');
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.insurer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.formType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    setFilteredDocuments(filtered);
  };

  const getStatusChip = (status: DocumentSummary['status']) => {
    const configs = {
      analyzed: { label: 'Analizado', color: 'info' as const, icon: <Analytics /> },
      validated: { label: 'Validado', color: 'warning' as const, icon: <Warning /> },
      approved: { label: 'Aprobado', color: 'success' as const, icon: <CheckCircle /> },
      rejected: { label: 'Rechazado', color: 'error' as const, icon: <Error /> },
      pending: { label: 'Pendiente', color: 'default' as const, icon: <Assignment /> },
    };

    const config = configs[status];
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        variant="outlined"
      />
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'error';
  };

  const handleViewDocument = (documentId: string) => {
    navigate(`/validation/${documentId}`);
  };

  const getValidationStats = () => {
    const total = documents.length;
    const validated = documents.filter(d => ['validated', 'approved', 'rejected'].includes(d.status)).length;
    const approved = documents.filter(d => d.status === 'approved').length;
    const pending = documents.filter(d => d.status === 'pending').length;
    const avgConfidence = total > 0 ? documents.reduce((sum, d) => sum + d.confidence, 0) / total : 0;

    return { total, validated, approved, pending, avgConfidence };
  };

  const stats = getValidationStats();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando documentos...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Assignment color="primary" />
        Centro de Validación
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Documentos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="success.main">
                {stats.approved}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aprobados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="warning.main">
                {stats.pending}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color={getConfidenceColor(stats.avgConfidence)}>
                {Math.round(stats.avgConfidence * 100)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Confianza Promedio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre, aseguradora o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Estado"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="pending">Pendientes</MenuItem>
                <MenuItem value="analyzed">Analizados</MenuItem>
                <MenuItem value="validated">Validados</MenuItem>
                <MenuItem value="approved">Aprobados</MenuItem>
                <MenuItem value="rejected">Rechazados</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
            >
              Vista: {viewMode === 'cards' ? 'Tarjetas' : 'Tabla'}
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadDocuments}
              fullWidth
            >
              Actualizar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Documents Display */}
      {viewMode === 'cards' ? (
        <Grid container spacing={3}>
          {filteredDocuments.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc.documentId}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>
                      {doc.fileName}
                    </Typography>
                    {getStatusChip(doc.status)}
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Aseguradora:</strong> {doc.insurer}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Tipo:</strong> {doc.formType.replace(/-/g, ' ').toUpperCase()}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Campos:</strong> {doc.fieldCount}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        Confianza
                      </Typography>
                      <Typography variant="body2">
                        {Math.round(doc.confidence * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={doc.confidence * 100}
                      color={getConfidenceColor(doc.confidence)}
                    />
                  </Box>

                  {doc.validationScore && (
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          Validación
                        </Typography>
                        <Typography variant="body2">
                          {doc.validationScore}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={doc.validationScore}
                        color={doc.validationScore > 80 ? 'success' : doc.validationScore > 60 ? 'warning' : 'error'}
                      />
                    </Box>
                  )}

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    {doc.validatedAt ? 
                      `Validado: ${new Date(doc.validatedAt).toLocaleString('es-MX')}` :
                      `Analizado: ${new Date(doc.analyzedAt).toLocaleString('es-MX')}`
                    }
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => handleViewDocument(doc.documentId)}
                    variant="contained"
                    fullWidth
                  >
                    Ver Validación
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Archivo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Aseguradora</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="center">Campos</TableCell>
                <TableCell align="center">Confianza</TableCell>
                <TableCell align="center">Validación</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.documentId} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {doc.fileName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(doc.status)}
                  </TableCell>
                  <TableCell>{doc.insurer}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {doc.formType.replace(/-/g, ' ').toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{doc.fieldCount}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${Math.round(doc.confidence * 100)}%`}
                      color={getConfidenceColor(doc.confidence)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {doc.validationScore ? (
                      <Chip
                        label={`${doc.validationScore}%`}
                        color={doc.validationScore > 80 ? 'success' : doc.validationScore > 60 ? 'warning' : 'error'}
                        size="small"
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {doc.validatedAt ? 
                        new Date(doc.validatedAt).toLocaleDateString('es-MX') :
                        new Date(doc.analyzedAt).toLocaleDateString('es-MX')
                      }
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver validación">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDocument(doc.documentId)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {filteredDocuments.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron documentos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || statusFilter !== 'all' ? 
              'Intenta ajustar los filtros de búsqueda' : 
              'No hay documentos disponibles para validar'
            }
          </Typography>
        </Box>
      )}
    </Box>
  );
};