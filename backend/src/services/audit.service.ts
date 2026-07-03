import { logAudit } from '../lib/firestore/audit';

export interface AuditParams {
  actorId: string;
  actorType: 'buyer' | 'vendor' | 'admin' | 'system';
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Log an audit event to Firestore audit_log collection.
 * Non-blocking — errors are swallowed to avoid breaking request flow.
 */
export function auditLog(params: AuditParams): void {
  logAudit(params).catch((err) =>
    console.error('Audit log error:', err)
  );
}

export default auditLog;
