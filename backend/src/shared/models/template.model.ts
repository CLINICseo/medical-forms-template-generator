import { DocumentTemplate, TemplateField } from "../types/document";
import { cosmosDB } from "../services/cosmos-db/config";
import { Container } from "@azure/cosmos";

export interface TemplateCreateInput {
  documentType: string;
  insurerName: string;
  fields: TemplateField[];
  metadata?: Record<string, any>;
}

export interface TemplateUpdateInput {
  fields?: TemplateField[];
  status?: DocumentTemplate["status"];
  metadata?: Record<string, any>;
}

export class TemplateModel {
  private container: Container;

  constructor() {
    this.container = cosmosDB.getTemplatesContainer();
  }

  async create(input: TemplateCreateInput): Promise<DocumentTemplate> {
    const template: DocumentTemplate = {
      templateId: this.generateTemplateId(input.insurerName, input.documentType),
      documentType: input.documentType,
      insurerName: input.insurerName,
      version: "1.0.0",
      fields: input.fields,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "draft",
      ...input.metadata
    };

    const { resource } = await this.container.items.create(template);
    return resource as DocumentTemplate;
  }

  async findById(templateId: string, insurerName: string): Promise<DocumentTemplate | null> {
    try {
      const { resource } = await this.container
        .item(templateId, insurerName)
        .read<DocumentTemplate>();
      
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async findByInsurer(insurerName: string): Promise<DocumentTemplate[]> {
    const query = {
      query: "SELECT * FROM c WHERE c.insurerName = @insurerName ORDER BY c.updatedAt DESC",
      parameters: [
        { name: "@insurerName", value: insurerName }
      ]
    };

    const { resources } = await this.container.items
      .query<DocumentTemplate>(query)
      .fetchAll();

    return resources;
  }

  async findByDocumentType(documentType: string): Promise<DocumentTemplate[]> {
    const query = {
      query: "SELECT * FROM c WHERE c.documentType = @documentType ORDER BY c.insurerName",
      parameters: [
        { name: "@documentType", value: documentType }
      ]
    };

    const { resources } = await this.container.items
      .query<DocumentTemplate>(query)
      .fetchAll();

    return resources;
  }

  async update(
    templateId: string, 
    insurerName: string, 
    updates: TemplateUpdateInput
  ): Promise<DocumentTemplate> {
    const existing = await this.findById(templateId, insurerName);
    
    if (!existing) {
      throw new Error(`Template ${templateId} not found`);
    }

    const updated: DocumentTemplate = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: this.incrementVersion(existing.version)
    };

    const { resource } = await this.container
      .item(templateId, insurerName)
      .replace(updated);

    return resource as DocumentTemplate;
  }

  async updateStatus(
    templateId: string, 
    insurerName: string, 
    status: DocumentTemplate["status"]
  ): Promise<DocumentTemplate> {
    return this.update(templateId, insurerName, { status });
  }

  async delete(templateId: string, insurerName: string): Promise<void> {
    await this.container
      .item(templateId, insurerName)
      .delete();
  }

  async search(filters: {
    insurerName?: string;
    documentType?: string;
    status?: DocumentTemplate["status"];
  }): Promise<DocumentTemplate[]> {
    let query = "SELECT * FROM c WHERE 1=1";
    const parameters: any[] = [];

    if (filters.insurerName) {
      query += " AND c.insurerName = @insurerName";
      parameters.push({ name: "@insurerName", value: filters.insurerName });
    }

    if (filters.documentType) {
      query += " AND c.documentType = @documentType";
      parameters.push({ name: "@documentType", value: filters.documentType });
    }

    if (filters.status) {
      query += " AND c.status = @status";
      parameters.push({ name: "@status", value: filters.status });
    }

    query += " ORDER BY c.updatedAt DESC";

    const { resources } = await this.container.items
      .query<DocumentTemplate>({ query, parameters })
      .fetchAll();

    return resources;
  }

  private generateTemplateId(insurerName: string, documentType: string): string {
    const sanitizedInsurer = insurerName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const sanitizedType = documentType.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const timestamp = Date.now();
    return `template_${sanitizedInsurer}_${sanitizedType}_${timestamp}`;
  }

  private incrementVersion(version: string): string {
    const parts = version.split(".");
    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }
}

// Export singleton instance
export const templateModel = new TemplateModel();