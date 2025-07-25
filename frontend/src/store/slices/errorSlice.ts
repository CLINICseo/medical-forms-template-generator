import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppError, ErrorType } from '../../utils/errorHandler';

export interface ErrorNotification {
  id: string;
  error: AppError;
  dismissed: boolean;
  timestamp: Date;
}

export interface ErrorState {
  notifications: ErrorNotification[];
  globalError: AppError | null;
}

const initialState: ErrorState = {
  notifications: [],
  globalError: null
};

const errorSlice = createSlice({
  name: 'error',
  initialState,
  reducers: {
    addError: (state, action: PayloadAction<AppError>) => {
      const notification: ErrorNotification = {
        id: `${Date.now()}-${Math.random()}`,
        error: action.payload,
        dismissed: false,
        timestamp: new Date()
      };
      state.notifications.push(notification);
      
      // Keep only the last 10 notifications
      if (state.notifications.length > 10) {
        state.notifications = state.notifications.slice(-10);
      }
    },
    
    dismissError: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.dismissed = true;
      }
    },
    
    clearErrors: (state) => {
      state.notifications = [];
      state.globalError = null;
    },
    
    clearDismissedErrors: (state) => {
      state.notifications = state.notifications.filter(n => !n.dismissed);
    },
    
    setGlobalError: (state, action: PayloadAction<AppError | null>) => {
      state.globalError = action.payload;
    }
  }
});

export const {
  addError,
  dismissError,
  clearErrors,
  clearDismissedErrors,
  setGlobalError
} = errorSlice.actions;

export default errorSlice.reducer;

// Selectors
export const selectActiveErrors = (state: { error: ErrorState }) => 
  state.error.notifications.filter(n => !n.dismissed);

export const selectGlobalError = (state: { error: ErrorState }) => 
  state.error.globalError;

export const selectHasErrors = (state: { error: ErrorState }) => 
  state.error.notifications.some(n => !n.dismissed) || !!state.error.globalError;