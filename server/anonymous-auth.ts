/**
 * Anonymous Authentication System - 무기명 로그인
 * 
 * 기능:
 * 1. 휴대폰/이메일 입력 및 검증
 * 2. 6자리 인증 코드 생성 및 발송 (SMS/Email)
 * 3. 인증 코드 검증 (5분 제한)
 * 4. 자동 로그인 및 사용자 생성
 * 5. 로그인 이력 기록
 */

import crypto from 'crypto';
import { notifyOwner } from './_core/notification';

/**
 * 인증 코드 저장소 (실제: Redis 또는 DB)
 */
interface VerificationCode {
  code: string;
  contact: string; // 휴대폰 또는 이메일
  type: 'phone' | 'email';
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
}

const verificationCodes = new Map<string, VerificationCode>();

/**
 * 휴대폰 번호 검증
 */
export function validatePhoneNumber(phone: string): boolean {
  // 한국 휴대폰 형식: 010-1234-5678 또는 01012345678
  const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * 이메일 주소 검증
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 6자리 인증 코드 생성
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 인증 코드 발송 (SMS)
 */
export async function sendVerificationCodeSMS(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  try {
    console.log('📱 SMS 발송:', { phoneNumber, code });

    // 실제 구현: Twilio 또는 국내 SMS 서비스 (NHN Cloud, Coolsms 등)
    // const twilio = require('twilio');
    // const client = twilio(ACCOUNT_SID, AUTH_TOKEN);
    // await client.messages.create({
    //   body: `[WLD LOTTO] 인증번호: ${code} (5분 유효)`,
    //   from: TWILIO_PHONE_NUMBER,
    //   to: phoneNumber,
    // });

    console.log(`✅ SMS 발송 완료: ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error('❌ SMS 발송 실패:', error);
    return false;
  }
}

/**
 * 인증 코드 발송 (Email)
 */
export async function sendVerificationCodeEmail(
  email: string,
  code: string
): Promise<boolean> {
  try {
    console.log('📧 이메일 발송:', { email, code });

    // 실제 구현: nodemailer
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({
    //   to: email,
    //   subject: '[WLD LOTTO] 인증번호',
    //   html: `<p>인증번호: <strong>${code}</strong></p><p>5분 유효합니다.</p>`,
    // });

    console.log(`✅ 이메일 발송 완료: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error);
    return false;
  }
}

/**
 * 인증 코드 요청
 */
export interface VerificationRequest {
  contact: string; // 휴대폰 또는 이메일
  type: 'phone' | 'email';
  codeSent: boolean;
  expiresIn: number; // 초 단위
}

export async function requestVerificationCode(
  contact: string,
  type: 'phone' | 'email'
): Promise<VerificationRequest | null> {
  try {
    // 입력값 검증
    if (type === 'phone' && !validatePhoneNumber(contact)) {
      console.error('❌ 유효하지 않은 휴대폰 번호:', contact);
      return null;
    }

    if (type === 'email' && !validateEmail(contact)) {
      console.error('❌ 유효하지 않은 이메일:', contact);
      return null;
    }

    // 인증 코드 생성
    const code = generateVerificationCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5분

    // 인증 코드 저장
    verificationCodes.set(contact, {
      code,
      contact,
      type,
      createdAt: now,
      expiresAt,
      attempts: 0,
      maxAttempts: 5,
    });

    // 인증 코드 발송
    let codeSent = false;
    if (type === 'phone') {
      codeSent = await sendVerificationCodeSMS(contact, code);
    } else {
      codeSent = await sendVerificationCodeEmail(contact, code);
    }

    console.log(`✅ 인증 코드 요청 완료:`, {
      contact,
      type,
      codeSent,
      expiresIn: 300,
    });

    return {
      contact,
      type,
      codeSent,
      expiresIn: 300, // 5분 = 300초
    };
  } catch (error) {
    console.error('❌ 인증 코드 요청 실패:', error);
    return null;
  }
}

/**
 * 인증 코드 재전송
 */
export async function resendVerificationCode(
  contact: string
): Promise<VerificationRequest | null> {
  try {
    const stored = verificationCodes.get(contact);

    if (!stored) {
      console.error('❌ 저장된 인증 코드 없음:', contact);
      return null;
    }

    // 이전 인증 코드 재사용 (또는 새로 생성)
    const code = stored.code;

    // 재전송
    let codeSent = false;
    if (stored.type === 'phone') {
      codeSent = await sendVerificationCodeSMS(contact, code);
    } else {
      codeSent = await sendVerificationCodeEmail(contact, code);
    }

    console.log(`✅ 인증 코드 재전송 완료:`, { contact, codeSent });

    return {
      contact,
      type: stored.type,
      codeSent,
      expiresIn: Math.max(
        0,
        Math.floor((stored.expiresAt.getTime() - Date.now()) / 1000)
      ),
    };
  } catch (error) {
    console.error('❌ 인증 코드 재전송 실패:', error);
    return null;
  }
}

/**
 * 인증 코드 검증
 */
export interface VerificationResult {
  success: boolean;
  message: string;
  userId?: number;
  sessionToken?: string;
}

export async function verifyCode(
  contact: string,
  inputCode: string
): Promise<VerificationResult> {
  try {
    const stored = verificationCodes.get(contact);

    // 저장된 인증 코드 확인
    if (!stored) {
      return {
        success: false,
        message: '인증 코드를 요청해주세요.',
      };
    }

    // 만료 시간 확인
    if (new Date() > stored.expiresAt) {
      verificationCodes.delete(contact);
      return {
        success: false,
        message: '인증 코드가 만료되었습니다. 다시 요청해주세요.',
      };
    }

    // 시도 횟수 확인
    if (stored.attempts >= stored.maxAttempts) {
      verificationCodes.delete(contact);
      return {
        success: false,
        message: '시도 횟수를 초과했습니다. 새로운 코드를 요청해주세요.',
      };
    }

    // 인증 코드 검증
    if (inputCode !== stored.code) {
      stored.attempts++;
      return {
        success: false,
        message: `인증 코드가 일치하지 않습니다. (${stored.maxAttempts - stored.attempts}회 남음)`,
      };
    }

    // 인증 성공
    verificationCodes.delete(contact);

    // 사용자 자동 생성 또는 조회 (실제: DB 조회)
    const userId = Math.floor(Math.random() * 1000000);
    const sessionToken = crypto.randomBytes(32).toString('hex');

    console.log(`✅ 인증 성공:`, { contact, userId });

    // 로그인 이력 기록
    await logLoginAttempt(contact, true);

    return {
      success: true,
      message: '인증 성공',
      userId,
      sessionToken,
    };
  } catch (error) {
    console.error('❌ 인증 검증 실패:', error);
    await logLoginAttempt(contact, false);
    return {
      success: false,
      message: '인증 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 로그인 이력 기록
 */
export interface LoginHistory {
  id: number;
  contact: string;
  type: 'phone' | 'email';
  success: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export async function logLoginAttempt(
  contact: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginHistory> {
  const type = validatePhoneNumber(contact) ? 'phone' : 'email';

  const history: LoginHistory = {
    id: Math.floor(Math.random() * 1000000),
    contact,
    type,
    success,
    timestamp: new Date(),
    ipAddress,
    userAgent,
  };

  console.log('📝 로그인 이력 기록:', history);

  // 실제 구현: DB에 저장

  // 실패한 로그인 시도가 많으면 협회장에게 알림
  if (!success) {
    // 실제: 최근 1시간 내 같은 연락처로 5회 이상 실패 시 알림
    await notifyOwner({
      title: '⚠️ 로그인 실패 감지',
      content: `
연락처: ${contact}
유형: ${type}
타임스탐프: ${history.timestamp.toISOString()}
IP: ${ipAddress || 'N/A'}
      `.trim(),
    });
  }

  return history;
}

/**
 * 사용자 자동 생성
 */
export interface AnonymousUser {
  id: number;
  contact: string;
  type: 'phone' | 'email';
  createdAt: Date;
  lastLoginAt: Date;
  loginCount: number;
}

export async function createOrGetAnonymousUser(
  contact: string
): Promise<AnonymousUser> {
  try {
    const type = validatePhoneNumber(contact) ? 'phone' : 'email';

    // 실제 구현: DB에서 사용자 조회 또는 생성
    const user: AnonymousUser = {
      id: Math.floor(Math.random() * 1000000),
      contact,
      type,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      loginCount: 1,
    };

    console.log('✅ 사용자 생성/조회 완료:', user);

    return user;
  } catch (error) {
    console.error('❌ 사용자 생성 실패:', error);
    throw error;
  }
}

/**
 * 인증 상태 조회
 */
export interface AuthStatus {
  isAuthenticated: boolean;
  contact?: string;
  type?: 'phone' | 'email';
  loginCount?: number;
  lastLoginAt?: Date;
}

export async function getAuthStatus(
  sessionToken: string
): Promise<AuthStatus> {
  try {
    // 실제 구현: 세션 저장소에서 조회 (Redis 등)
    // const session = await redis.get(`session:${sessionToken}`);

    // 시뮬레이션
    const isAuthenticated = sessionToken.length > 0;

    return {
      isAuthenticated,
      contact: isAuthenticated ? '010-1234-5678' : undefined,
      type: isAuthenticated ? 'phone' : undefined,
      loginCount: isAuthenticated ? 5 : undefined,
      lastLoginAt: isAuthenticated ? new Date() : undefined,
    };
  } catch (error) {
    console.error('❌ 인증 상태 조회 실패:', error);
    return { isAuthenticated: false };
  }
}

/**
 * 로그아웃
 */
export async function logout(sessionToken: string): Promise<boolean> {
  try {
    console.log('🚪 로그아웃:', sessionToken);

    // 실제 구현: 세션 저장소에서 제거
    // await redis.del(`session:${sessionToken}`);

    return true;
  } catch (error) {
    console.error('❌ 로그아웃 실패:', error);
    return false;
  }
}
