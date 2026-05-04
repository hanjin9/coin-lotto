import nodemailer from 'nodemailer';
import twilio from 'twilio';

export interface WinnerNotificationInput {
  email?: string | null;
  phoneNumber?: string | null;
  drawNumber: number;
  prizeRank: number;
  netAmount: string;
}

function buildWinnerMessage(input: WinnerNotificationInput) {
  return `축하드립니다. ${input.drawNumber}회차 로또에서 ${input.prizeRank}등에 당첨되셨고, 실수령 예정 금액은 ${input.netAmount} 입니다.`;
}

export async function notifyWinner(input: WinnerNotificationInput) {
  const message = buildWinnerMessage(input);
  const results = {
    emailSent: false,
    smsSent: false,
  };

  if (input.email && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: input.email,
      subject: `[WLD LOTTO] ${input.drawNumber}회차 당첨 안내`,
      text: message,
    });

    results.emailSent = true;
  }

  if (
    input.phoneNumber &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: input.phoneNumber,
    });
    results.smsSent = true;
  }

  return results;
}
