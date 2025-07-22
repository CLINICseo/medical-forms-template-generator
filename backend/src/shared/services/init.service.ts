import { cosmosDB } from "./cosmos-db/config";
import { blobStorage } from "./blob-storage/storage.service";

class InitializationService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log("Initializing services...");

      // Initialize Cosmos DB
      console.log("Initializing Cosmos DB...");
      await cosmosDB.initialize();
      console.log("Cosmos DB initialized successfully");

      // Initialize Blob Storage
      console.log("Initializing Blob Storage...");
      await blobStorage.initialize();
      console.log("Blob Storage initialized successfully");

      this.initialized = true;
      console.log("All services initialized successfully");
    } catch (error) {
      console.error("Failed to initialize services:", error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const initService = new InitializationService();