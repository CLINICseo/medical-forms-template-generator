import { CosmosClient, Database, Container } from "@azure/cosmos";

export interface CosmosConfig {
  endpoint: string;
  key: string;
  databaseId: string;
  containers: {
    templates: string;
    documents: string;
    audits: string;
  };
}

export class CosmosDBService {
  private client: CosmosClient;
  private database: Database;
  private config: CosmosConfig;

  constructor() {
    this.config = {
      endpoint: process.env.COSMOS_DB_ENDPOINT || "",
      key: process.env.COSMOS_DB_KEY || "",
      databaseId: process.env.COSMOS_DB_DATABASE || "medical-forms",
      containers: {
        templates: "templates",
        documents: "documents",
        audits: "audits"
      }
    };

    if (!this.config.endpoint || !this.config.key) {
      throw new Error("Cosmos DB connection settings not configured");
    }

    this.client = new CosmosClient({
      endpoint: this.config.endpoint,
      key: this.config.key
    });

    this.database = this.client.database(this.config.databaseId);
  }

  async initialize(): Promise<void> {
    try {
      // Create database if it doesn't exist
      await this.client.databases.createIfNotExists({
        id: this.config.databaseId
      });

      // Create containers if they don't exist
      await this.createContainerIfNotExists(this.config.containers.templates, "/insurerName");
      await this.createContainerIfNotExists(this.config.containers.documents, "/documentType");
      await this.createContainerIfNotExists(this.config.containers.audits, "/userId");

    } catch (error) {
      console.error("Error initializing Cosmos DB:", error);
      throw error;
    }
  }

  private async createContainerIfNotExists(containerId: string, partitionKey: string): Promise<void> {
    await this.database.containers.createIfNotExists({
      id: containerId,
      partitionKey: {
        paths: [partitionKey]
      },
      defaultTtl: containerId === "audits" ? 2592000 : -1 // 30 days TTL for audits
    });
  }

  getContainer(containerName: keyof CosmosConfig["containers"]): Container {
    return this.database.container(this.config.containers[containerName]);
  }

  getTemplatesContainer(): Container {
    return this.getContainer("templates");
  }

  getDocumentsContainer(): Container {
    return this.getContainer("documents");
  }

  getAuditsContainer(): Container {
    return this.getContainer("audits");
  }
}

// Export singleton instance
export const cosmosDB = new CosmosDBService();