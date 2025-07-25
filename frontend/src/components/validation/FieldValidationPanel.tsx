import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  MenuItem,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  ExpandMore,
  Edit,
  Save,
  Cancel,
  Delete,
} from '@mui/icons-material';
import { FieldDetection } from '../pdf/PDFViewer';
import DeleteFieldDialog from './DeleteFieldDialog';

interface FieldValidationPanelProps {
  fields: FieldDetection[];
  onFieldSelect: (_field: FieldDetection) => void;
  onFieldUpdate: (_fieldId: string, _updates: Partial<FieldDetection>) => void;
  onFieldDelete?: (_fieldId: string) => void;
  selectedFieldId?: string;
  onApprove?: () => void;
  onReject?: () => void;
  onMarkForReview?: () => void;
  isProcessing?: boolean;
}

const fieldTypes = [
  // Tipos básicos
  { value: 'text', label: 'Texto' },
  { value: 'date', label: 'Fecha' },
  { value: 'email', label: 'Correo Electrónico' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'currency', label: 'Moneda' },
  { value: 'number', label: 'Número' },
  { value: 'checkbox', label: 'Casilla de Verificación' },
  
  // Identificadores mexicanos
  { value: 'rfc', label: 'RFC (Registro Federal de Contribuyentes)' },
  { value: 'curp', label: 'CURP (Clave Única de Registro de Población)' },
  { value: 'nss', label: 'NSS (Número de Seguridad Social)' },
  { value: 'imss-number', label: 'Número IMSS' },
  { value: 'issste-number', label: 'Número ISSSTE' },
  { value: 'folio-afiliacion', label: 'Folio de Afiliación' },
  
  // Campos médicos específicos
  { value: 'medical-diagnosis', label: 'Diagnóstico Médico (CIE-10)' },
  { value: 'medical-procedure', label: 'Procedimiento Médico' },
  { value: 'medicine-name', label: 'Nombre de Medicamento' },
  { value: 'medical-specialty', label: 'Especialidad Médica' },
  { value: 'hospital-name', label: 'Nombre de Hospital/Clínica' },
  { value: 'doctor-name', label: 'Nombre del Médico' },
  { value: 'cedula-profesional', label: 'Cédula Profesional' },
  
  // Campos de seguros
  { value: 'policy-number', label: 'Número de Póliza' },
  { value: 'claim-number', label: 'Número de Siniestro' },
  { value: 'insurer-name', label: 'Nombre de Aseguradora' },
  { value: 'coverage-type', label: 'Tipo de Cobertura' },
  { value: 'deductible', label: 'Deducible' },
  { value: 'copayment', label: 'Copago' },
  
  // Campos financieros
  { value: 'clabe', label: 'CLABE Bancaria' },
  { value: 'credit-card', label: 'Número de Tarjeta' },
  { value: 'invoice-folio', label: 'Folio de Factura' },
  { value: 'invoice-uuid', label: 'UUID de Factura' },
  
  // Campos de ubicación
  { value: 'postal-code', label: 'Código Postal' },
  { value: 'state', label: 'Estado' },
  { value: 'municipality', label: 'Municipio' },
  { value: 'address', label: 'Dirección Completa' },
];

export const FieldValidationPanel: React.FC<FieldValidationPanelProps> = ({
  fields,
  onFieldSelect,
  onFieldUpdate,
  onFieldDelete,
  selectedFieldId,
  onApprove,
  onReject,
  onMarkForReview,
  isProcessing = false,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FieldDetection>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<FieldDetection | null>(null);

  const startEditing = (field: FieldDetection) => {
    setEditingField(field.fieldId);
    setEditForm({
      displayName: field.displayName,
      fieldType: field.fieldType,
      value: field.value,
    });
  };

  const saveEditing = () => {
    if (editingField && editForm) {
      onFieldUpdate(editingField, editForm);
      setEditingField(null);
      setEditForm({});
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditForm({});
  };

  const handleDeleteClick = (field: FieldDetection) => {
    setFieldToDelete(field);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (fieldToDelete && onFieldDelete) {
      onFieldDelete(fieldToDelete.fieldId);
      setDeleteDialogOpen(false);
      setFieldToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setFieldToDelete(null);
  };

  const getFieldIcon = (field: FieldDetection) => {
    if (field.confidence >= 0.8) {
      return <CheckCircle color="success" />;
    } else if (field.confidence >= 0.6) {
      return <Warning color="warning" />;
    } else {
      return <Error color="error" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getValidationStats = () => {
    const total = fields.length;
    const highConfidence = fields.filter(f => f.confidence >= 0.8).length;
    const mediumConfidence = fields.filter(f => f.confidence >= 0.6 && f.confidence < 0.8).length;
    const lowConfidence = fields.filter(f => f.confidence < 0.6).length;

    return { total, highConfidence, mediumConfidence, lowConfidence };
  };

  const stats = getValidationStats();
  const completionPercentage = (stats.highConfidence / stats.total) * 100;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with stats */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Validación de Campos
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              Progreso de Validación
            </Typography>
            <Typography variant="body2">
              {Math.round(completionPercentage)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            color={completionPercentage > 80 ? 'success' : completionPercentage > 60 ? 'warning' : 'error'}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={<CheckCircle />}
            label={`${stats.highConfidence} Alta confianza`}
            color="success"
            size="small"
          />
          <Chip
            icon={<Warning />}
            label={`${stats.mediumConfidence} Media confianza`}
            color="warning"
            size="small"
          />
          <Chip
            icon={<Error />}
            label={`${stats.lowConfidence} Baja confianza`}
            color="error"
            size="small"
          />
        </Box>
      </Paper>

      {/* Fields list */}
      <Paper sx={{ flex: 1, overflow: 'hidden' }}>
        <List sx={{ overflow: 'auto', maxHeight: '100%' }}>
          {fields.map((field) => (
            <React.Fragment key={field.fieldId}>
              <ListItem
                disablePadding
                sx={{
                  backgroundColor: selectedFieldId === field.fieldId ? 'action.selected' : 'transparent',
                }}
              >
                <ListItemButton onClick={() => onFieldSelect(field)}>
                  <ListItemIcon>
                    {getFieldIcon(field)}
                  </ListItemIcon>
                  <ListItemText
                    primary={field.displayName}
                    secondary={
                      <Box>
                        <Typography variant="caption" component="div">
                          Tipo: {fieldTypes.find(t => t.value === field.fieldType)?.label || field.fieldType}
                        </Typography>
                        <Typography variant="caption" component="div">
                          Confianza: {Math.round(field.confidence * 100)}%
                        </Typography>
                        {field.value && (
                          <Typography variant="caption" component="div" sx={{ fontStyle: 'italic' }}>
                            "{field.value}"
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
              
              {/* Field details accordion */}
              {selectedFieldId === field.fieldId && (
                <Accordion expanded sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle2">
                      Detalles del Campo
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {editingField === field.fieldId ? (
                      // Edit mode
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                          fullWidth
                          label="Nombre del Campo"
                          value={editForm.displayName || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                          size="small"
                        />
                        
                        <TextField
                          select
                          fullWidth
                          label="Tipo de Campo"
                          value={editForm.fieldType || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, fieldType: e.target.value }))}
                          size="small"
                        >
                          {fieldTypes.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          fullWidth
                          label="Valor Detectado"
                          value={editForm.value || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, value: e.target.value }))}
                          size="small"
                          multiline
                          rows={2}
                        />

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Save />}
                            onClick={saveEditing}
                          >
                            Guardar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Cancel />}
                            onClick={cancelEditing}
                          >
                            Cancelar
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      // View mode
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          <strong>Página:</strong> {field.pageNumber}
                        </Typography>
                        
                        <Typography variant="body2" gutterBottom>
                          <strong>Confianza:</strong> 
                          <Chip
                            label={`${Math.round(field.confidence * 100)}%`}
                            color={getConfidenceColor(field.confidence)}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                        
                        <Typography variant="body2" gutterBottom>
                          <strong>Tipo:</strong> {fieldTypes.find(t => t.value === field.fieldType)?.label || field.fieldType}
                        </Typography>
                        
                        {field.value && (
                          <Typography variant="body2" gutterBottom>
                            <strong>Valor:</strong> "{field.value}"
                          </Typography>
                        )}

                        {/* Coordenadas Section */}
                        <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main' }}>
                            📍 Información de Posición
                          </Typography>
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.875rem' }}>
                            <Typography variant="body2">
                              <strong>Coordenada X:</strong> {field.boundingBox[0]}px
                            </Typography>
                            <Typography variant="body2">
                              <strong>Coordenada Y:</strong> {field.boundingBox[1]}px
                            </Typography>
                            <Typography variant="body2">
                              <strong>Ancho:</strong> {field.boundingBox[2]}px
                            </Typography>
                            <Typography variant="body2">
                              <strong>Alto:</strong> {field.boundingBox[3]}px
                            </Typography>
                          </Box>

                          <Typography variant="caption" sx={{ 
                            display: 'block', 
                            mt: 1, 
                            color: 'text.secondary',
                            fontStyle: 'italic'
                          }}>
                            Posición: ({field.boundingBox[0]}, {field.boundingBox[1]}) | 
                            Tamaño: {field.boundingBox[2]} × {field.boundingBox[3]}px
                          </Typography>

                          {/* Capacity info if available */}
                          {field.capacity && (
                            <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="subtitle2" gutterBottom sx={{ color: 'secondary.main' }}>
                                📏 Análisis de Capacidad
                              </Typography>
                              
                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.875rem' }}>
                                <Typography variant="body2">
                                  <strong>Max. Caracteres:</strong> {field.capacity.maxCharacters}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Chars/Línea:</strong> {field.capacity.charactersPerLine}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Max. Líneas:</strong> {field.capacity.maxLines}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Fuente:</strong> {field.capacity.fontSize}px
                                </Typography>
                              </Box>

                              {field.capacity.conflictsWith && field.capacity.conflictsWith.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <Chip
                                    label={`${field.capacity.conflictsWith.length} conflicto(s)`}
                                    color="warning"
                                    size="small"
                                    sx={{ fontSize: '0.75rem' }}
                                  />
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                        
                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => startEditing(field)}
                            sx={{ flex: 1 }}
                          >
                            Editar Campo
                          </Button>
                          
                          {onFieldDelete && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<Delete />}
                              onClick={() => handleDeleteClick(field)}
                              sx={{ 
                                flex: 1,
                                '&:hover': {
                                  backgroundColor: 'error.main',
                                  color: 'white',
                                }
                              }}
                            >
                              Eliminar
                            </Button>
                          )}
                        </Box>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              )}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Actions */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Acciones de Validación
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            color="success" 
            size="small"
            onClick={onApprove}
            disabled={isProcessing}
          >
            {isProcessing ? 'Procesando...' : 'Aprobar Plantilla'}
          </Button>
          <Button 
            variant="outlined" 
            color="warning" 
            size="small"
            onClick={onMarkForReview}
            disabled={isProcessing}
          >
            Marcar para Revisión
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            size="small"
            onClick={onReject}
            disabled={isProcessing}
          >
            Rechazar
          </Button>
        </Box>
      </Paper>

      {/* Delete Field Dialog */}
      <DeleteFieldDialog
        open={deleteDialogOpen}
        field={fieldToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Box>
  );
};