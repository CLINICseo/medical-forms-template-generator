import { ExportService } from './exportService';

// Mock the BlobStorageService
jest.mock('../blob-storage/storage.service', () => ({
  BlobStorageService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    uploadData: jest.fn().mockResolvedValue({
      url: 'https://test-storage.blob.core.windows.net/exports/test-file.json',
      blobName: 'test-file.json'
    }),
    getContainerClient: jest.fn().mockReturnValue({
      createIfNotExists: jest.fn().mockResolvedValue({}),
      getBlockBlobClient: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({}),
        url: 'https://test-storage.blob.core.windows.net/exports/test-file.json'
      })
    })
  }))
}));

describe('ExportService', () => {
  let exportService: ExportService;
  
  const mockExportRequest = {
    documentId: 'test-doc-1',
    format: 'json' as const,
    fields: [
      {
        fieldId: 'field-1',
        fieldType: 'text',
        value: 'Juan Pérez',
        confidence: 0.95,
        boundingBox: [100, 200, 300, 220]
      }
    ],
    includeCoordinates: true,
    includeMedicalMetadata: true
  };

  beforeEach(() => {
    exportService = new ExportService();
  });

  describe('exportTemplate', () => {
    it('should export template successfully', async () => {
      const result = await exportService.exportTemplate(mockExportRequest);

      expect(result.downloadUrl).toContain('test-storage.blob.core.windows.net');
      expect(result.fileName).toContain('test-doc-1');
      expect(result.format).toBe('json');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.exportedAt).toBeDefined();
    });

    it('should handle different export formats', async () => {
      const xmlRequest = { ...mockExportRequest, format: 'xml' as const };
      const result = await exportService.exportTemplate(xmlRequest);

      expect(result.format).toBe('xml');
      expect(result.fileName).toContain('.xml');
    });

    it('should handle PDF format', async () => {
      const pdfRequest = { ...mockExportRequest, format: 'pdf-template' as const };
      const result = await exportService.exportTemplate(pdfRequest);

      expect(result.format).toBe('pdf-template');
      expect(result.fileName).toContain('.pdf');
    });
  });

  describe('error handling', () => {
    it('should handle missing document ID', async () => {
      const invalidRequest = { ...mockExportRequest, documentId: '' };

      await expect(exportService.exportTemplate(invalidRequest))
        .rejects.toThrow();
    });

    it('should handle empty fields array', async () => {
      const invalidRequest = { ...mockExportRequest, fields: [] };

      await expect(exportService.exportTemplate(invalidRequest))
        .rejects.toThrow();
    });
  });
});