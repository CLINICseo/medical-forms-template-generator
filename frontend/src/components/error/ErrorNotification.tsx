import React, { useEffect } from 'react';
import { Alert, AlertTitle, Snackbar, IconButton, Collapse } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { 
  selectActiveErrors, 
  dismissError, 
  clearDismissedErrors 
} from '../../store/slices/errorSlice';
import { ErrorType } from '../../utils/errorHandler';

/**
 * Maps error types to MUI Alert severity
 */
const getAlertSeverity = (errorType: ErrorType): 'error' | 'warning' | 'info' => {
  switch (errorType) {
    case ErrorType.VALIDATION_ERROR:
    case ErrorType.NOT_FOUND_ERROR:
      return 'warning';
    case ErrorType.NETWORK_ERROR:
    case ErrorType.TIMEOUT_ERROR:
      return 'info';
    default:
      return 'error';
  }
};

/**
 * Maps error types to alert titles
 */
const getAlertTitle = (errorType: ErrorType): string => {
  switch (errorType) {
    case ErrorType.NETWORK_ERROR:
      return 'Error de Conexión';
    case ErrorType.VALIDATION_ERROR:
      return 'Datos Inválidos';
    case ErrorType.AUTHENTICATION_ERROR:
      return 'Error de Autenticación';
    case ErrorType.PERMISSION_ERROR:
      return 'Sin Permisos';
    case ErrorType.NOT_FOUND_ERROR:
      return 'No Encontrado';
    case ErrorType.TIMEOUT_ERROR:
      return 'Tiempo de Espera Agotado';
    case ErrorType.API_ERROR:
      return 'Error del Servidor';
    default:
      return 'Error';
  }
};

/**
 * Global error notification component
 */
export const ErrorNotification: React.FC = () => {
  const dispatch = useDispatch();
  const activeErrors = useSelector(selectActiveErrors);
  
  // Clean up dismissed errors periodically
  useEffect(() => {
    const timer = setInterval(() => {
      dispatch(clearDismissedErrors());
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(timer);
  }, [dispatch]);
  
  // Auto-dismiss informational errors after 6 seconds
  useEffect(() => {
    activeErrors.forEach(notification => {
      if (notification.error.type === ErrorType.NETWORK_ERROR || 
          notification.error.type === ErrorType.TIMEOUT_ERROR) {
        setTimeout(() => {
          dispatch(dismissError(notification.id));
        }, 6000);
      }
    });
  }, [activeErrors, dispatch]);
  
  if (activeErrors.length === 0) {
    return null;
  }
  
  // Show only the most recent error as a snackbar
  const mostRecentError = activeErrors[activeErrors.length - 1];
  
  return (
    <Snackbar
      open={true}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ mt: 8 }}
    >
      <Alert
        severity={getAlertSeverity(mostRecentError.error.type)}
        variant="filled"
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={() => dispatch(dismissError(mostRecentError.id))}
          >
            <Close fontSize="inherit" />
          </IconButton>
        }
        sx={{ minWidth: 300, maxWidth: 600 }}
      >
        <AlertTitle>{getAlertTitle(mostRecentError.error.type)}</AlertTitle>
        {mostRecentError.error.message}
        
        {process.env.NODE_ENV === 'development' && mostRecentError.error.details && (
          <details style={{ marginTop: 8, fontSize: '0.85em' }}>
            <summary style={{ cursor: 'pointer' }}>Detalles (Dev)</summary>
            <pre style={{ margin: 4, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(mostRecentError.error.details, null, 2)}
            </pre>
          </details>
        )}
      </Alert>
    </Snackbar>
  );
};

/**
 * Component to show all active errors in a list
 */
export const ErrorList: React.FC = () => {
  const dispatch = useDispatch();
  const activeErrors = useSelector(selectActiveErrors);
  
  if (activeErrors.length === 0) {
    return null;
  }
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 80, 
      right: 20, 
      maxWidth: 400, 
      zIndex: 1400 
    }}>
      {activeErrors.map((notification, index) => (
        <Collapse 
          key={notification.id} 
          in={!notification.dismissed}
          timeout={300}
        >
          <Alert
            severity={getAlertSeverity(notification.error.type)}
            variant="standard"
            onClose={() => dispatch(dismissError(notification.id))}
            sx={{ 
              mb: 1, 
              boxShadow: 2,
              ...(index > 0 && { opacity: 0.9 - (index * 0.1) })
            }}
          >
            <AlertTitle>{getAlertTitle(notification.error.type)}</AlertTitle>
            {notification.error.message}
          </Alert>
        </Collapse>
      ))}
    </div>
  );
};