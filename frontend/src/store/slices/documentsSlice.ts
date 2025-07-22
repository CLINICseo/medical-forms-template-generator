import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DocumentState {
  documentId: string;
  fileName: string;
  documentType: string;
  insurerName: string;
  status: 'uploading' | 'analyzing' | 'validating' | 'completed' | 'error';
  uploadProgress: number;
  analysisResult?: any;
  createdAt: string;
}

interface DocumentsState {
  documents: Record<string, DocumentState>;
  currentDocument: string | null;
  recentDocuments: string[];
}

const initialState: DocumentsState = {
  documents: {},
  currentDocument: null,
  recentDocuments: [],
};

export const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    addDocument: (state, action: PayloadAction<DocumentState>) => {
      const doc = action.payload;
      state.documents[doc.documentId] = doc;
      state.recentDocuments.unshift(doc.documentId);
      // Keep only last 10 recent documents
      if (state.recentDocuments.length > 10) {
        state.recentDocuments = state.recentDocuments.slice(0, 10);
      }
    },
    updateDocument: (
      state,
      action: PayloadAction<{ documentId: string; updates: Partial<DocumentState> }>
    ) => {
      const { documentId, updates } = action.payload;
      if (state.documents[documentId]) {
        state.documents[documentId] = { ...state.documents[documentId], ...updates };
      }
    },
    setCurrentDocument: (state, action: PayloadAction<string | null>) => {
      state.currentDocument = action.payload;
    },
    updateUploadProgress: (
      state,
      action: PayloadAction<{ documentId: string; progress: number }>
    ) => {
      const { documentId, progress } = action.payload;
      if (state.documents[documentId]) {
        state.documents[documentId].uploadProgress = progress;
      }
    },
    setAnalysisResult: (
      state,
      action: PayloadAction<{ documentId: string; result: any }>
    ) => {
      const { documentId, result } = action.payload;
      if (state.documents[documentId]) {
        state.documents[documentId].analysisResult = result;
        state.documents[documentId].status = 'validating';
      }
    },
  },
});

export const {
  addDocument,
  updateDocument,
  setCurrentDocument,
  updateUploadProgress,
  setAnalysisResult,
} = documentsSlice.actions;