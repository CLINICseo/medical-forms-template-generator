import { apiClient } from './client';
import { ErrorHandler, ApplicationError, ErrorType } from '../../utils/errorHandler';

export interface UploadDocumentParams {
  file: File;
  documentType: string;
  insurerName: string;
  description?: string;
}

export interface UploadResponse {
  success: boolean;
  data: {
    documentId: string;
    fileName: string;
    status: string;
    message: string;
    fileSize: number;
    blobUrl?: string;
  };
  error?: {
    message: string;
    code?: string;
  };
}

class UploadService {
  async uploadDocument(params: UploadDocumentParams): Promise<UploadResponse['data']> {
    try {
      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (params.file.size > maxSize) {
        throw new ApplicationError(
          ErrorType.VALIDATION_ERROR,
          'El archivo es demasiado grande. El tamaño máximo permitido es 50MB.',
          413,
          { fileSize: params.file.size, maxSize }
        );
      }

      // Validate file type
      if (params.file.type !== 'application/pdf') {
        throw new ApplicationError(
          ErrorType.VALIDATION_ERROR,
          'Tipo de archivo no válido. Solo se permiten archivos PDF.',
          415,
          { fileType: params.file.type }
        );
      }

      // Convert file to binary data for Azure Functions
      const fileBuffer = await this.fileToArrayBuffer(params.file);
      
      // Azure Functions expects binary data directly
      const response = await apiClient.post<UploadResponse>('/upload', fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'X-Document-Type': params.documentType,
          'X-Insurer-Name': params.insurerName,
          'X-Description': params.description || '',
          'X-File-Name': params.file.name,
        },
      });

      if (response.success) {
        return response.data;
      } else {
        throw new ApplicationError(
          ErrorType.API_ERROR,
          response.error?.message || 'Error al cargar el documento',
          500
        );
      }
    } catch (error) {
      // If it's already an ApplicationError, re-throw it
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      // Otherwise, parse the API error
      throw ErrorHandler.handleUploadError(error);
    }
  }

  async uploadWithProgress(
    params: UploadDocumentParams
  ): Promise<UploadResponse['data']> {
    // For simplicity, use the basic upload method
    // In a real implementation, you would implement progress tracking
    return this.uploadDocument(params);
  }

  private async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private getCurrentUserId(): string {
    // TODO: Get from auth context
    return 'user_123'; // Placeholder
  }
}

export const uploadService = new UploadService();