import jwt, { JwtPayload as JwtPayloadType } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { env } from '../config/env';

interface CognitoJwtPayload extends JwtPayloadType {
  sub: string;
  email?: string;
  phone_number?: string;
  'cognito:username'?: string;
  token_use: string;
}

const client = jwksClient({
  jwksUri: `https://cognito-idp.${env.COGNITO_REGION}.amazonaws.com/${env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 3600000,
});

async function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  try {
    if (!env.COGNITO_USER_POOL_ID) {
      return callback(new Error('Cognito not configured'));
    }
    const key = await client.getSigningKey(header.kid);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  } catch (err) {
    callback(err as Error);
  }
}

export function verifyCognitoToken(token: string): Promise<CognitoJwtPayload> {
  return new Promise((resolve, reject) => {
    if (!env.COGNITO_USER_POOL_ID) {
      return reject(new Error('Cognito not configured'));
    }

    jwt.verify(token, getKey, {
      issuer: `https://cognito-idp.${env.COGNITO_REGION}.amazonaws.com/${env.COGNITO_USER_POOL_ID}`,
      algorithms: ['RS256'],
    }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded as CognitoJwtPayload);
    });
  });
}
