import { cosmosDB } from "../services/cosmos-db/config";
import { Container } from "@azure/cosmos";

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export enum AuditAction {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  UPLOAD = "upload",
  DOWNLOAD = "download",
  ANALYZE = "analyze",
  VALIDATE = "validate",
  APPROVE = "approve",
  REJECT = "reject"
}

export enum ResourceType {
  TEMPLATE = "template",
  DOCUMENT = "document",
  USER = "user",
  FIELD = "field"
}

export interface AuditCreateInput {
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditModel {
  private container: Container;

  constructor() {
    this.container = cosmosDB.getAuditsContainer();
  }

  async create(input: AuditCreateInput): Promise<AuditLog> {
    const audit: AuditLog = {
      id: this.generateAuditId(),
      userId: input.userId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      details: input.details || {},
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      timestamp: new Date().toISOString()
    };

    const { resource } = await this.container.items.create(audit);
    return resource as AuditLog;
  }

  async findByUser(userId: string, limit: number = 50): Promise<AuditLog[]> {
    const query = {
      query: "SELECT TOP @limit * FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC",
      parameters: [
        { name: "@userId", value: userId },
        { name: "@limit", value: limit }
      ]
    };

    const { resources } = await this.container.items
      .query<AuditLog>(query)
      .fetchAll();

    return resources;
  }

  async findByResource(
    resourceType: ResourceType, 
    resourceId: string, 
    limit: number = 50
  ): Promise<AuditLog[]> {
    const query = {
      query: `
        SELECT TOP @limit * FROM c 
        WHERE c.resourceType = @resourceType 
        AND c.resourceId = @resourceId 
        ORDER BY c.timestamp DESC
      `,
      parameters: [
        { name: "@resourceType", value: resourceType },
        { name: "@resourceId", value: resourceId },
        { name: "@limit", value: limit }
      ]
    };

    const { resources } = await this.container.items
      .query<AuditLog>(query)
      .fetchAll();

    return resources;
  }

  async findByDateRange(
    startDate: Date, 
    endDate: Date, 
    filters?: {
      userId?: string;
      action?: AuditAction;
      resourceType?: ResourceType;
    }
  ): Promise<AuditLog[]> {
    let query = `
      SELECT * FROM c 
      WHERE c.timestamp >= @startDate 
      AND c.timestamp <= @endDate
    `;
    
    const parameters: any[] = [
      { name: "@startDate", value: startDate.toISOString() },
      { name: "@endDate", value: endDate.toISOString() }
    ];

    if (filters?.userId) {
      query += " AND c.userId = @userId";
      parameters.push({ name: "@userId", value: filters.userId });
    }

    if (filters?.action) {
      query += " AND c.action = @action";
      parameters.push({ name: "@action", value: filters.action });
    }

    if (filters?.resourceType) {
      query += " AND c.resourceType = @resourceType";
      parameters.push({ name: "@resourceType", value: filters.resourceType });
    }

    query += " ORDER BY c.timestamp DESC";

    const { resources } = await this.container.items
      .query<AuditLog>({ query, parameters })
      .fetchAll();

    return resources;
  }

  async getActivitySummary(userId: string, days: number = 30): Promise<{
    totalActions: number;
    actionBreakdown: Record<string, number>;
    recentActivity: AuditLog[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = {
      query: `
        SELECT 
          COUNT(1) as totalActions,
          c.action
        FROM c 
        WHERE c.userId = @userId 
        AND c.timestamp >= @startDate
        GROUP BY c.action
      `,
      parameters: [
        { name: "@userId", value: userId },
        { name: "@startDate", value: startDate.toISOString() }
      ]
    };

    const { resources: actionCounts } = await this.container.items
      .query(query)
      .fetchAll();

    const actionBreakdown = actionCounts.reduce((acc, item) => {
      acc[item.action] = item.totalActions;
      return acc;
    }, {} as Record<string, number>);

    const totalActions = Object.values(actionBreakdown).reduce((sum, count) => sum + count, 0);

    const recentActivity = await this.findByUser(userId, 10);

    return {
      totalActions,
      actionBreakdown,
      recentActivity
    };
  }

  private generateAuditId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `audit_${timestamp}_${random}`;
  }
}

// Export singleton instance
export const auditModel = new AuditModel();