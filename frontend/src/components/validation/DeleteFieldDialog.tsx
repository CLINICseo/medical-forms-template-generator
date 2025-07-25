import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  Warning,
  Delete,
  Cancel,
} from '@mui/icons-material';
import { FieldDetection } from '../pdf/PDFViewer';

interface DeleteFieldDialogProps {
  open: boolean;
  field: FieldDetection | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteFieldDialog: React.FC<DeleteFieldDialogProps> = ({
  open,
  field,
  onConfirm,
  onCancel,
}) => {
  if (!field) return null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'Alta';
    if (confidence >= 0.6) return 'Media';
    return 'Baja';
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        pb: 1
      }}>
        <Warning color="warning" />
        <Typography variant="h6">
          Confirmar Eliminación de Campo
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>¿Estás seguro de que deseas eliminar este campo?</strong>
            <br />
            Esta acción no se puede deshacer y el campo se eliminará permanentemente de la plantilla.
          </Typography>
        </Alert>

        {/* Field Information */}
        <Box sx={{ p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            📋 Información del Campo
          </Typography>

          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Nombre del Campo:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {field.displayName}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Tipo:
              </Typography>
              <Chip
                label={field.fieldType.toUpperCase()}
                size="small"
                color="default"
                variant="outlined"
              />
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Confianza de Detección:
              </Typography>
              <Chip
                label={`${Math.round(field.confidence * 100)}% (${getConfidenceLabel(field.confidence)})`}
                size="small"
                color={getConfidenceColor(field.confidence)}
              />
            </Box>

            {field.value && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Valor Detectado:
                </Typography>
                <Typography variant="body1" sx={{ 
                  fontStyle: 'italic',
                  backgroundColor: 'action.hover',
                  padding: 1,
                  borderRadius: 1,
                  wordBreak: 'break-word'
                }}>
                  "{field.value}"
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 1 }} />

            <Box>
              <Typography variant="body2" color="text.secondary">
                Posición en el Documento:
              </Typography>
              <Typography variant="body2">
                Página {field.pageNumber} | Coordenadas: ({field.boundingBox[0]}, {field.boundingBox[1]}) | 
                Tamaño: {field.boundingBox[2]} × {field.boundingBox[3]}px
              </Typography>
            </Box>

            {field.capacity && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Capacidad Calculada:
                </Typography>
                <Typography variant="body2">
                  {field.capacity.maxCharacters} caracteres máximo 
                  ({field.capacity.charactersPerLine} chars/línea × {field.capacity.maxLines} líneas)
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Warning for low confidence fields */}
        {field.confidence < 0.6 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Campo de baja confianza:</strong> Este campo fue detectado con baja confianza 
              ({Math.round(field.confidence * 100)}%). Es probable que sea un falso positivo y 
              su eliminación mejore la calidad de la plantilla.
            </Typography>
          </Alert>
        )}

        {/* Warning for high confidence fields */}
        {field.confidence >= 0.8 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Campo de alta confianza:</strong> Este campo fue detectado con alta confianza 
              ({Math.round(field.confidence * 100)}%). Asegúrate de que realmente sea incorrecto 
              antes de eliminarlo.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          startIcon={<Cancel />}
          sx={{ minWidth: 120 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          startIcon={<Delete />}
          sx={{ minWidth: 120 }}
        >
          Eliminar Campo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteFieldDialog;