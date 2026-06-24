import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminInitiateAuthCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

const client = new CognitoIdentityProviderClient({
  region: env.COGNITO_REGION,
});

function requireCognitoConfig() {
  if (!env.COGNITO_USER_POOL_ID || !env.COGNITO_CLIENT_ID) {
    throw new AppError('CONFIG_ERROR', 'Cognito not configured. Set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID', 500);
  }
}

export async function signUp(email: string, password: string, phoneNumber?: string) {
  requireCognitoConfig();
  try {
    const result = await client.send(new SignUpCommand({
      ClientId: env.COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        ...(phoneNumber ? [{ Name: 'phone_number', Value: phoneNumber }] : []),
      ],
    }));
    return {
      userSub: result.UserSub,
      userConfirmed: result.UserConfirmed,
    };
  } catch (err: any) {
    throw new AppError('COGNITO_ERROR', err.message || 'Cognito signup failed', 400);
  }
}

export async function signIn(email: string, password: string) {
  requireCognitoConfig();
  try {
    const result = await client.send(new AdminInitiateAuthCommand({
      UserPoolId: env.COGNITO_USER_POOL_ID,
      ClientId: env.COGNITO_CLIENT_ID,
      AuthFlow: AuthFlowType.ADMIN_NO_SRP_AUTH,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    }));

    const authResult = result.AuthenticationResult;
    if (!authResult) {
      throw new AppError('COGNITO_ERROR', 'Authentication failed', 401);
    }

    return {
      accessToken: authResult.AccessToken,
      idToken: authResult.IdToken,
      refreshToken: authResult.RefreshToken,
      expiresIn: authResult.ExpiresIn,
      tokenType: authResult.TokenType,
    };
  } catch (err: any) {
    if (err.name === 'UserNotFoundException') {
      throw new AppError('COGNITO_ERROR', 'User not found', 401);
    }
    if (err.name === 'NotAuthorizedException') {
      throw new AppError('COGNITO_ERROR', 'Incorrect email or password', 401);
    }
    throw new AppError('COGNITO_ERROR', err.message || 'Cognito signin failed', 401);
  }
}

export async function adminCreateUser(email: string, password: string, phoneNumber?: string) {
  requireCognitoConfig();
  try {
    await client.send(new AdminCreateUserCommand({
      UserPoolId: env.COGNITO_USER_POOL_ID,
      Username: email,
      TemporaryPassword: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        ...(phoneNumber ? [{ Name: 'phone_number', Value: phoneNumber }] : []),
      ],
      MessageAction: 'SUPPRESS',
    }));

    await client.send(new AdminSetUserPasswordCommand({
      UserPoolId: env.COGNITO_USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    }));

    return { success: true };
  } catch (err: any) {
    throw new AppError('COGNITO_ERROR', err.message || 'Failed to create user', 400);
  }
}

export async function initiateForgotPassword(email: string) {
  requireCognitoConfig();
  try {
    await client.send(new ForgotPasswordCommand({
      ClientId: env.COGNITO_CLIENT_ID,
      Username: email,
    }));
    return { success: true };
  } catch (err: any) {
    throw new AppError('COGNITO_ERROR', err.message || 'Failed to initiate password reset', 400);
  }
}

export async function confirmForgotPassword(email: string, code: string, newPassword: string) {
  requireCognitoConfig();
  try {
    await client.send(new ConfirmForgotPasswordCommand({
      ClientId: env.COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    }));
    return { success: true };
  } catch (err: any) {
    throw new AppError('COGNITO_ERROR', err.message || 'Failed to confirm password reset', 400);
  }
}
