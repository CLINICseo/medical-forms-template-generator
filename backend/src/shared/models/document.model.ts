import { AnalysisResult } from "../types/document";
import { cosmosDB } from "../services/cosmos-db/config";
import { Container } from "@azure/cosmos";

export interface DocumentRecord extends AnalysisResult {
  id: string;
  userId: string;
  templateId?: string;
  blobUrl: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  processedAt?: string;
}

export interface DocumentCreateInput {
  analysisResult: AnalysisResult;
  userId: string;
  blobUrl: string;
  fileName: string;
  fileSize: number;
}

export class DocumentModel {
  private container: Container;

  constructor() {
    this.container = cosmosDB.getDocumentsContainer();
  }

  async create(input: DocumentCreateInput): Promise<DocumentRecord> {
    const document: DocumentRecord = {
      ...input.analysisResult,
      id: input.analysisResult.documentId,
      userId: input.userId,
      blobUrl: input.blobUrl,
      fileName: input.fileName,
      fileSize: input.fileSize,
      createdAt: new Date().toISOString()
    };

    const { resource } = await this.container.items.create(document);
    return resource as DocumentRecord;
  }

  async findById(documentId: string, documentType: string): Promise<DocumentRecord | null> {
    try {
      const { resource } = await this.container
        .item(documentId, documentType)
        .read<DocumentRecord>();
      
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async findByUser(userId: string): Promise<DocumentRecord[]> {
    const query = {
      query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC",
      parameters: [
        { name: "@userId", value: userId }
      ]
    };

    const { resources } = await this.container.items
      .query<DocumentRecord>(query)
      .fetchAll();

    return resources;
  }

  async findByStatus(status: AnalysisResult["status"]): Promise<DocumentRecord[]> {
    const query = {
      query: "SELECT * FROM c WHERE c.status = @status ORDER BY c.createdAt DESC",
      parameters: [
        { name: "@status", value: status }
      ]
    };

    const { resources } = await this.container.items
      .query<DocumentRecord>(query)
      .fetchAll();

    return resources;
  }

  async update(
    documentId: string, 
    documentType: string, 
    updates: Partial<DocumentRecord>
  ): Promise<DocumentRecord> {
    const existing = await this.findById(documentId, documentType);
    
    if (!existing) {
      throw new Error(`Document ${documentId} not found`);
    }

    const updated: DocumentRecord = {
      ...existing,
      ...updates,
      processedAt: new Date().toISOString()
    };

    const { resource } = await this.container
      .item(documentId, documentType)
      .replace(updated);

    return resource as DocumentRecord;
  }

  async updateStatus(
    documentId: string, 
    documentType: string, 
    status: AnalysisResult["status"]
  ): Promise<DocumentRecord> {
    return this.update(documentId, documentType, { status });
  }

  async linkTemplate(
    documentId: string, 
    documentType: string, 
    templateId: string
  ): Promise<DocumentRecord> {
    return this.update(documentId, documentType, { templateId });
  }

  async delete(documentId: string, documentType: string): Promise<void> {
    await this.container
      .item(documentId, documentType)
      .delete();
  }

  async getRecentDocuments(limit: number = 10): Promise<DocumentRecord[]> {
    const query = {
      query: "SELECT TOP @limit * FROM c ORDER BY c.createdAt DESC",
      parameters: [
        { name: "@limit", value: limit }
      ]
    };

    const { resources } = await this.container.items
      .query<DocumentRecord>(query)
      .fetchAll();

    return resources;
  }

  async getStatsByUser(userId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
  }> {
    const query = {
      query: `
        SELECT 
          COUNT(1) as total,
          SUM(c.status = "completed" ? 1 : 0) as completed,
          SUM(c.status = "pending" ? 1 : 0) as pending,
          SUM(c.status = "failed" ? 1 : 0) as failed
        FROM c 
        WHERE c.userId = @userId
      `,
      parameters: [
        { name: "@userId", value: userId }
      ]
    };

    const { resources } = await this.container.items
      .query(query)
      .fetchAll();

    return resources[0] || { total: 0, completed: 0, pending: 0, failed: 0 };
  }
}

// Export singleton instance
export const documentModel = new DocumentModel();