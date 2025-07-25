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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Home, NavigateNext, Analytics } from '@mui/icons-material';
import { PDFViewer, FieldDetection } from '../../components/pdf/PDFViewer';
import { FieldValidationPanel } from '../../components/validation/FieldValidationPanel';
import { CapacityAnalysisViewer } from '../../components/debug/CapacityAnalysisViewer';
import { AdvancedValidationPanel } from '../../components/validation/AdvancedValidationPanel';
import { ValidationDebugger } from '../../components/debug/ValidationDebugger';
import { analysisService } from '../../services/api/analysis.service';
import { validationService, ValidationResult } from '../../services/api/validation.service';
import { exportService } from '../../services/api/export.service';
import { finalizeService } from '../../services/api/finalize.service';

interface DocumentData {
  documentId: string;
  fileName: string;
  documentType: string;
  insurerName: string;
  detectedFields: FieldDetection[];
  status: string;
  confidence: number;
  // 🚀 NUEVO: Métricas revolucionarias
  modelUsed?: 'prebuilt-layout' | 'prebuilt-document' | 'fallback';
  revolutionMetrics?: {
    tablesDetected: number;
    keyValuePairsDetected: number;
    selectionMarksDetected: number;
    paragraphsDetected: number;
    improvementFactor: number;
  };
  processingTime?: number;
}

export const ValidationPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | undefined>();
  const [showCapacityAnalysis, setShowCapacityAnalysis] = useState(false);
  const [showAdvancedValidation, setShowAdvancedValidation] = useState(false);
  const [showValidationDebug, setShowValidationDebug] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    if (documentId) {
      loadDocumentData(documentId);
    }
  }, [documentId]);

  const handleFieldDelete = (fieldId: string) => {
    setDocumentData(currentData => {
      if (!currentData) return currentData;

      const updatedFields = currentData.detectedFields.filter((field) =>
        field.fieldId !== fieldId
      );

      return {
        ...currentData,
        detectedFields: updatedFields,
      };
    });

    // Clear selection if the deleted field was selected
    setSelectedFieldId(currentSelectedId => 
      currentSelectedId === fieldId ? undefined : currentSelectedId
    );
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete key to remove selected field
      if (event.key === 'Delete' && selectedFieldId && documentData) {
        const selectedField = documentData.detectedFields.find(f => f.fieldId === selectedFieldId);
        if (selectedField) {
          event.preventDefault();
          handleFieldDelete(selectedFieldId);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedFieldId, documentData]);

  const loadDocumentData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      
      // Get analysis data from backend
      const analysisResult = await analysisService.analyzeDocument(id);
      
      
      // Get validation data from backend
      const validationResult = await validationService.validateDocument(id);
      
      
      // Create document data from API responses
      const documentData: DocumentData = {
        documentId: id,
        fileName: `document_${id}.pdf`,
        documentType: analysisResult.formType || 'medical-form',
        insurerName: analysisResult.insurerDetected || 'Unknown',
        detectedFields: analysisResult.detectedFields,
        status: validationResult.status || analysisResult.status,
        confidence: analysisResult.confidence,
        // 🚀 NUEVO: Incluir métricas revolucionarias del análisis
        modelUsed: analysisResult.modelUsed,
        revolutionMetrics: analysisResult.revolutionMetrics,
        processingTime: analysisResult.processingTime,
      };

      setDocumentData(documentData);
      setValidationResult(validationResult);
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


  const handleExport = async (format: 'json' | 'xml' | 'pdf-template' = 'json') => {
    if (!documentData) return;

    try {
      setIsExporting(true);
      
      await exportService.exportAndDownload({
        documentId: documentData.documentId,
        format,
        fields: documentData.detectedFields,
        includeCoordinates: true,
        includeMedicalMetadata: true
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFinalize = async (action: 'approve' | 'reject' | 'review', notes?: string) => {
    if (!documentData) return;

    try {
      setIsFinalizing(true);

      switch (action) {
        case 'approve':
          await finalizeService.approveTemplate(
            documentData.documentId, 
            documentData.detectedFields, 
            notes
          );
          break;
        case 'reject':
          await finalizeService.rejectTemplate(
            documentData.documentId, 
            documentData.detectedFields, 
            notes || 'Template rejected'
          );
          break;
        case 'review':
          await finalizeService.markForReview(
            documentData.documentId, 
            documentData.detectedFields, 
            notes || 'Needs additional review'
          );
          break;
      }

      // Navigate back to dashboard with success message
      navigate('/dashboard', { 
        state: { 
          message: `Template ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'marked for review'} successfully`,
          type: 'success'
        }
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Finalization failed');
    } finally {
      setIsFinalizing(false);
    }
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
            {process.env.NODE_ENV === 'development' && (
              <>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<Analytics />}
                  onClick={() => setShowCapacityAnalysis(true)}
                >
                  Análisis Capacidad
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  color="warning"
                  onClick={() => setShowValidationDebug(true)}
                >
                  Debug Validación
                </Button>
              </>
            )}
            <Button 
              variant="outlined" 
              size="small"
              color="info"
              onClick={() => setShowAdvancedValidation(true)}
            >
              Validación Avanzada
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => handleExport('json')}
              disabled={isExporting}
            >
              {isExporting ? 'Exportando...' : 'Exportar'}
            </Button>
            <Button 
              variant="contained" 
              color="success" 
              size="small"
              onClick={() => handleFinalize('approve')}
              disabled={isFinalizing}
            >
              {isFinalizing ? 'Finalizando...' : 'Finalizar Validación'}
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
              {selectedFieldId && (
                <Box component="span" sx={{ ml: 2, px: 1, py: 0.25, backgroundColor: 'action.hover', borderRadius: 0.5, fontSize: '0.75rem' }}>
                  Presiona DELETE para eliminar el campo seleccionado
                </Box>
              )}
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
              documentId={documentData.documentId}
              detectedFields={documentData.detectedFields}
              onFieldSelect={handleFieldSelect}
              selectedFieldId={selectedFieldId}
              // 🚀 NUEVO: Props revolucionarias
              modelUsed={documentData.modelUsed}
              revolutionMetrics={documentData.revolutionMetrics}
              processingTime={documentData.processingTime}
              confidence={documentData.confidence}
            />
          </Grid>
          
          {/* Validation Panel */}
          <Grid item xs={12} md={4} sx={{ height: '100%', borderLeft: 1, borderColor: 'divider' }}>
            <FieldValidationPanel
              fields={documentData.detectedFields}
              onFieldSelect={handleFieldSelect}
              onFieldUpdate={handleFieldUpdate}
              onFieldDelete={handleFieldDelete}
              selectedFieldId={selectedFieldId}
              onApprove={() => handleFinalize('approve')}
              onReject={() => handleFinalize('reject')}
              onMarkForReview={() => handleFinalize('review')}
              isProcessing={isFinalizing}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Capacity Analysis Dialog */}
      <Dialog
        open={showCapacityAnalysis}
        onClose={() => setShowCapacityAnalysis(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Análisis Avanzado de Capacidad de Caracteres
        </DialogTitle>
        <DialogContent>
          <CapacityAnalysisViewer fields={documentData.detectedFields} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCapacityAnalysis(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Advanced Validation Dialog */}
      <Dialog
        open={showAdvancedValidation}
        onClose={() => setShowAdvancedValidation(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { minHeight: '90vh' }
        }}
      >
        <DialogTitle>
          Análisis de Validación Avanzado - {documentData.fileName}
        </DialogTitle>
        <DialogContent>
          {validationResult && validationResult.detailedResults ? (
            <AdvancedValidationPanel
              validationResults={validationResult.detailedResults}
              documentId={documentData.documentId}
              isValid={validationResult.isValid}
              completionPercentage={validationResult.completionPercentage}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Datos de validación avanzada no disponibles. 
                {!validationResult ? ' Cargando resultados de validación...' : ' No se encontraron resultados detallados.'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAdvancedValidation(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Validation Debug Dialog */}
      <Dialog
        open={showValidationDebug}
        onClose={() => setShowValidationDebug(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          🔍 Debug de Validación - {documentData.fileName}
        </DialogTitle>
        <DialogContent>
          <ValidationDebugger documentId={documentData.documentId} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowValidationDebug(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};