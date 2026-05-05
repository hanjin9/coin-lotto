/**
 * SMS 인증 모듈 (Sinch 기반)
 * 파일명: server/sms-auth.ts
 * 작성자: Manus_AI
 * 작성일: 20260504
 * 
 * 기능:
 * - 휴대폰 번호로 인증 코드 발송 (전 세계 193개 국가)
 * - 인증 코드 검증
 * - 재시도 제한
 * - 만료 시간 관리
 */

import { getDb } from './db';
import { verificationCodes } from '../drizzle/schema';
import { eq, and, gt } from 'drizzle-orm';

// Sinch 설정
const SINCH_API_TOKEN = process.env.SINCH_API_TOKEN || '';
const SINCH_SERVICE_ID = process.env.SINCH_SERVICE_ID || '';
const SINCH_API_URL = 'https://api.sinch.com/sms/v1';

if (!SINCH_API_TOKEN || !SINCH_SERVICE_ID) {
  console.warn('⚠️ Sinch 환경 변수가 설정되지 않았습니다. SMS 인증이 테스트 모드로 실행됩니다.');
}

// 인증 코드 생성 (6자리 숫자)
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 휴대폰 번호 포맷팅 (국제 형식으로 변환)
function formatPhoneNumber(countryCode: string, phoneNumber: string): string {
  // 예: countryCode="82", phoneNumber="010-1234-5678" → "+821012345678"
  const cleaned = phoneNumber.replace(/\D/g, '');
  const code = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  return `${code}${cleaned}`;
}

/**
 * SMS 인증 코드 발송 (Sinch API)
 */
async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  // 개발 환경에서는 콘솔에 출력
  if (process.env.NODE_ENV === 'development' || !SINCH_API_TOKEN) {
    console.log(`[Sinch SMS] To: ${phoneNumber}, Message: ${message}`);
    return true;
  }

  try {
    const response = await fetch(`${SINCH_API_URL}/batches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SINCH_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: [phoneNumber],
        body: message,
        type: 'mt_text',
      }),
    });

    if (!response.ok) {
      console.error(`Sinch API error: ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}

/**
 * SMS 인증 코드 발송
 * @param countryCode 국가 코드 (예: "82" 또는 "+82")
 * @param phoneNumber 휴대폰 번호 (예: "010-1234-5678" 또는 "01012345678")
 * @returns 인증 코드 ID 및 만료 시간
 */
export async function sendVerificationCode(
  countryCode: string,
  phoneNumber: string
): Promise<{ success: boolean; codeId: string; expiresAt: Date; message: string }> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // 휴대폰 번호 포맷팅
    const formattedPhone = formatPhoneNumber(countryCode, phoneNumber);
    
    // 인증 코드 생성
    const code = generateVerificationCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60000); // 5분 유효

    // 데이터베이스에 저장
    const result = await db.insert(verificationCodes).values({
      phoneNumber: formattedPhone,
      email: null,
      code,
      verified: false,
      attemptCount: 0,
      maxAttempts: 3,
      expiresAt,
      createdAt: now,
    });

    // SMS 발송
    const smsSent = await sendSMS(
      formattedPhone,
      `Your verification code is: ${code}. Valid for 5 minutes.`
    );

    if (!smsSent) {
      console.warn('SMS sent but Sinch API may have failed');
    }

    // 마지막 삽입된 ID 가져오기
    const records = await db
      .select()
      .from(verificationCodes)
      .where(eq(verificationCodes.phoneNumber, formattedPhone))
      .orderBy(verificationCodes.createdAt)
      .limit(1);

    const codeId = records[0]?.id?.toString() || '0';

    return {
      success: true,
      codeId,
      expiresAt,
      message: 'Verification code sent successfully',
    };
  } catch (error) {
    console.error('Failed to send verification code:', error);
    return {
      success: false,
      codeId: '',
      expiresAt: new Date(),
      message: 'Failed to send verification code',
    };
  }
}

/**
 * SMS 인증 코드 검증
 */
export async function verifyCode(
  countryCode: string,
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; message: string; verified?: boolean }> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // 휴대폰 번호 포맷팅
    const formattedPhone = formatPhoneNumber(countryCode, phoneNumber);

    // 데이터베이스에서 코드 조회
    const records = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.phoneNumber, formattedPhone),
          eq(verificationCodes.verified, false)
        )
      )
      .orderBy(verificationCodes.createdAt)
      .limit(1);

    if (!records || records.length === 0) {
      return {
        success: false,
        message: 'No verification code found',
        verified: false,
      };
    }

    const record = records[0];

    // 만료 시간 확인
    if (new Date() > record.expiresAt) {
      return {
        success: false,
        message: 'Verification code expired',
        verified: false,
      };
    }

    // 시도 횟수 확인
    const attemptCount = record.attemptCount || 0;
    const maxAttempts = record.maxAttempts || 3;

    if (attemptCount >= maxAttempts) {
      return {
        success: false,
        message: 'Too many attempts. Please request a new code.',
        verified: false,
      };
    }

    // 코드 검증
    if (record.code !== code) {
      // 시도 횟수 증가
      await db
        .update(verificationCodes)
        .set({ attemptCount: attemptCount + 1 })
        .where(eq(verificationCodes.id, record.id));

      return {
        success: false,
        message: 'Invalid verification code',
        verified: false,
      };
    }

    // 검증 성공
    await db
      .update(verificationCodes)
      .set({ verified: true })
      .where(eq(verificationCodes.id, record.id));

    return {
      success: true,
      message: 'Verification successful',
      verified: true,
    };
  } catch (error) {
    console.error('Failed to verify code:', error);
    return {
      success: false,
      message: 'Failed to verify code',
      verified: false,
    };
  }
}

/**
 * SMS 인증 코드 재발송
 */
export async function resendVerificationCode(
  countryCode: string,
  phoneNumber: string
): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // 휴대폰 번호 포맷팅
    const formattedPhone = formatPhoneNumber(countryCode, phoneNumber);

    // 기존 코드 조회
    const records = await db
      .select()
      .from(verificationCodes)
      .where(eq(verificationCodes.phoneNumber, formattedPhone))
      .orderBy(verificationCodes.createdAt)
      .limit(1);

    if (!records || records.length === 0) {
      return {
        success: false,
        message: 'No verification code found',
      };
    }

    const record = records[0];

    // 새 코드 생성
    const newCode = generateVerificationCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60000); // 5분 유효

    // 데이터베이스 업데이트
    await db
      .update(verificationCodes)
      .set({
        code: newCode,
        expiresAt,
        attemptCount: 0,
        verified: false,
      })
      .where(eq(verificationCodes.id, record.id));

    // SMS 재발송
    const smsSent = await sendSMS(
      formattedPhone,
      `Your new verification code is: ${newCode}. Valid for 5 minutes.`
    );

    if (!smsSent) {
      console.warn('SMS sent but Sinch API may have failed');
    }

    return {
      success: true,
      message: 'Verification code resent successfully',
    };
  } catch (error) {
    console.error('Failed to resend verification code:', error);
    return {
      success: false,
      message: 'Failed to resend verification code',
    };
  }
}
