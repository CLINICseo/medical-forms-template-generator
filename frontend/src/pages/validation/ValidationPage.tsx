import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Button,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { Home, NavigateNext } from '@mui/icons-material';
import { PDFViewer, FieldDetection } from '../../components/pdf/PDFViewer';
import { FieldValidationPanel } from '../../components/validation/FieldValidationPanel';
import { analysisService } from '../../services/api/analysis.service';
import { validationService } from '../../services/api/validation.service';

interface DocumentData {
  documentId: string;
  fileName: string;
  documentType: string;
  insurerName: string;
  blobUrl: string;
  detectedFields: FieldDetection[];
  status: string;
  confidence: number;
}

export const ValidationPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | undefined>();

  useEffect(() => {
    if (documentId) {
      loadDocumentData(documentId);
    }
  }, [documentId]);

  const loadDocumentData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading analysis for document:', id);
      
      // Get analysis data from backend
      const analysisResult = await analysisService.analyzeDocument(id);
      
      console.log('Analysis result:', analysisResult);
      
      // Get validation data from backend
      const validationResult = await validationService.validateDocument(id);
      
      console.log('Validation result:', validationResult);
      
      // Create document data from API responses
      const documentData: DocumentData = {
        documentId: id,
        fileName: `document_${id}.pdf`,
        documentType: analysisResult.formType || 'medical-form',
        insurerName: analysisResult.insurerDetected || 'Unknown',
        blobUrl: "data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVGl0bGUgKE1vY2sgUERGKQovQ3JlYXRvciAoTWVkaWNhbCBGb3JtcyBTeXN0ZW0pCi9Qcm9kdWNlciAoTW9jayBQREYpCi9DcmVhdGlvbkRhdGUgKEQ6MjAyNDAxMTUwMDAwMDApCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihNb2NrIE1lZGljYWwgRm9ybSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwMTUzIDAwMDAwIG4gCjAwMDAwMDAyMTAgMDAwMDAgbiAKMDAwMDAwMDMxNyAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDUKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQxMQolJUVPRg==", // Mock PDF for display
        detectedFields: analysisResult.detectedFields,
        status: validationResult.status || analysisResult.status,
        confidence: analysisResult.confidence,
      };

      setDocumentData(documentData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load document data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document data');
      setLoading(false);
    }
  };

  const handleFieldSelect = (field: FieldDetection) => {
    setSelectedFieldId(field.fieldId);
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<FieldDetection>) => {
    if (!documentData) return;

    const updatedFields = documentData.detectedFields.map((field) =>
      field.fieldId === fieldId ? { ...field, ...updates } : field
    );

    setDocumentData({
      ...documentData,
      detectedFields: updatedFields,
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !documentData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error || 'Document not found'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Breadcrumbs
              separator={<NavigateNext fontSize="small" />}
              aria-label="breadcrumb"
            >
              <Link
                color="inherit"
                component="button"
                onClick={() => navigate('/dashboard')}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <Home sx={{ mr: 0.5 }} fontSize="inherit" />
                Dashboard
              </Link>
              <Typography color="text.primary">Validación</Typography>
              <Typography color="text.primary">{documentData.fileName}</Typography>
            </Breadcrumbs>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small">
              Exportar
            </Button>
            <Button variant="contained" color="success" size="small">
              Finalizar Validación
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Document info */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6" component="div">
              {documentData.fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {documentData.insurerName} • {documentData.documentType} • {documentData.detectedFields.length} campos detectados
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="body2" color="text.secondary">
                Confianza general
              </Typography>
              <Typography variant="h6" color={documentData.confidence > 0.8 ? 'success.main' : documentData.confidence > 0.6 ? 'warning.main' : 'error.main'}>
                {Math.round(documentData.confidence * 100)}%
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* PDF Viewer */}
          <Grid item xs={12} md={8} sx={{ height: '100%' }}>
            <PDFViewer
              pdfUrl={documentData.blobUrl}
              detectedFields={documentData.detectedFields}
              onFieldSelect={handleFieldSelect}
              selectedFieldId={selectedFieldId}
            />
          </Grid>
          
          {/* Validation Panel */}
          <Grid item xs={12} md={4} sx={{ height: '100%', borderLeft: 1, borderColor: 'divider' }}>
            <FieldValidationPanel
              fields={documentData.detectedFields}
              onFieldSelect={handleFieldSelect}
              onFieldUpdate={handleFieldUpdate}
              selectedFieldId={selectedFieldId}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};