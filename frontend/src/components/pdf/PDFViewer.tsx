import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
  Alert,
  ButtonGroup,
  Button,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  NavigateBefore,
  NavigateNext,
  FullscreenExit,
  Fullscreen,
} from '@mui/icons-material';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export interface FieldDetection {
  fieldId: string;
  displayName: string;
  value: string;
  confidence: number;
  boundingBox: number[];
  pageNumber: number;
  fieldType: string;
}

interface PDFViewerProps {
  pdfUrl: string;
  detectedFields?: FieldDetection[];
  onFieldSelect?: (_field: FieldDetection) => void;
  selectedFieldId?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  detectedFields = [],
  onFieldSelect,
  selectedFieldId,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    setError(`Failed to load PDF: ${error.message}`);
    setLoading(false);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getFieldsForCurrentPage = () => {
    return detectedFields.filter((field) => field.pageNumber === currentPage);
  };

  const renderFieldOverlays = () => {
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

      return (
        <Box
          key={field.fieldId}
          sx={{
            position: 'absolute',
            left: scaledX,
            top: scaledY,
            width: scaledWidth,
            height: scaledHeight,
            border: isSelected ? '3px solid #1976d2' : '2px solid #4caf50',
            backgroundColor: isSelected 
              ? 'rgba(25, 118, 210, 0.1)' 
              : 'rgba(76, 175, 80, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.2)',
              borderColor: '#1976d2',
              borderWidth: '3px',
            },
          }}
          onClick={() => onFieldSelect?.(field)}
        >
          <Tooltip
            title={
              <Box>
                <Typography variant="body2" component="div">
                  <strong>{field.displayName}</strong>
                </Typography>
                <Typography variant="caption" component="div">
                  Type: {field.fieldType}
                </Typography>
                <Typography variant="caption" component="div">
                  Confidence: {Math.round(field.confidence * 100)}%
                </Typography>
                {field.value && (
                  <Typography variant="caption" component="div">
                    Value: {field.value}
                  </Typography>
                )}
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
                backgroundColor: isSelected ? '#1976d2' : '#4caf50',
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
    <Paper sx={{ ...containerSx, overflow: 'hidden' }}>
      {/* Controls */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ButtonGroup variant="outlined" size="small">
            <Button onClick={goToPrevPage} disabled={currentPage <= 1}>
              <NavigateBefore />
            </Button>
            <Button disabled>
              {currentPage} / {numPages}
            </Button>
            <Button onClick={goToNextPage} disabled={currentPage >= numPages}>
              <NavigateNext />
            </Button>
          </ButtonGroup>

          <Typography variant="body2" color="text.secondary">
            Page {currentPage} of {numPages}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ButtonGroup variant="outlined" size="small">
            <Button onClick={handleZoomOut} disabled={scale <= 0.5}>
              <ZoomOut />
            </Button>
            <Button disabled>
              {Math.round(scale * 100)}%
            </Button>
            <Button onClick={handleZoomIn} disabled={scale >= 3.0}>
              <ZoomIn />
            </Button>
          </ButtonGroup>

          <IconButton onClick={toggleFullscreen}>
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Box>
      </Box>

      {/* PDF Content */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'auto',
          height: isFullscreen ? 'calc(100vh - 80px)' : '600px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          backgroundColor: '#f5f5f5',
          p: 2,
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
              Loading PDF...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <Box sx={{ position: 'relative' }}>
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
            
            {/* Field overlays */}
            {renderFieldOverlays()}
          </Box>
        )}
      </Box>

      {/* Field count info */}
      {getFieldsForCurrentPage().length > 0 && (
        <Box sx={{ p: 1, backgroundColor: 'background.default', textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {getFieldsForCurrentPage().length} field(s) detected on this page
          </Typography>
        </Box>
      )}
    </Paper>
  );
};