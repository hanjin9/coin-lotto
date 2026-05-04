/**
 * SMS 인증 모듈 (Twilio 기반)
 * 파일명: server/sms-auth.ts
 * 작성자: Manus_AI
 * 작성일: 20260504
 * 
 * 기능:
 * - 휴대폰 번호로 인증 코드 발송
 * - 인증 코드 검증
 * - 인증 코드 캐싱 (Redis 또는 메모리)
 * - 재시도 제한
 */

import twilio from 'twilio';
import { getDb } from './db';
import { verificationCodes } from '../drizzle/schema';
import { eq, and, gt } from 'drizzle-orm';

// Twilio 클라이언트 초기화
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.warn('⚠️ Twilio 환경 변수가 설정되지 않았습니다. SMS 인증이 비활성화됩니다.');
}

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

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
 * SMS 인증 코드 발송
 * @param countryCode 국가 코드 (예: "82" 또는 "+82")
 * @param phoneNumber 휴대폰 번호 (예: "010-1234-5678" 또는 "01012345678")
 * @returns 인증 코드 ID 및 만료 시간
 */
export async function sendVerificationCode(
  countryCode: string,
  phoneNumber: string
): Promise<{
  codeId: string;
  expiresAt: Date;
  success: boolean;
  message: string;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        codeId: '',
        expiresAt: new Date(),
        success: false,
        message: 'Database not available',
      };
    }

    // 1. 휴대폰 번호 포맷팅
    const formattedPhone = formatPhoneNumber(countryCode, phoneNumber);
    
    // 2. 인증 코드 생성
    const code = generateVerificationCode();
    
    // 3. 만료 시간 설정 (5분)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // 4. 인증 코드 DB에 저장
    const result = await db.insert(verificationCodes).values({
      phoneNumber: formattedPhone,
      code,
      expiresAt,
      attempts: 0,
      verified: false,
    });
    
    const codeId = result.insertId?.toString() || '';
    
    // 5. SMS 발송 (Twilio)
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
      try {
        await twilioClient.messages.create({
          body: `[Web3 Lotto] 인증 코드: ${code}\n\n5분 내에 입력해주세요.`,
          from: TWILIO_PHONE_NUMBER,
          to: formattedPhone,
        });
        
        console.log(`✅ SMS 발송 성공: ${formattedPhone}`);
        
        return {
          codeId,
          expiresAt,
          success: true,
          message: '인증 코드가 발송되었습니다.',
        };
      } catch (smsError) {
        console.error('❌ SMS 발송 실패:', smsError);
        
        // SMS 발송 실패해도 인증 코드는 저장됨 (개발/테스트용)
        return {
          codeId,
          expiresAt,
          success: false,
          message: 'SMS 발송에 실패했습니다. 나중에 다시 시도해주세요.',
        };
      }
    } else {
      // Twilio 설정이 없는 경우 (개발 환경)
      console.warn('⚠️ Twilio 설정이 없습니다. 테스트 모드로 진행합니다.');
      console.log(`📱 [테스트] 인증 코드: ${code}`);
      
      return {
        codeId,
        expiresAt,
        success: true,
        message: '테스트 모드: 인증 코드가 생성되었습니다.',
      };
    }
  } catch (error) {
    console.error('❌ 인증 코드 발송 중 오류:', error);
    
    return {
      codeId: '',
      expiresAt: new Date(),
      success: false,
      message: '인증 코드 발송 중 오류가 발생했습니다.',
    };
  }
}

/**
 * SMS 인증 코드 검증
 * @param countryCode 국가 코드
 * @param phoneNumber 휴대폰 번호
 * @param code 입력한 인증 코드
 * @returns 검증 결과 및 사용자 정보
 */
export async function verifyCode(
  countryCode: string,
  phoneNumber: string,
  code: string
): Promise<{
  success: boolean;
  message: string;
  userId?: number;
  verified?: boolean;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: 'Database not available',
      };
    }

    // 1. 휴대폰 번호 포맷팅
    const formattedPhone = formatPhoneNumber(countryCode, phoneNumber);
    
    // 2. 가장 최근의 인증 코드 조회
    const records = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.phoneNumber, formattedPhone),
          eq(verificationCodes.verified, false),
          gt(verificationCodes.expiresAt, new Date())
        )
      )
      .orderBy((t: any) => t.createdAt)
      .limit(1);
    
    if (records.length === 0) {
      return {
        success: false,
        message: '유효한 인증 코드가 없습니다. 다시 요청해주세요.',
      };
    }
    
    const record = records[0];
    
    // 3. 재시도 횟수 확인 (최대 5회)
    if (record.attempts >= 5) {
      return {
        success: false,
        message: '재시도 횟수를 초과했습니다. 새 인증 코드를 요청해주세요.',
      };
    }
    
    // 4. 인증 코드 검증
    if (record.code !== code) {
      // 재시도 횟수 증가
      await db
        .update(verificationCodes)
        .set({ attempts: record.attempts + 1 })
        .where(eq(verificationCodes.id, record.id));
      
      return {
        success: false,
        message: `인증 코드가 일치하지 않습니다. (${5 - record.attempts - 1}회 남음)`,
      };
    }
    
    // 5. 인증 완료 표시
    await db
      .update(verificationCodes)
      .set({ verified: true })
      .where(eq(verificationCodes.id, record.id));
    
    console.log(`✅ 인증 성공: ${formattedPhone}`);
    
    return {
      success: true,
      message: '인증이 완료되었습니다.',
      verified: true,
    };
  } catch (error) {
    console.error('❌ 인증 코드 검증 중 오류:', error);
    
    return {
      success: false,
      message: '인증 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 인증 코드 재발송 (기존 코드 무효화)
 * @param countryCode 국가 코드
 * @param phoneNumber 휴대폰 번호
 * @returns 새 인증 코드 정보
 */
export async function resendVerificationCode(
  countryCode: string,
  phoneNumber: string
): Promise<{
  success: boolean;
  message: string;
  codeId?: string;
  expiresAt?: Date;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: 'Database not available',
      };
    }

    // 1. 기존 미검증 코드 모두 무효화
    const formattedPhone = formatPhoneNumber(countryCode, phoneNumber);
    
    await db
      .update(verificationCodes)
      .set({ verified: true }) // 무효화 처리
      .where(
        and(
          eq(verificationCodes.phoneNumber, formattedPhone),
          eq(verificationCodes.verified, false)
        )
      );
    
    // 2. 새 인증 코드 발송
    return await sendVerificationCode(countryCode, phoneNumber);
  } catch (error) {
    console.error('❌ 인증 코드 재발송 중 오류:', error);
    
    return {
      success: false,
      message: '인증 코드 재발송 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 인증 상태 확인
 * @param countryCode 국가 코드
 * @param phoneNumber 휴대폰 번호
 * @returns 인증 상태
 */
export async function getVerificationStatus(
  countryCode: string,
  phoneNumber: string
): Promise<{
  isVerified: boolean;
  expiresAt?: Date;
  attemptsRemaining?: number;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return { isVerified: false };
    }

    const formattedPhone = formatPhoneNumber(countryCode, phoneNumber);
    
    const records = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.phoneNumber, formattedPhone),
          eq(verificationCodes.verified, false),
          gt(verificationCodes.expiresAt, new Date())
        )
      )
      .limit(1);
    
    if (records.length === 0) {
      return { isVerified: false };
    }
    
    const record = records[0];
    
    return {
      isVerified: record.verified,
      expiresAt: record.expiresAt,
      attemptsRemaining: 5 - record.attempts,
    };
  } catch (error) {
    console.error('❌ 인증 상태 확인 중 오류:', error);
    
    return { isVerified: false };
  }
}

export default {
  sendVerificationCode,
  verifyCode,
  resendVerificationCode,
  getVerificationStatus,
};
