import { apiClient } from './client';

export interface HealthStatus {
  status: string;
  timestamp: string;
  message: string;
  environment: string;
  services: {
    documentIntelligence: boolean;
    storage: boolean;
    cosmosDB: boolean;
  };
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  message: string;
  environment: string;
  services: {
    documentIntelligence: boolean;
    storage: boolean;
    cosmosDB: boolean;
  };
}

class HealthService {
  async checkHealth(): Promise<HealthStatus> {
    try {
      console.log('Checking backend health...');
      
      const response = await apiClient.get<HealthResponse>('/health');
      
      console.log('Health check response:', response);
      
      return response;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Backend is not responding');
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.checkHealth();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const healthService = new HealthService();