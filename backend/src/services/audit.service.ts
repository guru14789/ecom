import { query } from '../config/postgres';

export interface AuditLogEntry {
  actorId: string;
  actorType: 'admin' | 'vendor' | 'system' | 'buyer';
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO activity_log (actor_id, actor_type, action, resource_type, resource_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        entry.actorId,
        entry.actorType,
        entry.action,
        entry.resourceType,
        entry.resourceId,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
      ]
    );
  } catch (err) {
    console.error('Audit log write failed (non-fatal):', err);
  }
}
