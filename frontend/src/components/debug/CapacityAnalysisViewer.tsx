import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  Info,
  Warning,
  Error,
  CheckCircle
} from '@mui/icons-material';
import { FieldDetection } from '../pdf/PDFViewer';

interface CapacityAnalysisViewerProps {
  fields: FieldDetection[];
  title?: string;
}

interface CapacityStats {
  totalFields: number;
  fieldsWithConflicts: number;
  averageConfidence: number;
  capacityDistribution: {
    small: number;
    medium: number;
    large: number;
  };
}

export const CapacityAnalysisViewer: React.FC<CapacityAnalysisViewerProps> = ({
  fields,
  title = 'Análisis de Capacidad de Caracteres'
}) => {
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const capacityStats = useMemo((): CapacityStats => {
    const fieldsWithCapacity = fields.filter(f => f.capacity);
    
    return {
      totalFields: fields.length,
      fieldsWithConflicts: fieldsWithCapacity.filter(f => 
        f.capacity?.conflictsWith && f.capacity.conflictsWith.length > 0
      ).length,
      averageConfidence: fieldsWithCapacity.length > 0 
        ? fieldsWithCapacity.reduce((sum, f) => sum + (f.capacity?.confidence || 0), 0) / fieldsWithCapacity.length
        : 0,
      capacityDistribution: {
        small: fieldsWithCapacity.filter(f => (f.capacity?.maxCharacters || 0) < 50).length,
        medium: fieldsWithCapacity.filter(f => 
          (f.capacity?.maxCharacters || 0) >= 50 && (f.capacity?.maxCharacters || 0) < 200
        ).length,
        large: fieldsWithCapacity.filter(f => (f.capacity?.maxCharacters || 0) >= 200).length
      }
    };
  }, [fields]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'success';
    if (confidence > 0.6) return 'warning';
    return 'error';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence > 0.8) return <CheckCircle color="success" />;
    if (confidence > 0.6) return <Warning color="warning" />;
    return <Error color="error" />;
  };

  const getCapacitySizeLabel = (maxCharacters: number) => {
    if (maxCharacters < 50) return { label: 'Pequeño', color: 'info' as const };
    if (maxCharacters < 200) return { label: 'Mediano', color: 'primary' as const };
    return { label: 'Grande', color: 'success' as const };
  };

  const fieldsWithCapacity = fields.filter(f => f.capacity);

  if (fieldsWithCapacity.length === 0) {
    return (
      <Alert severity="info">
        No hay datos de capacidad disponibles para estos campos.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      {/* Summary Statistics */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Resumen
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {capacityStats.totalFields}
              </Typography>
              <Typography variant="caption">
                Campos Totales
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {capacityStats.fieldsWithConflicts}
              </Typography>
              <Typography variant="caption">
                Con Conflictos
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color={getConfidenceColor(capacityStats.averageConfidence) + '.main'}>
                {Math.round(capacityStats.averageConfidence * 100)}%
              </Typography>
              <Typography variant="caption">
                Confianza Promedio
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {capacityStats.capacityDistribution.large}
              </Typography>
              <Typography variant="caption">
                Campos Grandes
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Distribution Chart */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Distribución por Tamaño
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={4}>
            <Chip 
              label={`Pequeños (${capacityStats.capacityDistribution.small})`}
              color="info"
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={4}>
            <Chip 
              label={`Medianos (${capacityStats.capacityDistribution.medium})`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={4}>
            <Chip 
              label={`Grandes (${capacityStats.capacityDistribution.large})`}
              color="success"
              variant="outlined"
              size="small"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Debug Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={showDebugInfo}
              onChange={(e) => setShowDebugInfo(e.target.checked)}
            />
          }
          label="Mostrar información de debug"
        />
      </Paper>

      {/* Fields Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Campo</TableCell>
              <TableCell>Capacidad</TableCell>
              <TableCell>Dimensiones</TableCell>
              <TableCell>Fuente</TableCell>
              <TableCell>Confianza</TableCell>
              <TableCell>Conflictos</TableCell>
              {showDebugInfo && <TableCell>Debug</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {fieldsWithCapacity.map((field) => {
              const capacity = field.capacity!;
              const sizeInfo = getCapacitySizeLabel(capacity.maxCharacters);
              
              return (
                <TableRow 
                  key={field.fieldId}
                  hover
                  onClick={() => setSelectedField(
                    selectedField === field.fieldId ? null : field.fieldId
                  )}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {field.displayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {field.fieldType}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={`${capacity.maxCharacters} chars`}
                        color={sizeInfo.color}
                        size="small"
                      />
                      <Typography variant="caption">
                        {capacity.charactersPerLine}×{capacity.maxLines}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="caption">
                      {capacity.debugInfo.originalWidth}×{capacity.debugInfo.originalHeight}
                      {capacity.debugInfo.effectiveWidth !== capacity.debugInfo.originalWidth && (
                        <Box component="span" color="warning.main">
                          → {capacity.debugInfo.effectiveWidth}×{capacity.debugInfo.effectiveHeight}
                        </Box>
                      )}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="caption">
                      {capacity.fontSize}px {capacity.fontFamily}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {getConfidenceIcon(capacity.confidence)}
                      <Typography variant="caption">
                        {Math.round(capacity.confidence * 100)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    {capacity.conflictsWith.length > 0 ? (
                      <Tooltip title={`Conflictos con: ${capacity.conflictsWith.join(', ')}`}>
                        <Chip
                          label={capacity.conflictsWith.length}
                          color="warning"
                          size="small"
                          icon={<Warning />}
                        />
                      </Tooltip>
                    ) : (
                      <Chip
                        label="Sin conflictos"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  
                  {showDebugInfo && (
                    <TableCell>
                      <Tooltip title="Ver detalles de debug">
                        <Info color="action" fontSize="small" />
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Debug Panel */}
      {showDebugInfo && selectedField && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Información de Debug - {fieldsWithCapacity.find(f => f.fieldId === selectedField)?.displayName}
          </Typography>
          
          {(() => {
            const field = fieldsWithCapacity.find(f => f.fieldId === selectedField);
            if (!field?.capacity) return null;
            
            const debug = field.capacity.debugInfo;
            
            return (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Dimensiones
                  </Typography>
                  <Typography variant="body2">
                    Original: {debug.originalWidth} × {debug.originalHeight}px
                  </Typography>
                  <Typography variant="body2">
                    Efectivo: {debug.effectiveWidth} × {debug.effectiveHeight}px
                  </Typography>
                  <Typography variant="body2">
                    Reducción: {Math.round((1 - debug.effectiveWidth / debug.originalWidth) * 100)}% × {Math.round((1 - debug.effectiveHeight / debug.originalHeight) * 100)}%
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tipografía
                  </Typography>
                  <Typography variant="body2">
                    Fuente detectada: {debug.detectedFontSize}px
                  </Typography>
                  <Typography variant="body2">
                    Factor de ajuste: {field.capacity.adjustmentFactor}
                  </Typography>
                </Grid>
                
                {debug.spatialConflicts.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Conflictos Espaciales
                    </Typography>
                    {debug.spatialConflicts.map((conflict, index) => (
                      <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          Solapamiento {conflict.conflictType} ({Math.round(conflict.overlapPercentage)}%) 
                          - Resolución: {conflict.resolution.action}
                        </Typography>
                      </Alert>
                    ))}
                  </Grid>
                )}
              </Grid>
            );
          })()}
        </Paper>
      )}
    </Box>
  );
};

export default CapacityAnalysisViewer;