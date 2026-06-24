import { DynamoDBClient, CreateTableCommand, ListTablesCommand, UpdateTimeToLiveCommand, BillingMode } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const CART_TABLE = 'shopyng_cart_sessions';
const SESSION_TABLE = 'shopyng_sessions';

export async function getCartSession(userId: string): Promise<Record<string, unknown> | null> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: CART_TABLE,
      Key: { userId },
    }));
    return (result.Item as Record<string, unknown>) || null;
  } catch (err) {
    console.error('DynamoDB getCartSession error:', err);
    return null;
  }
}

export async function saveCartSession(userId: string, cartData: Record<string, unknown>): Promise<void> {
  try {
    await docClient.send(new PutCommand({
      TableName: CART_TABLE,
      Item: {
        userId,
        ...cartData,
        updatedAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
      },
    }));
  } catch (err) {
    console.error('DynamoDB saveCartSession error:', err);
  }
}

export async function deleteCartSession(userId: string): Promise<void> {
  try {
    await docClient.send(new DeleteCommand({
      TableName: CART_TABLE,
      Key: { userId },
    }));
  } catch (err) {
    console.error('DynamoDB deleteCartSession error:', err);
  }
}

export async function updateCartItem(userId: string, productId: string, updates: Record<string, unknown>): Promise<void> {
  try {
    const updateExpression =
      'SET items.#pid = :item, updatedAt = :now, #ttl = :ttl';
    await docClient.send(new UpdateCommand({
      TableName: CART_TABLE,
      Key: { userId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: {
        '#pid': productId,
        '#ttl': 'ttl',
      },
      ExpressionAttributeValues: {
        ':item': updates,
        ':now': new Date().toISOString(),
        ':ttl': Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
      },
    }));
  } catch (err) {
    console.error('DynamoDB updateCartItem error:', err);
  }
}

export async function saveSession(sessionId: string, data: Record<string, unknown>, ttlSeconds = 604800): Promise<void> {
  try {
    await docClient.send(new PutCommand({
      TableName: SESSION_TABLE,
      Item: {
        sessionId,
        ...data,
        expiresAt: Math.floor(Date.now() / 1000) + ttlSeconds,
      },
    }));
  } catch (err) {
    console.error('DynamoDB saveSession error:', err);
  }
}

export async function getSession(sessionId: string): Promise<Record<string, unknown> | null> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: SESSION_TABLE,
      Key: { sessionId },
    }));
    return (result.Item as Record<string, unknown>) || null;
  } catch (err) {
    console.error('DynamoDB getSession error:', err);
    return null;
  }
}

const TABLE_DEFINITIONS = [
  {
    name: CART_TABLE,
    keySchema: [{ AttributeName: 'userId', KeyType: 'HASH' as const }],
    attributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' as const }],
    ttlAttribute: 'ttl',
  },
  {
    name: SESSION_TABLE,
    keySchema: [{ AttributeName: 'sessionId', KeyType: 'HASH' as const }],
    attributeDefinitions: [{ AttributeName: 'sessionId', AttributeType: 'S' as const }],
    ttlAttribute: 'expiresAt',
  },
];

export async function initDynamoDBTables(): Promise<void> {
  try {
    const { TableNames = [] } = await client.send(new ListTablesCommand({}));

    for (const table of TABLE_DEFINITIONS) {
      if (TableNames.includes(table.name)) {
        console.log(`DynamoDB table "${table.name}" already exists`);
        continue;
      }

      await client.send(new CreateTableCommand({
        TableName: table.name,
        KeySchema: table.keySchema,
        AttributeDefinitions: table.attributeDefinitions,
        BillingMode: BillingMode.PAY_PER_REQUEST,
      }));

      await client.send(new UpdateTimeToLiveCommand({
        TableName: table.name,
        TimeToLiveSpecification: {
          AttributeName: table.ttlAttribute,
          Enabled: true,
        },
      }));

      console.log(`DynamoDB table "${table.name}" created with TTL on "${table.ttlAttribute}"`);
    }
  } catch (err) {
    console.error('DynamoDB init error (non-fatal):', (err as Error).message);
  }
}
