import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useSettings } from '../../contexts/SettingsContext';
import {
  Box,
  Paper,
  Typography,
  Tooltip,
  CircularProgress,
  Alert,
  ButtonGroup,
  Button,
  Chip,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  NavigateBefore,
  NavigateNext,
  FullscreenExit,
  Fullscreen,
} from '@mui/icons-material';

// Configure PDF.js worker asynchronously for better performance
const configureWorkerAsync = async () => {
  return new Promise<void>((resolve) => {
    // Try local worker first, then CDN fallbacks
    const workerSources = [
      '/pdf.worker.min.js',
      `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
    ];

    // Set worker source
    pdfjs.GlobalWorkerOptions.workerSrc = workerSources[0];
    console.log('PDF.js worker configured:', pdfjs.GlobalWorkerOptions.workerSrc);
    
    // Small delay to prevent blocking
    setTimeout(() => resolve(), 10);
  });
};

export interface FieldDetection {
  fieldId: string;
  displayName: string;
  value: string;
  confidence: number;
  boundingBox: number[];
  pageNumber: number;
  fieldType: string;
  // 🚀 NUEVO: Campos de la migración prebuilt-layout
  sourceType?: 'keyValuePair' | 'table' | 'checkbox' | 'paragraph';
  isRevolutionary?: boolean;
  capacity?: {
    maxCharacters: number;
    charactersPerLine: number;
    maxLines: number;
    fontSize: number;
    fontFamily: string;
    conflictsWith: string[];
    adjustmentFactor: number;
    confidence: number;
    debugInfo: {
      originalWidth: number;
      originalHeight: number;
      effectiveWidth: number;
      effectiveHeight: number;
      detectedFontSize: number;
      adjacentFields: any[];
      spatialConflicts: any[];
    };
  };
}

// 🚀 NUEVA: Interface para métricas revolucionarias
export interface RevolutionMetrics {
  tablesDetected: number;
  keyValuePairsDetected: number;
  selectionMarksDetected: number;
  paragraphsDetected: number;
  improvementFactor: number;
}

interface PDFViewerProps {
  documentId: string;
  detectedFields?: FieldDetection[];
  onFieldSelect?: (_field: FieldDetection) => void;
  selectedFieldId?: string;
  // 🚀 NUEVO: Props para mostrar mejoras revolucionarias
  modelUsed?: 'prebuilt-layout' | 'prebuilt-document' | 'fallback';
  revolutionMetrics?: RevolutionMetrics;
  processingTime?: number;
  confidence?: number;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  documentId,
  detectedFields = [],
  onFieldSelect,
  selectedFieldId,
  // 🚀 NUEVO: Props revolucionarias
  modelUsed = 'fallback',
  revolutionMetrics,
  processingTime,
  confidence,
}) => {
  const { settings } = useSettings();
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('single');
  const [loading, setLoading] = useState<boolean>(true);
  const [isWorkerReady, setIsWorkerReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [fallbackMode, setFallbackMode] = useState<boolean>(false);

  // Initialize worker and PDF URL asynchronously
  useEffect(() => {
    const initializePDFViewer = async () => {
      if (documentId) {
        // Configure worker asynchronously
        await configureWorkerAsync();
        setIsWorkerReady(true);
        
        // Construct the URL to the backend PDF endpoint
        const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:7075/api';
        const url = `${apiBaseUrl}/pdf/${documentId}`;
        
        console.log('Building PDF URL:', {
          documentId,
          apiBaseUrl,
          fullUrl: url,
          env: process.env.NODE_ENV
        });
        
        setPdfUrl(url);
      }
    };

    initializePDFViewer();
  }, [documentId]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully:', { numPages, documentId });
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    console.error('PDF URL:', pdfUrl);
    console.error('Document ID:', documentId);
    
    const errorMessage = error.message.includes('CORS') 
      ? 'PDF loading failed due to CORS policy. Please check backend configuration.'
      : error.message.includes('worker')
      ? 'PDF worker failed to load. Trying alternative worker source...'
      : error.message.includes('404')
      ? 'PDF document not found. Please check if the document exists.'
      : `Failed to load PDF: ${error.message}`;
    
    setError(errorMessage);
    setLoading(false);
    
    // Try to reload with CDN worker if local worker fails
    if (error.message.includes('worker')) {
      console.log('Local worker failed, trying CDN fallback...');
      setTimeout(() => {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
        console.log('Switched to CDN worker:', pdfjs.GlobalWorkerOptions.workerSrc);
        setLoading(true);
        setError(null);
      }, 1000);
    } else {
      // Enable fallback mode after 3 seconds if PDF loading fails
      setTimeout(() => {
        if (error && !fallbackMode) {
          console.log('Enabling fallback iframe mode...');
          setFallbackMode(true);
          setError(null);
          setLoading(false);
        }
      }, 3000);
    }
  };

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.1, 3.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  const goToPrevPage = useCallback(() => {
    if (viewMode === 'single') {
      setCurrentPage((prev) => {
        const newPage = Math.max(prev - 1, 1);
        console.log(`Navigating to page ${newPage} (previous)`);
        return newPage;
      });
    }
  }, [viewMode]);

  const goToNextPage = useCallback(() => {
    if (viewMode === 'single') {
      setCurrentPage((prev) => {
        const newPage = Math.min(prev + 1, numPages);
        console.log(`Navigating to page ${newPage} (next)`);
        return newPage;
      });
    }
  }, [numPages, viewMode]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target !== document.body) return; // Only when not focused on input elements
      
      switch (event.key) {
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault();
          goToPrevPage();
          break;
        case 'ArrowRight':
        case 'PageDown':
          event.preventDefault();
          goToNextPage();
          break;
        case '+':
        case '=':
          event.preventDefault();
          handleZoomIn();
          break;
        case '-':
          event.preventDefault();
          handleZoomOut();
          break;
        case 'f':
        case 'F11':
          event.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPrevPage, handleZoomIn, handleZoomOut, toggleFullscreen]);

  const getFieldsForCurrentPage = () => {
    return detectedFields.filter((field) => field.pageNumber === currentPage);
  };

  const renderFieldOverlays = () => {
    // Don't render fields if highlighting is disabled
    if (!settings.fieldHighlight) {
      return null;
    }

    const fieldsOnPage = getFieldsForCurrentPage();
    
    return fieldsOnPage.map((field) => {
      const isSelected = field.fieldId === selectedFieldId;
      
      // Convert bounding box coordinates to pixels
      // Note: This is a simplified conversion and may need adjustment
      const [x, y, width, height] = field.boundingBox;
      const scaledX = x * scale;
      const scaledY = y * scale;
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;

      // Color coding based on confidence level
      const getFieldColors = (confidence: number, selected: boolean) => {
        if (selected) {
          return {
            border: '#1976d2',
            background: 'rgba(25, 118, 210, 0.15)',
            labelBg: '#1976d2'
          };
        }
        
        if (confidence >= 0.8) {
          return {
            border: '#4caf50',
            background: 'rgba(76, 175, 80, 0.1)',
            labelBg: '#4caf50'
          };
        } else if (confidence >= 0.6) {
          return {
            border: '#ff9800',
            background: 'rgba(255, 152, 0, 0.1)',
            labelBg: '#ff9800'
          };
        } else {
          return {
            border: '#f44336',
            background: 'rgba(244, 67, 54, 0.1)',
            labelBg: '#f44336'
          };
        }
      };

      const colors = getFieldColors(field.confidence, isSelected);

      return (
        <Box
          key={field.fieldId}
          sx={{
            position: 'absolute',
            left: scaledX,
            top: scaledY,
            width: scaledWidth,
            height: scaledHeight,
            border: `${isSelected ? '3px' : '2px'} solid ${colors.border}`,
            backgroundColor: colors.background,
            cursor: 'pointer',
            transition: settings.animationsEnabled ? 'all 0.2s ease' : 'none',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.2)',
              borderColor: '#1976d2',
              borderWidth: '3px',
              transform: 'scale(1.02)',
            },
          }}
          onClick={() => onFieldSelect?.(field)}
        >
          <Tooltip
            title={
              <Box>
                <Typography variant="body2" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {field.displayName}
                </Typography>
                
                <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                  <strong>Tipo:</strong> {field.fieldType}
                </Typography>
                
                <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                  <strong>Confianza:</strong> {Math.round(field.confidence * 100)}%
                </Typography>
                
                {settings.showCoordinates && (
                  <>
                    <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                      <strong>Coordenadas:</strong> ({field.boundingBox[0]}, {field.boundingBox[1]})
                    </Typography>
                    
                    <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                      <strong>Dimensiones:</strong> {field.boundingBox[2]} × {field.boundingBox[3]} px
                    </Typography>
                  </>
                )}
                
                <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                  <strong>Página:</strong> {field.pageNumber}
                </Typography>
                
                {field.capacity && (
                  <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                    <strong>Capacidad:</strong> {field.capacity.maxCharacters} chars
                  </Typography>
                )}
                
                {field.value && (
                  <Typography variant="caption" component="div" sx={{ 
                    fontStyle: 'italic', 
                    mt: 1, 
                    p: 0.5, 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: '4px',
                    maxWidth: '200px',
                    wordBreak: 'break-word'
                  }}>
                    "{field.value}"
                  </Typography>
                )}
              </Box>
            }
            arrow
            placement="top"
            componentsProps={{
              tooltip: {
                sx: {
                  maxWidth: '280px',
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                }
              }
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -20,
                left: 0,
                backgroundColor: colors.labelBg,
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {field.displayName}
              <Box
                component="span"
                sx={{
                  fontSize: '8px',
                  opacity: 0.9,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '1px 3px',
                  borderRadius: '2px',
                  marginLeft: '4px'
                }}
              >
                {Math.round(field.confidence * 100)}%
              </Box>
            </Box>
          </Tooltip>
        </Box>
      );
    });
  };

  const containerSx = isFullscreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: 'background.paper',
      }
    : {};

  return (
    <Paper 
      elevation={3}
      sx={{ 
        ...containerSx, 
        overflow: 'hidden',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* Enhanced Controls Bar */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          minHeight: 64,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              View Mode:
            </Typography>
            <ButtonGroup variant="contained" size="small" sx={{ boxShadow: 2 }}>
              <Button 
                onClick={() => setViewMode('single')}
                variant={viewMode === 'single' ? 'contained' : 'outlined'}
                color={viewMode === 'single' ? 'primary' : 'inherit'}
                sx={{ minWidth: 80 }}
              >
                Single
              </Button>
              <Button 
                onClick={() => setViewMode('continuous')}
                variant={viewMode === 'continuous' ? 'contained' : 'outlined'}
                color={viewMode === 'continuous' ? 'primary' : 'inherit'}
                sx={{ minWidth: 80 }}
              >
                Continuous
              </Button>
            </ButtonGroup>
          </Box>

          {viewMode === 'single' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                Navigate:
              </Typography>
              <ButtonGroup variant="contained" size="small" sx={{ boxShadow: 2 }}>
                <Button 
                  onClick={goToPrevPage} 
                  disabled={currentPage <= 1 || fallbackMode}
                  sx={{ minWidth: 40 }}
                >
                  <NavigateBefore />
                </Button>
                <Button 
                  disabled
                  sx={{ 
                    minWidth: 100,
                    fontWeight: 'bold',
                    backgroundColor: 'background.paper',
                    color: 'text.primary'
                  }}
                >
                  {currentPage} / {numPages || 1}
                  {fallbackMode && ' (Fallback)'}
                </Button>
                <Button 
                  onClick={goToNextPage} 
                  disabled={currentPage >= (numPages || 1) || fallbackMode}
                  sx={{ minWidth: 40 }}
                >
                  <NavigateNext />
                </Button>
              </ButtonGroup>
            </Box>
          )}

          {viewMode === 'continuous' && (
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 'bold', 
                color: 'primary.main',
                px: 2,
                py: 0.5,
                backgroundColor: 'primary.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'primary.200'
              }}
            >
              Showing all {numPages} pages
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Zoom:
          </Typography>
          <ButtonGroup variant="contained" size="small" sx={{ boxShadow: 2 }}>
            <Button 
              onClick={handleZoomOut} 
              disabled={scale <= 0.5}
              sx={{ minWidth: 40 }}
            >
              <ZoomOut />
            </Button>
            <Button 
              disabled
              sx={{ 
                minWidth: 80,
                fontWeight: 'bold',
                backgroundColor: 'background.paper',
                color: 'text.primary'
              }}
            >
              {Math.round(scale * 100)}%
            </Button>
            <Button 
              onClick={handleZoomIn} 
              disabled={scale >= 3.0}
              sx={{ minWidth: 40 }}
            >
              <ZoomIn />
            </Button>
          </ButtonGroup>

          <Button
            onClick={toggleFullscreen} 
            disabled={fallbackMode}
            variant="contained"
            color="secondary"
            size="small"
            startIcon={isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            sx={{ minWidth: 120 }}
          >
            {isFullscreen ? 'Exit Full' : 'Fullscreen'}
          </Button>

          {!fallbackMode && (
            <Button 
              variant="outlined" 
              size="small" 
              color="warning"
              onClick={() => {
                console.log('Switching to simple viewer mode...');
                setFallbackMode(true);
                setError(null);
                setLoading(false);
              }}
              sx={{ minWidth: 130 }}
            >
              Simple Viewer
            </Button>
          )}
        </Box>
      </Box>

      {/* 🚀 NUEVO: Banner de Métricas Revolucionarias */}
      {revolutionMetrics && modelUsed === 'prebuilt-layout' && (
        <Alert 
          severity="success" 
          sx={{ 
            borderRadius: 0,
            borderLeft: '4px solid #4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.08)',
            '& .MuiAlert-icon': { color: '#4caf50' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
              🚀 Análisis Revolucionario Completado
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={`${revolutionMetrics.improvementFactor}x más campos`}
                color="success"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
              <Chip 
                label={`${revolutionMetrics.keyValuePairsDetected} campos detectados`}
                color="primary"
                size="small"
              />
              {revolutionMetrics.tablesDetected > 0 && (
                <Chip 
                  label={`${revolutionMetrics.tablesDetected} tablas automáticas`}
                  color="info"
                  size="small"
                />
              )}
              {revolutionMetrics.selectionMarksDetected > 0 && (
                <Chip 
                  label={`${revolutionMetrics.selectionMarksDetected} checkboxes automáticos`}
                  color="warning"
                  size="small"
                />
              )}
              {processingTime && (
                <Chip 
                  label={`${processingTime.toFixed(1)}s procesamiento`}
                  variant="outlined"
                  size="small"
                />
              )}
              {confidence && (
                <Chip 
                  label={`${Math.round(confidence * 100)}% confianza`}
                  variant="outlined" 
                  size="small"
                />
              )}
            </Box>
          </Box>
        </Alert>
      )}

      {/* Fallback banner para modelos no revolucionarios */}
      {modelUsed === 'fallback' && (
        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: 0,
            backgroundColor: 'rgba(33, 150, 243, 0.08)'
          }}
        >
          <Typography variant="body2">
            📋 Usando análisis de prueba - Para resultados revolucionarios, configure Azure Document Intelligence
          </Typography>
        </Alert>
      )}

      {/* Enhanced PDF Content Area */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'auto',
          height: isFullscreen ? 'calc(100vh - 120px)' : '800px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          background: 'linear-gradient(145deg, #f0f2f5 0%, #e8ebf0 100%)',
          p: 3,
          '&:hover': {
            cursor: loading ? 'wait' : 'default'
          },
          '&::-webkit-scrollbar': {
            width: '12px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '6px',
            '&:hover': {
              background: '#555',
            },
          },
        }}
      >
        {loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              {!isWorkerReady ? 'Initializing PDF engine...' : 'Loading PDF document...'}
            </Typography>
            {!isWorkerReady && (
              <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                This may take a moment on first load
              </Typography>
            )}
          </Box>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ m: 2, maxWidth: '600px' }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  // Force reload
                  const timestamp = Date.now();
                  setPdfUrl(`${pdfUrl}?reload=${timestamp}`);
                }}
              >
                Retry
              </Button>
            }
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                PDF Loading Error:
              </Typography>
              <Typography variant="body2">
                {error}
              </Typography>
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                Debug info: URL={pdfUrl}, DocID={documentId}
              </Typography>
              {pdfUrl && (
                <Typography variant="caption" sx={{ display: 'block' }}>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    Test direct PDF access
                  </a>
                </Typography>
              )}
            </Box>
          </Alert>
        )}

        {!loading && !error && pdfUrl && !fallbackMode && isWorkerReady && (
          <Box sx={{ 
            position: 'relative',
            minHeight: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Loading PDF...</Typography>
                </Box>
              }
              error={
                <Alert severity="error">
                  Failed to load PDF. Please check the document.
                </Alert>
              }
              options={{
                cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                cMapPacked: true,
                standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
                withCredentials: false,
              }}
            >
              {viewMode === 'single' ? (
                <>
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    canvasBackground="white"
                    devicePixelRatio={settings.pdfQuality === 'high' ? 2 : settings.pdfQuality === 'medium' ? 1.5 : 1}
                    loading={
                      <Box sx={{ 
                        width: '100%', 
                        height: '800px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: 'white',
                        border: '1px solid #ccc'
                      }}>
                        <CircularProgress />
                      </Box>
                    }
                    error={
                      <Alert severity="error">
                        Failed to load page {currentPage}
                      </Alert>
                    }
                  />
                  {/* Field overlays for single page */}
                  {renderFieldOverlays()}
                </>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Array.from({ length: numPages }, (_, index) => {
                    const pageNum = index + 1;
                    const shouldRenderPage = pageNum <= 3 || (currentPage > 0 && Math.abs(pageNum - currentPage) <= 2); // Load first 3 pages and pages near current
                    
                    return (
                      <Box 
                        key={pageNum} 
                        sx={{ position: 'relative' }}
                        data-page={pageNum}
                      >
                        {shouldRenderPage ? (
                          <Page
                            pageNumber={pageNum}
                            scale={scale}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            canvasBackground="white"
                            devicePixelRatio={settings.pdfQuality === 'high' ? 2 : settings.pdfQuality === 'medium' ? 1.5 : 1}
                            loading={
                              <Box sx={{ 
                                width: '100%', 
                                height: '800px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                backgroundColor: 'white',
                                border: '1px solid #ccc',
                                mb: 2
                              }}>
                                <CircularProgress size={20} />
                                <Typography variant="caption" sx={{ ml: 1 }}>Loading page {pageNum}...</Typography>
                              </Box>
                            }
                            error={
                              <Alert severity="error" sx={{ mb: 2 }}>
                                Failed to load page {pageNum}
                              </Alert>
                            }
                          />
                        ) : (
                          <Box sx={{ 
                            width: '100%', 
                            height: '800px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: '#f5f5f5',
                            border: '1px solid #ddd',
                            mb: 2
                          }}>
                            <Typography variant="body2" color="text.secondary">
                              📄 Page {pageNum} - Scroll to load
                            </Typography>
                          </Box>
                        )}
                        {/* Field overlays for continuous mode */}
                        {detectedFields
                          .filter(field => field.pageNumber === pageNum)
                          .map((field) => {
                            const isSelected = field.fieldId === selectedFieldId;
                            const [x, y, width, height] = field.boundingBox;
                            const scaledX = x * scale;
                            const scaledY = y * scale;
                            const scaledWidth = width * scale;
                            const scaledHeight = height * scale;

                            const getFieldColors = (confidence: number, selected: boolean) => {
                              if (selected) {
                                return {
                                  border: '#1976d2',
                                  background: 'rgba(25, 118, 210, 0.15)',
                                  labelBg: '#1976d2'
                                };
                              }
                              
                              if (confidence >= 0.8) {
                                return {
                                  border: '#4caf50',
                                  background: 'rgba(76, 175, 80, 0.1)',
                                  labelBg: '#4caf50'
                                };
                              } else if (confidence >= 0.6) {
                                return {
                                  border: '#ff9800',
                                  background: 'rgba(255, 152, 0, 0.1)',
                                  labelBg: '#ff9800'
                                };
                              } else {
                                return {
                                  border: '#f44336',
                                  background: 'rgba(244, 67, 54, 0.1)',
                                  labelBg: '#f44336'
                                };
                              }
                            };

                            const colors = getFieldColors(field.confidence, isSelected);

                            return (
                              <Box
                                key={field.fieldId}
                                sx={{
                                  position: 'absolute',
                                  left: scaledX,
                                  top: scaledY,
                                  width: scaledWidth,
                                  height: scaledHeight,
                                  border: `${isSelected ? '3px' : '2px'} solid ${colors.border}`,
                                  backgroundColor: colors.background,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  borderRadius: '4px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.2)',
                                    borderColor: '#1976d2',
                                    borderWidth: '3px',
                                    transform: 'scale(1.02)',
                                  },
                                }}
                                onClick={() => onFieldSelect?.(field)}
                              >
                                <Tooltip
                                  title={
                                    <Box>
                                      <Typography variant="body2" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        {field.displayName}
                                      </Typography>
                                      <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                                        <strong>Página:</strong> {field.pageNumber}
                                      </Typography>
                                      <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                                        <strong>Confianza:</strong> {Math.round(field.confidence * 100)}%
                                      </Typography>
                                    </Box>
                                  }
                                  arrow
                                  placement="top"
                                >
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: -20,
                                      left: 0,
                                      backgroundColor: colors.labelBg,
                                      color: 'white',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      fontWeight: 'bold',
                                      whiteSpace: 'nowrap',
                                      zIndex: 10,
                                    }}
                                  >
                                    {field.displayName}
                                  </Box>
                                </Tooltip>
                              </Box>
                            );
                          })
                        }
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Document>
          </Box>
        )}

        {/* Enhanced Fallback Viewer Mode */}
        {!loading && !error && pdfUrl && fallbackMode && (
          <Box sx={{ 
            position: 'relative',
            minHeight: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            gap: 3,
            p: 2
          }}>
            {/* Main PDF Viewer Area */}
            <Box sx={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              {/* Info Alert */}
              <Alert 
                severity="info" 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 1
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    📄 Simple PDF Viewer Mode
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Using browser's native PDF renderer. Field detection is limited.
                  </Typography>
                </Box>
                <Button 
                  variant="contained"
                  color="primary"
                  size="small" 
                  onClick={() => {
                    setFallbackMode(false);
                    setLoading(true);
                  }}
                  sx={{ minWidth: 150 }}
                >
                  Switch to Advanced
                </Button>
              </Alert>
              
              {/* PDF Iframe */}
              <Paper 
                elevation={3}
                sx={{ 
                  flex: 1,
                  overflow: 'hidden',
                  borderRadius: 2
                }}
              >
                <iframe
                  src={pdfUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '600px',
                    border: 'none',
                    display: 'block'
                  }}
                  title={`PDF Document ${documentId}`}
                />
              </Paper>
            </Box>
            
            {/* Fields Sidebar */}
            <Paper 
              elevation={3}
              sx={{ 
                width: 380,
                maxHeight: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2
              }}
            >
              {/* Sidebar Header */}
              <Box sx={{ 
                p: 2.5, 
                borderBottom: '2px solid',
                borderColor: 'primary.main',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  🔍 Detected Fields
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All {detectedFields.length} fields from the document
                </Typography>
              </Box>
              
              {/* Fields List */}
              <Box sx={{ 
                flex: 1,
                overflow: 'auto',
                p: 2,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                  borderRadius: '4px',
                  '&:hover': {
                    background: '#555',
                  },
                },
              }}>
                {detectedFields.length === 0 ? (
                  <Alert severity="info">
                    No fields detected in this document.
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {detectedFields.map((field) => {
                      const isSelected = field.fieldId === selectedFieldId;
                      const confidenceColor = field.confidence >= 0.8 ? 'success' : 
                                             field.confidence >= 0.6 ? 'warning' : 'error';
                      
                      return (
                        <Paper
                          key={field.fieldId} 
                          elevation={isSelected ? 4 : 1}
                          sx={{ 
                            p: 2, 
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: isSelected ? '2px solid' : '1px solid',
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            backgroundColor: isSelected ? 'primary.50' : 'background.paper',
                            '&:hover': { 
                              transform: 'translateY(-2px)',
                              boxShadow: 3,
                              borderColor: 'primary.light'
                            }
                          }}
                          onClick={() => onFieldSelect?.(field)}
                        >
                          {/* Field Header */}
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 1
                          }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {field.displayName}
                            </Typography>
                            <Chip 
                              label={`${Math.round(field.confidence * 100)}%`}
                              size="small"
                              color={confidenceColor}
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>
                          
                          {/* Field Details */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Type:
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                                {field.fieldType}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Page:
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                                {field.pageNumber}
                              </Typography>
                            </Box>
                            
                            {field.value && (
                              <Box sx={{ 
                                mt: 1,
                                p: 1,
                                backgroundColor: 'grey.100',
                                borderRadius: 1,
                                border: '1px dashed',
                                borderColor: 'grey.300'
                              }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontStyle: 'italic',
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  "{field.value}"
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </Box>
              
              {/* Sidebar Footer Stats */}
              <Box sx={{ 
                p: 2, 
                borderTop: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'grey.50'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    Field Statistics:
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    size="small" 
                    color="success" 
                    label={`High: ${detectedFields.filter(f => f.confidence >= 0.8).length}`} 
                  />
                  <Chip 
                    size="small" 
                    color="warning" 
                    label={`Med: ${detectedFields.filter(f => f.confidence >= 0.6 && f.confidence < 0.8).length}`} 
                  />
                  <Chip 
                    size="small" 
                    color="error" 
                    label={`Low: ${detectedFields.filter(f => f.confidence < 0.6).length}`} 
                  />
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>

      {/* Enhanced Field Statistics */}
      <Box 
        sx={{ 
          p: 2, 
          backgroundColor: 'primary.50', 
          borderTop: '2px solid',
          borderColor: 'primary.main',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            📋 Fields Analysis:
          </Typography>
          {viewMode === 'single' ? (
            <Typography variant="body2" color="text.primary">
              {getFieldsForCurrentPage().length} field(s) on page {currentPage}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.primary">
              {detectedFields.length} total fields across {numPages} pages
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            🎯 Confidence: 
          </Typography>
          <Typography variant="caption" color="success.main">
            {detectedFields.length > 0 ? 
              Math.round((detectedFields.reduce((sum, field) => sum + field.confidence, 0) / detectedFields.length) * 100) : 0}% avg
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};