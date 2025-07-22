import { apiClient } from './client';

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
}

class UploadService {
  async uploadDocument(params: UploadDocumentParams): Promise<UploadResponse['data']> {
    try {
      console.log('Starting upload with params:', {
        fileName: params.file.name,
        fileSize: params.file.size,
        documentType: params.documentType,
        insurerName: params.insurerName
      });

      // Convert file to binary data for Azure Functions
      const fileBuffer = await this.fileToArrayBuffer(params.file);
      
      console.log('File converted to buffer, size:', fileBuffer.byteLength);

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

      console.log('Upload response:', response);

      if (response.success) {
        return response.data;
      } else {
        throw new Error('Upload failed: Invalid response format');
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Upload failed: Unknown error');
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