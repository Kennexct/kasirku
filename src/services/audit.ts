import { nowIso, uuidv7 } from '../lib/id';
import type { AuditEvent, Id } from '../types';
import { saveAndQueue } from './sync';

interface AuditInput {
  storeId: Id;
  actorId: Id;
  entity: string;
  entityId: Id;
  action: string;
  /** Never put PINs, recovery codes or hashes here. */
  payload?: Record<string, unknown>;
}

export async function writeAudit({ storeId, actorId, entity, entityId, action, payload = {} }: AuditInput): Promise<void> {
  const now = nowIso();
  const event: AuditEvent = { id: uuidv7(), storeId, createdAt: now, updatedAt: now, entity, entityId, action, actorId, payload };
  await saveAndQueue('auditEvents', event);
}
