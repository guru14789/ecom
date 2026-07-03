import { db, now } from './client';

export interface AuditEntry {
  actorId: string;
  actorType: 'buyer' | 'vendor' | 'admin' | 'system';
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('audit_log');

export async function logAudit(entry: Omit<AuditEntry, 'createdAt'>): Promise<void> {
  try {
    await col().add({ ...entry, createdAt: now() });
  } catch (err) {
    console.error('Audit log failed (non-fatal):', err);
  }
}

export async function getAuditLog(opts: { limit?: number; startAfter?: string } = {}) {
  let q = col().orderBy('createdAt', 'desc') as FirebaseFirestore.Query;
  if (opts.startAfter) {
    const cursor = await col().doc(opts.startAfter).get();
    q = q.startAfter(cursor);
  }
  const snap = await q.limit(opts.limit || 50).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
