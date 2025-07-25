import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Divider,
  Grid,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  Error,
  Warning,
  Info,
  BugReport,
  Psychology,
  Analytics,
  Lightbulb,
} from '@mui/icons-material';
import { DetailedValidationResults, FieldValidationResult, FormValidationIssue } from '../../services/api/validation.service';

interface AdvancedValidationPanelProps {
  validationResults: DetailedValidationResults;
  documentId: string;
  isValid: boolean;
  completionPercentage: number;
}

export const AdvancedValidationPanel: React.FC<AdvancedValidationPanelProps> = ({
  validationResults,
  documentId,
  isValid,
  completionPercentage,
}) => {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    summary: true,
    fields: true, // 🚀 CAMBIO: Expandir fields por defecto para debugging
    issues: false,
    suggestions: false,
  });

  // 🚀 DEBUG: Log para verificar que los datos llegan correctamente
  console.log('🔍 AdvancedValidationPanel props:', {
    validationResults,
    documentId,
    isValid,
    completionPercentage,
    fieldResultsCount: validationResults?.fieldResults?.length || 0
  });

  const handleSectionToggle = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'info':
        return <Info color="info" />;
      default:
        return <Info />;
    }
  };

  const getSeverityColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const getValidationStatusChip = (field: FieldValidationResult) => {
    const errorCount = field.validationResults.filter(vr => vr.severity === 'error' && !vr.result.isValid).length;
    const warningCount = field.validationResults.filter(vr => vr.severity === 'warning' && !vr.result.isValid).length;

    if (errorCount > 0) {
      return <Chip label={`${errorCount} error(es)`} color="error" size="small" />;
    } else if (warningCount > 0) {
      return <Chip label={`${warningCount} advertencia(s)`} color="warning" size="small" />;
    } else {
      return <Chip label="Válido" color="success" size="small" />;
    }
  };

  const getIssueTypeIcon = (type: FormValidationIssue['type']) => {
    switch (type) {
      case 'missing_required':
        return <Error />;
      case 'invalid_combination':
        return <BugReport />;
      case 'inconsistent_data':
        return <Warning />;
      case 'format_mismatch':
        return <Error />;
      default:
        return <Warning />;
    }
  };

  const getIssueTypeDescription = (type: FormValidationIssue['type']) => {
    switch (type) {
      case 'missing_required':
        return 'Campo Requerido Faltante';
      case 'invalid_combination':
        return 'Combinación Inválida';
      case 'inconsistent_data':
        return 'Datos Inconsistentes';
      case 'format_mismatch':
        return 'Formato Incorrecto';
      default:
        return 'Problema de Validación';
    }
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: '2px solid red' }}>
      {/* 🚀 DEBUG: Indicador visual prominente */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="h6">
          🔍 ADVANCED VALIDATION PANEL ACTIVE
        </Typography>
        <Typography variant="body2">
          Fields: {validationResults?.fieldResults?.length || 0} | 
          Valid: {isValid ? 'YES' : 'NO'} | 
          Completion: {completionPercentage}%
        </Typography>
      </Alert>
      
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Psychology color="primary" />
        Análisis de Validación Avanzado
      </Typography>

      {/* Overall Status */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color={isValid ? 'success.main' : 'error.main'}>
                {Math.round(completionPercentage)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completitud de Validación
              </Typography>
              <LinearProgress
                variant="determinate"
                value={completionPercentage}
                color={completionPercentage > 80 ? 'success' : completionPercentage > 60 ? 'warning' : 'error'}
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Chip
                icon={isValid ? <CheckCircle /> : <Error />}
                label={isValid ? 'Formulario Válido' : 'Problemas Detectados'}
                color={isValid ? 'success' : 'error'}
                variant={isValid ? 'filled' : 'outlined'}
              />
              <Typography variant="body2" color="text.secondary">
                Documento ID: {documentId}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Section */}
      <Accordion 
        expanded={expandedSections.summary} 
        onChange={() => handleSectionToggle('summary')}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Analytics />
            <Typography variant="h6">Resumen de Validación</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="primary">
                    {validationResults.validationSummary.totalFields}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Campos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="success.main">
                    {validationResults.validationSummary.validFields}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Campos Válidos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="error.main">
                    {validationResults.validationSummary.fieldsWithErrors}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Con Errores
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="warning.main">
                    {validationResults.validationSummary.fieldsWithWarnings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Con Advertencias
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Confianza Promedio:</strong> {Math.round(validationResults.validationSummary.averageConfidence * 100)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={validationResults.validationSummary.averageConfidence * 100}
              color={validationResults.validationSummary.averageConfidence > 0.8 ? 'success' : 
                     validationResults.validationSummary.averageConfidence > 0.6 ? 'warning' : 'error'}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Field Validation Details */}
      <Accordion 
        expanded={expandedSections.fields} 
        onChange={() => handleSectionToggle('fields')}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle />
            <Typography variant="h6">Validación por Campo</Typography>
            <Chip 
              label={`${validationResults.fieldResults.length} campos`} 
              size="small" 
              variant="outlined" 
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {/* 🚀 DEBUG: Información de campos */}
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              🔍 DEBUG: Processing {validationResults.fieldResults.length} field results
            </Typography>
          </Alert>
          
          <List>
            {validationResults.fieldResults.map((field, index) => (
              <Box key={field.fieldId}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    {field.overallValid ? <CheckCircle color="success" /> : <Error color="error" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle2">
                          Campo: {field.fieldId}
                        </Typography>
                        {getValidationStatusChip(field)}
                        <Chip 
                          label={`${Math.round(field.confidence * 100)}% confianza`} 
                          size="small" 
                          variant="outlined"
                          color={field.confidence > 0.8 ? 'success' : field.confidence > 0.6 ? 'warning' : 'error'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" gutterBottom>
                          <strong>Tipo:</strong> {field.fieldType} | <strong>Valor:</strong> "{field.value}"
                        </Typography>
                        
                        {field.validationResults.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                              Resultados de Validación:
                            </Typography>
                            {field.validationResults.map((vr, vrIndex) => (
                              <Box key={vrIndex} sx={{ ml: 2, mb: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {getSeverityIcon(vr.severity)}
                                  <Typography variant="caption">
                                    <strong>{vr.ruleName}:</strong> {vr.result.isValid ? 'Válido' : vr.result.message}
                                  </Typography>
                                </Box>
                                {vr.result.suggestion && !vr.result.isValid && (
                                  <Box sx={{ ml: 3 }}>
                                    <Typography variant="caption" color="info.main" sx={{ fontStyle: 'italic' }}>
                                      💡 {vr.result.suggestion}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}

                        {field.suggestedCorrection && (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            <Typography variant="caption">
                              <strong>Sugerencia:</strong> {field.suggestedCorrection}
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < validationResults.fieldResults.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Form-Specific Issues */}
      {validationResults.formSpecificIssues.length > 0 && (
        <Accordion 
          expanded={expandedSections.issues} 
          onChange={() => handleSectionToggle('issues')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BugReport />
              <Typography variant="h6">Problemas del Formulario</Typography>
              <Chip 
                label={`${validationResults.formSpecificIssues.length} problema(s)`} 
                size="small" 
                color="error" 
                variant="outlined" 
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {validationResults.formSpecificIssues.map((issue, index) => (
                <Box key={index}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      {getIssueTypeIcon(issue.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle2">
                            {getIssueTypeDescription(issue.type)}
                          </Typography>
                          <Chip 
                            label={issue.severity} 
                            size="small" 
                            color={getSeverityColor(issue.severity as any)}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            {issue.message}
                          </Typography>
                          {issue.affectedFields.length > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              <strong>Campos afectados:</strong> {issue.affectedFields.join(', ')}
                            </Typography>
                          )}
                          {issue.suggestion && (
                            <Alert severity="info" sx={{ mt: 1 }}>
                              <Typography variant="caption">
                                <strong>Recomendación:</strong> {issue.suggestion}
                              </Typography>
                            </Alert>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < validationResults.formSpecificIssues.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Suggestions */}
      {validationResults.suggestions.length > 0 && (
        <Accordion 
          expanded={expandedSections.suggestions} 
          onChange={() => handleSectionToggle('suggestions')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lightbulb />
              <Typography variant="h6">Sugerencias de Mejora</Typography>
              <Chip 
                label={`${validationResults.suggestions.length} sugerencia(s)`} 
                size="small" 
                color="info" 
                variant="outlined" 
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {validationResults.suggestions.map((suggestion, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Lightbulb color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        {suggestion}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};