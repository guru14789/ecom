import { query } from '../config/postgres';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

const IS_PROD = env.NODE_ENV === 'production';

const AUTH = {
  BASE: IS_PROD ? 'https://ltl-clients-api.delhivery.com' : 'https://ltl-clients-api-dev.delhivery.com',
  LOGIN: '/ums/login',
  LOGOUT: '/ums/logout',
  FORGOT_PASSWORD: '/forgot-password',
};

const SHIPMENT = {
  BASE: IS_PROD ? 'https://ltl-clients-api.delhivery.com' : 'https://ltl-clients-api-dev.delhivery.com',
  CREATE: '/manifest',
  UPDATE: (lnum: string) => `/lrn/update/${lnum}`,
  CANCEL: (lrn: string) => `/lrn/cancel/${lrn}`,
  TRACK: '/lrn/track',
  BOOK_APPOINTMENT: '/v2/appointments/lm',
};

const PINCODE = {
  BASE: IS_PROD ? 'https://ltl-clients-api.delhivery.com' : 'https://ltl-clients-api-dev.delhivery.com',
  SERVICEABILITY: (pincode: string) => `/pincode-service/${pincode}`,
  TAT: '/tat/estimate',
};

const FREIGHT = {
  BASE: IS_PROD ? 'https://ltl-clients-api.delhivery.com' : 'https://ltl-clients-api-dev.delhivery.com',
  ESTIMATE: '/freight/estimate',
  BREAKUP: '/lrn/freight-breakup',
};

const WAREHOUSE = {
  BASE: IS_PROD ? 'https://ltl-clients-api.delhivery.com' : 'https://ltl-clients-api-dev.delhivery.com',
  CREATE: '/client-warehouse/create/',
  UPDATE: '/client-warehouse/update/',
};

const PICKUP = {
  BASE: IS_PROD ? 'https://ltl-clients-api.delhivery.com' : 'https://ltl-clients-api-dev.delhivery.com',
  CREATE: '/pickup_requests/',
  CANCEL: (id: string) => `/pickup_requests/${id}`,
};

const DOCUMENTS = {
  BASE: IS_PROD ? 'https://ltl-clients-api.delhivery.com' : 'https://ltl-clients-api-dev.delhivery.com',
  LABEL: (size: string, lrn: string) => `/label/get_urls/${size}/${lrn}`,
  LR_COPY: (lrn: string) => `/lr_copy/print/${lrn}`,
  GENERATE: (docType: string) => `/generate/${docType}`,
  DOWNLOAD_POD: '/document/download',
};

function authHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  else if (env.DELHIVERY_API_KEY) headers.Authorization = `Token ${env.DELHIVERY_API_KEY}`;
  return headers;
}

// ─── Auth ────────────────────────────────────────────────────

export async function loginDelhivery(email: string, password: string) {
  const res = await fetch(`${AUTH.BASE}${AUTH.LOGIN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new AppError('DELHIVERY_AUTH_FAILED', 'Delhivery login failed', 401);
  return res.json();
}

export async function logoutDelhivery(token: string) {
  await fetch(`${AUTH.BASE}${AUTH.LOGOUT}`, {
    method: 'POST',
    headers: authHeaders(token),
  });
}

export async function forgotPasswordDelhivery(email: string) {
  const res = await fetch(`${AUTH.BASE}${AUTH.FORGOT_PASSWORD}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new AppError('DELHIVERY_RESET_FAILED', 'Password reset request failed', 400);
  return res.json();
}

// ─── Pincode Serviceability & TAT ────────────────────────────

export async function checkPincodeServiceability(pincode: string) {
  const res = await fetch(`${PINCODE.BASE}${PINCODE.SERVICEABILITY(pincode)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new AppError('PINCODE_ERROR', 'Pincode check failed', 400);
  return res.json();
}

export async function estimateTat(params: {
  originPincode: string;
  destinationPincode: string;
  pickupDate?: string;
}) {
  const res = await fetch(`${PINCODE.BASE}${PINCODE.TAT}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new AppError('TAT_ERROR', 'TAT estimation failed', 400);
  return res.json();
}

// ─── Freight ─────────────────────────────────────────────────

export async function estimateFreight(params: {
  originPincode: string;
  destinationPincode: string;
  weight: number;
  dimensions?: { length: number; breadth: number; height: number };
  commodityValue?: number;
}) {
  const res = await fetch(`${FREIGHT.BASE}${FREIGHT.ESTIMATE}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new AppError('FREIGHT_ERROR', 'Freight estimation failed', 400);
  return res.json();
}

export async function getFreightBreakup(lrn: string) {
  const res = await fetch(`${FREIGHT.BASE}${FREIGHT.BREAKUP}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new AppError('FREIGHT_ERROR', 'Freight breakup fetch failed', 400);
  return res.json();
}

// ─── Warehouse Management ────────────────────────────────────

export async function createWarehouse(data: {
  name: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  phone: string;
  email?: string;
}) {
  const res = await fetch(`${WAREHOUSE.BASE}${WAREHOUSE.CREATE}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new AppError('WAREHOUSE_ERROR', 'Warehouse creation failed', 400);
  return res.json();
}

export async function updateWarehouse(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${WAREHOUSE.BASE}${WAREHOUSE.UPDATE}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) throw new AppError('WAREHOUSE_ERROR', 'Warehouse update failed', 400);
  return res.json();
}

// ─── Shipment Management ─────────────────────────────────────

interface CreateShipmentParams {
  orderId: string;
  vendorId: string;
  pickupPincode: string;
  deliveryPincode: string;
  weight: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  email?: string;
  codAmount?: number;
}

export async function createShipment(params: CreateShipmentParams): Promise<Record<string, unknown>> {
  const shipmentPayload = {
    shipments: [{
      name: params.name,
      add: params.address,
      pin: params.deliveryPincode,
      city: params.city,
      state: params.state,
      phone: params.phone,
      order: params.orderId,
      payment_mode: (params.codAmount && params.codAmount > 0) ? 'COD' : 'Pre-paid',
      weight: String(params.weight),
      pickup_location: 'primary',
      cod_amount: params.codAmount || 0,
    }],
    pickup_location: {
      name: 'ShopYNG Fulfillment',
      pin: params.pickupPincode,
      add: 'ShopYNG Warehouse',
      phone: '1800-SHOPYNG',
    },
  };

  let waybillNumber: string | null = null;
  let awbNumber: string | null = null;
  let lrn: string | null = null;
  let labelUrl: string | null = null;

  try {
    const response = await fetch(`${SHIPMENT.BASE}${SHIPMENT.CREATE}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(shipmentPayload),
    });

    if (response.ok) {
      const data = (await response.json()) as Record<string, unknown>;
      const packets = data?.packages as Array<Record<string, unknown>> | undefined;
      const shipments = data?.shipments as Array<Record<string, unknown>> | undefined;
      const packet = (packets?.[0] || shipments?.[0] || {}) as Record<string, unknown>;
      waybillNumber = (packet.waybill || packet.awb || null) as string | null;
      awbNumber = (packet.awb || packet.waybill || null) as string | null;
      lrn = (packet.lrn || null) as string | null;
      labelUrl = (packet.label_url || packet.label || null) as string | null;
    } else {
      const errBody = await response.text();
      console.error('Delhivery shipment creation failed:', errBody);
    }
  } catch (err) {
    console.error('Delhivery API error (non-blocking):', err);
  }

  if (!waybillNumber) {
    waybillNumber = `SHP${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }

  const result = await query(
    `INSERT INTO logistics_shipments (order_id, vendor_id, waybill_number, awb_number, lrn, status, label_url)
     VALUES ($1, $2, $3, $4, $5, 'created', $6)
     RETURNING *`,
    [params.orderId, params.vendorId, waybillNumber, awbNumber, lrn, labelUrl]
  );

  return result.rows[0];
}

export async function updateShipmentLrn(lnum: string, data: Record<string, unknown>) {
  const res = await fetch(`${SHIPMENT.BASE}${SHIPMENT.UPDATE(lnum)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new AppError('SHIPMENT_UPDATE_ERROR', 'Shipment update failed', 400);
  return res.json();
}

export async function cancelShipmentLrn(lrn: string) {
  const res = await fetch(`${SHIPMENT.BASE}${SHIPMENT.CANCEL(lrn)}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new AppError('SHIPMENT_CANCEL_ERROR', 'Shipment cancellation failed', 400);
  return res.json();
}

export async function trackShipmentLrn(lrns: string | string[]) {
  const params = new URLSearchParams();
  const lrnList = Array.isArray(lrns) ? lrns : [lrns];
  lrnList.forEach((l) => params.append('lrns', l));
  const res = await fetch(`${SHIPMENT.BASE}${SHIPMENT.TRACK}?${params.toString()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new AppError('TRACK_ERROR', 'Shipment tracking failed', 400);
  return res.json();
}

export async function bookLastMileAppointment(data: {
  lrn: string;
  appointmentDate: string;
  timeSlot: string;
  notes?: string;
}) {
  const res = await fetch(`${SHIPMENT.BASE}${SHIPMENT.BOOK_APPOINTMENT}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new AppError('APPOINTMENT_ERROR', 'Appointment booking failed', 400);
  return res.json();
}

// ─── Pickup Requests ─────────────────────────────────────────

export async function createPickupRequest(data: {
  pickupPincode: string;
  pickupDate: string;
  weight: number;
  vendorName: string;
  vendorPhone: string;
  vendorAddress: string;
  shipments: string[];
}) {
  const res = await fetch(`${PICKUP.BASE}${PICKUP.CREATE}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new AppError('PICKUP_ERROR', 'Pickup request failed', 400);
  return res.json();
}

export async function cancelPickupRequest(pickupId: string) {
  const res = await fetch(`${PICKUP.BASE}${PICKUP.CANCEL(pickupId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new AppError('PICKUP_CANCEL_ERROR', 'Pickup cancellation failed', 400);
  return res.json();
}

// ─── Labels & Documents ──────────────────────────────────────

export async function getShippingLabel(size: string, lrn: string) {
  const res = await fetch(`${DOCUMENTS.BASE}${DOCUMENTS.LABEL(size, lrn)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new AppError('LABEL_ERROR', 'Label generation failed', 400);
  return res.json();
}

export async function getLrCopy(lrn: string) {
  const res = await fetch(`${DOCUMENTS.BASE}${DOCUMENTS.LR_COPY(lrn)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new AppError('LR_COPY_ERROR', 'LR copy fetch failed', 400);
  return res.json();
}

export async function generateDocument(docType: string, data: Record<string, unknown>) {
  const res = await fetch(`${DOCUMENTS.BASE}${DOCUMENTS.GENERATE(docType)}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new AppError('DOCUMENT_ERROR', 'Document generation failed', 400);
  return res.json();
}

export async function downloadPod(lrn: string) {
  const res = await fetch(`${DOCUMENTS.BASE}${DOCUMENTS.DOWNLOAD_POD}?lrn=${lrn}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new AppError('POD_ERROR', 'POD download failed', 400);
  return res.blob();
}

// ─── Legacy (DB-based) Tracking ───────────────────────────────

export async function trackShipment(orderId: string): Promise<Record<string, unknown> | null> {
  const result = await query(
    'SELECT * FROM logistics_shipments WHERE order_id = $1',
    [orderId]
  );
  return result.rows[0] || null;
}

export async function getVendorShipments(vendorId: string): Promise<Record<string, unknown>[]> {
  const result = await query(
    'SELECT * FROM logistics_shipments WHERE vendor_id = $1 ORDER BY created_at DESC',
    [vendorId]
  );
  return result.rows;
}

export async function updateShipmentStatus(waybillNumber: string, status: string, additionalData?: Record<string, unknown>): Promise<void> {
  const validStatuses = ['pending', 'created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'];
  if (!validStatuses.includes(status)) {
    throw new AppError('INVALID_STATUS', 'Invalid shipment status', 400);
  }

  const updates: string[] = ['status = $1', 'updated_at = NOW()'];
  const params: unknown[] = [status];
  let paramIndex = 2;

  if (status === 'shipped' && additionalData?.shippedAt) {
    updates.push(`shipped_at = $${paramIndex++}`);
    params.push(additionalData.shippedAt);
  }
  if (status === 'delivered' && additionalData?.deliveredAt) {
    updates.push(`delivered_at = $${paramIndex++}`);
    params.push(additionalData.deliveredAt);
  }
  if (additionalData?.trackingUrl) {
    updates.push(`tracking_url = $${paramIndex++}`);
    params.push(additionalData.trackingUrl);
  }

  params.push(waybillNumber);
  await query(
    `UPDATE logistics_shipments SET ${updates.join(', ')} WHERE waybill_number = $${paramIndex}`,
    params
  );
}
