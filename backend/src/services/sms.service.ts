import { env } from '../config/env';

interface SmsProvider {
  sendOTP(phoneNumber: string, otp: string): Promise<void>;
}

class ConsoleProvider implements SmsProvider {
  async sendOTP(phoneNumber: string, otp: string): Promise<void> {
    console.log(`[SMS] Sending OTP ${otp} to ${phoneNumber}`);
  }
}

class Msg91Provider implements SmsProvider {
  async sendOTP(phoneNumber: string, otp: string): Promise<void> {
    const response = await fetch('https://api.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: phoneNumber,
        otp,
        template_id: env.MSG91_TEMPLATE_ID,
        authkey: env.MSG91_API_KEY,
      }),
    });

    if (!response.ok) {
      throw new Error(`MSG91 API error: ${response.statusText}`);
    }
  }
}

class TwilioProvider implements SmsProvider {
  async sendOTP(phoneNumber: string, otp: string): Promise<void> {
    const accountSid = env.TWILIO_ACCOUNT_SID;
    const authToken = env.TWILIO_AUTH_TOKEN;
    const from = env.TWILIO_PHONE;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          Body: `Your Shopsyy OTP is: ${otp}. Valid for 5 minutes. Do not share.`,
          From: from,
          To: phoneNumber,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.statusText}`);
    }
  }
}

function createSmsProvider(): SmsProvider {
  switch (env.SMS_PROVIDER) {
    case 'msg91':
      return new Msg91Provider();
    case 'twilio':
      return new TwilioProvider();
    case 'console':
    default:
      return new ConsoleProvider();
  }
}

export const smsService = createSmsProvider();
