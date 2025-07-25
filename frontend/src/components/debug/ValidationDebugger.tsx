/* eslint-disable no-console */
import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import { ExpandMore, BugReport } from '@mui/icons-material';
import { validationService } from '../../services/api/validation.service';

interface ValidationDebuggerProps {
  documentId: string;
}

export const ValidationDebugger: React.FC<ValidationDebuggerProps> = ({ documentId }) => {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 DIAGNÓSTICO: Iniciando debug de validación...');
      
      // 1. Test raw API call
      const rawResponse = await fetch(`http://localhost:7075/api/validate/${documentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const rawData = await rawResponse.json();
      console.log('📡 Raw API Response:', rawData);
      
      // 2. Test through service
      const serviceResult = await validationService.validateDocument(documentId);
      console.log('🔧 Service Result:', serviceResult);
      
      // 3. Analyze structure
      const analysis = {
        timestamp: new Date().toISOString(),
        documentId,
        rawApiCall: {
          status: rawResponse.status,
          statusText: rawResponse.statusText,
          hasData: !!rawData,
          dataKeys: rawData ? Object.keys(rawData) : [],
          hasDetailedResults: !!(rawData?.data?.detailedResults),
          detailedResultsKeys: rawData?.data?.detailedResults ? Object.keys(rawData.data.detailedResults) : []
        },
        serviceCall: {
          hasResult: !!serviceResult,
          resultKeys: serviceResult ? Object.keys(serviceResult) : [],
          hasDetailedResults: !!(serviceResult?.detailedResults),
          detailedResultsStructure: serviceResult?.detailedResults ? {
            hasFieldResults: !!(serviceResult.detailedResults.fieldResults),
            fieldResultsCount: serviceResult.detailedResults.fieldResults?.length || 0,
            hasFormSpecificIssues: !!(serviceResult.detailedResults.formSpecificIssues),
            formIssuesCount: serviceResult.detailedResults.formSpecificIssues?.length || 0,
            hasValidationSummary: !!(serviceResult.detailedResults.validationSummary),
            hasSuggestions: !!(serviceResult.detailedResults.suggestions)
          } : null
        },
        fullRawData: rawData,
        fullServiceResult: serviceResult
      };
      
      setDebugData(analysis);
      console.log('🎯 ANÁLISIS COMPLETO:', analysis);
      
    } catch (err) {
      console.error('❌ Error en diagnóstico:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugReport color="warning" />
          Validation Debug Tool
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Documento ID: {documentId}
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={runDiagnostic}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? 'Ejecutando Diagnóstico...' : 'Ejecutar Diagnóstico'}
        </Button>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>Error:</strong> {error}
          </Alert>
        )}
        
        {debugData && (
          <Box>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Resumen de Diagnóstico</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip 
                    label={`API Status: ${debugData.rawApiCall.status}`}
                    color={debugData.rawApiCall.status === 200 ? 'success' : 'error'}
                  />
                  <Chip 
                    label={`Has Raw Data: ${debugData.rawApiCall.hasData ? 'Sí' : 'No'}`}
                    color={debugData.rawApiCall.hasData ? 'success' : 'error'}
                  />
                  <Chip 
                    label={`Has Detailed Results: ${debugData.rawApiCall.hasDetailedResults ? 'Sí' : 'No'}`}
                    color={debugData.rawApiCall.hasDetailedResults ? 'success' : 'error'}
                  />
                  <Chip 
                    label={`Service Result: ${debugData.serviceCall.hasResult ? 'Sí' : 'No'}`}
                    color={debugData.serviceCall.hasResult ? 'success' : 'error'}
                  />
                </Box>
                
                {debugData.serviceCall.detailedResultsStructure && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Estructura detailedResults:</Typography>
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body2">• Field Results: {debugData.serviceCall.detailedResultsStructure.fieldResultsCount} campos</Typography>
                      <Typography variant="body2">• Form Issues: {debugData.serviceCall.detailedResultsStructure.formIssuesCount} problemas</Typography>
                      <Typography variant="body2">• Has Summary: {debugData.serviceCall.detailedResultsStructure.hasValidationSummary ? 'Sí' : 'No'}</Typography>
                      <Typography variant="body2">• Has Suggestions: {debugData.serviceCall.detailedResultsStructure.hasSuggestions ? 'Sí' : 'No'}</Typography>
                    </Box>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Raw API Response</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '16px', 
                  borderRadius: '4px', 
                  overflow: 'auto',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(debugData.fullRawData, null, 2)}
                </pre>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Service Result</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '16px', 
                  borderRadius: '4px', 
                  overflow: 'auto',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(debugData.fullServiceResult, null, 2)}
                </pre>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </Paper>
    </Box>
  );
};