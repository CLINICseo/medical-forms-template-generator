import { BlobServiceClient, ContainerClient, BlobClient, BlockBlobClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import { sanitizeFilename } from "../../utils/validation";

export interface UploadResult {
  blobUrl: string;
  blobName: string;
  containerName: string;
  contentType: string;
  size: number;
}

export interface SasTokenOptions {
  expiresInMinutes?: number;
  permissions?: string;
}

export class BlobStorageService {
  private blobServiceClient: BlobServiceClient;
  private containers = {
    uploads: "pdf-uploads",
    templates: "templates",
    processed: "processed-documents",
    temp: "temp-processing"
  };

  constructor() {
    const connectionString = process.env.STORAGE_CONNECTION_STRING;
    
    if (!connectionString) {
      throw new Error("Storage connection string not configured");
    }

    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  async initialize(): Promise<void> {
    // Create containers if they don't exist
    for (const containerName of Object.values(this.containers)) {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      await containerClient.createIfNotExists({
        access: "blob" // Allow public read access to blobs
      });
    }
  }

  async uploadPdf(
    fileBuffer: Buffer,
    fileName: string,
    userId: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    const sanitizedFileName = sanitizeFilename(fileName);
    const blobName = this.generateBlobName(userId, sanitizedFileName);
    const containerClient = this.getContainerClient("uploads");
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload file with metadata
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: "application/pdf"
      },
      metadata: {
        ...metadata,
        userId,
        originalFileName: fileName,
        uploadedAt: new Date().toISOString()
      }
    });

    return {
      blobUrl: blockBlobClient.url,
      blobName,
      containerName: this.containers.uploads,
      contentType: "application/pdf",
      size: fileBuffer.length
    };
  }

  async downloadBlob(containerName: string, blobName: string): Promise<Buffer> {
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    
    const downloadResponse = await blobClient.download();
    
    if (!downloadResponse.readableStreamBody) {
      throw new Error("Failed to download blob");
    }

    return this.streamToBuffer(downloadResponse.readableStreamBody);
  }

  async deleteBlob(containerName: string, blobName: string): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    
    await blobClient.deleteIfExists();
  }

  async moveBlob(
    sourceBlobName: string,
    sourceContainer: string,
    destinationContainer: string
  ): Promise<string> {
    const sourceContainerClient = this.blobServiceClient.getContainerClient(sourceContainer);
    const sourceBlobClient = sourceContainerClient.getBlobClient(sourceBlobName);
    
    const destinationContainerClient = this.blobServiceClient.getContainerClient(destinationContainer);
    const destinationBlobClient = destinationContainerClient.getBlobClient(sourceBlobName);

    // Copy blob to destination
    await destinationBlobClient.beginCopyFromURL(sourceBlobClient.url);
    
    // Delete from source after successful copy
    await sourceBlobClient.deleteIfExists();

    return destinationBlobClient.url;
  }

  async generateSasUrl(
    containerName: string,
    blobName: string,
    options: SasTokenOptions = {}
  ): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    // This is a placeholder - in production, you would use generateBlobSASQueryParameters
    // For now, return the blob URL
    return blobClient.url;
  }

  async listBlobsByUser(userId: string, containerName?: string): Promise<string[]> {
    const container = containerName || this.containers.uploads;
    const containerClient = this.blobServiceClient.getContainerClient(container);
    const blobs: string[] = [];

    // List all blobs with prefix matching userId
    const prefix = `${userId}/`;
    
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      blobs.push(blob.name);
    }

    return blobs;
  }

  async getBlobMetadata(containerName: string, blobName: string): Promise<Record<string, string>> {
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    
    const properties = await blobClient.getProperties();
    return properties.metadata || {};
  }

  async validatePdfFile(fileBuffer: Buffer, maxSizeInMB: number = 10): Promise<{
    isValid: boolean;
    error?: string;
  }> {
    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (fileBuffer.length > maxSizeInBytes) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${maxSizeInMB}MB`
      };
    }

    // Check if it's a valid PDF (basic check)
    const pdfHeader = fileBuffer.slice(0, 5).toString();
    if (!pdfHeader.startsWith("%PDF-")) {
      return {
        isValid: false,
        error: "Invalid PDF file format"
      };
    }

    return { isValid: true };
  }

  private getContainerClient(containerType: keyof typeof this.containers): ContainerClient {
    const containerName = this.containers[containerType];
    return this.blobServiceClient.getContainerClient(containerName);
  }

  private generateBlobName(userId: string, fileName: string): string {
    const timestamp = Date.now();
    const uniqueId = uuidv4().substring(0, 8);
    return `${userId}/${timestamp}_${uniqueId}_${fileName}`;
  }

  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      readableStream.on("data", (chunk) => {
        chunks.push(Buffer.from(chunk));
      });
      
      readableStream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      
      readableStream.on("error", reject);
    });
  }
}

// Export singleton instance
export const blobStorage = new BlobStorageService();