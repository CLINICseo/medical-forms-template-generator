// Global test setup
import { jest } from '@jest/globals';

// Mock Azure services
jest.mock('@azure/functions', () => ({
  app: {
    http: jest.fn(),
  },
}));

jest.mock('@azure/ai-form-recognizer', () => ({
  DocumentAnalysisClient: jest.fn(),
  AzureKeyCredential: jest.fn(),
}));

jest.mock('@azure/cosmos', () => ({
  CosmosClient: jest.fn(),
}));

jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: jest.fn(),
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.AZURE_STORAGE_CONNECTION_STRING = 'test-connection';
process.env.DOCUMENT_INTELLIGENCE_ENDPOINT = 'https://test.cognitiveservices.azure.com/';
process.env.DOCUMENT_INTELLIGENCE_KEY = 'test-key';
process.env.COSMOS_DB_ENDPOINT = 'https://test.documents.azure.com:443/';
process.env.COSMOS_DB_KEY = 'test-key';

// Console spy setup
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};