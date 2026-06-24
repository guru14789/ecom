import { Pool } from 'pg';
import { env } from './env';

const pool = new Pool({
  connectionString: env.POSTGRES_URI,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err: Error) => {
  console.error('PostgreSQL pool error:', err);
});

export async function initPostgres(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendor_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id VARCHAR(50) NOT NULL UNIQUE,
        tier VARCHAR(20) NOT NULL DEFAULT 'basic',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        product_limit INTEGER NOT NULL DEFAULT 50,
        commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
        features JSONB DEFAULT '[]',
        current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
        current_period_end TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
        cancelled_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS escrow_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id VARCHAR(50) NOT NULL UNIQUE,
        buyer_id VARCHAR(50) NOT NULL,
        vendor_id VARCHAR(50) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        razorpay_order_id VARCHAR(100),
        razorpay_payment_id VARCHAR(100),
        status VARCHAR(20) NOT NULL DEFAULT 'held',
        held_at TIMESTAMP NOT NULL DEFAULT NOW(),
        released_at TIMESTAMP,
        refunded_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS logistics_shipments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id VARCHAR(50) NOT NULL UNIQUE,
        vendor_id VARCHAR(50) NOT NULL,
        waybill_number VARCHAR(50),
        awb_number VARCHAR(50),
        courier_name VARCHAR(100),
        tracking_url TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        label_url TEXT,
        estimated_delivery TIMESTAMP,
        delivered_at TIMESTAMP,
        shipped_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS vendor_payouts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id VARCHAR(50) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        razorpay_payout_id VARCHAR(100),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        period_start TIMESTAMP NOT NULL,
        period_end TIMESTAMP NOT NULL,
        paid_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS group_sessions_pg (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id VARCHAR(50) NOT NULL,
        host_user_id VARCHAR(50) NOT NULL,
        target_count INTEGER NOT NULL,
        current_count INTEGER NOT NULL DEFAULT 1,
        share_code VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        ends_at TIMESTAMP NOT NULL,
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS activity_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id VARCHAR(50) NOT NULL,
        actor_type VARCHAR(20) NOT NULL,
        action VARCHAR(50) NOT NULL,
        resource_type VARCHAR(50),
        resource_id VARCHAR(50),
        metadata JSONB DEFAULT '{}',
        ip_address VARCHAR(45),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('PostgreSQL tables initialized');
  } catch (err) {
    console.error('PostgreSQL init error:', err);
    throw err;
  } finally {
    client.release();
  }
}

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 100) {
    console.log(`Slow query (${duration}ms):`, text.substring(0, 100));
  }
  return result;
}

export async function getClient() {
  return pool.connect();
}

export default pool;
