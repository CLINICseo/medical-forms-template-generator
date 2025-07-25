import { apiClient } from './client';
import { FieldDetection } from '../../components/pdf/PDFViewer';

export interface ExportRequest {
  documentId: string;
  format: 'json' | 'xml' | 'pdf-template';
  fields: FieldDetection[];
  includeCoordinates?: boolean;
  includeMedicalMetadata?: boolean;
}

export interface ExportResult {
  downloadUrl: string;
  fileName: string;
  format: string;
  fileSize: number;
  exportedAt: string;
}

export interface ExportResponse {
  success: boolean;
  data: ExportResult;
}

class ExportService {
  async exportTemplate(request: ExportRequest): Promise<ExportResult> {
    try {
      const response = await apiClient.post<ExportResponse>(`/export/${request.documentId}`, {
        format: request.format,
        fields: request.fields,
        includeCoordinates: request.includeCoordinates ?? true,
        includeMedicalMetadata: request.includeMedicalMetadata ?? true
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error('Export failed: Invalid response format');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Export failed: Unknown error');
    }
  }

  async downloadExport(downloadUrl: string, fileName: string): Promise<void> {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error('Failed to download exported file');
    }
  }

  async exportAndDownload(request: ExportRequest): Promise<void> {
    const result = await this.exportTemplate(request);
    await this.downloadExport(result.downloadUrl, result.fileName);
  }
}

export const exportService = new ExportService();