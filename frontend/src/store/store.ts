import { configureStore } from '@reduxjs/toolkit';
import { documentsSlice } from './slices/documentsSlice';
import { uiSlice } from './slices/uiSlice';
import errorReducer from './slices/errorSlice';

export const store = configureStore({
  reducer: {
    documents: documentsSlice.reducer,
    ui: uiSlice.reducer,
    error: errorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;