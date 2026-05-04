/**
 * 간편 회원가입 모듈
 * 파일명: server/simple-signup.ts
 * 작성자: Manus_AI
 * 작성일: 20260504
 * 
 * 기능:
 * - 휴대폰 번호 회원가입 (국가코드 필수)
 * - 이메일 회원가입
 * - 비밀번호 자동 생성 (간편)
 * - 사용자 자동 생성
 */

import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * 비밀번호 자동 생성 (휴대폰 뒷자리 4자리)
 * @param phoneNumber 휴대폰 번호
 * @returns 자동 생성된 비밀번호
 */
function generatePasswordFromPhone(phoneNumber: string): string {
  // 숫자만 추출
  const cleaned = phoneNumber.replace(/\D/g, '');
  // 뒷자리 4자리 추출
  return cleaned.slice(-4);
}

/**
 * 비밀번호 해싱 (간단한 예제)
 * 실제 운영 환경에서는 bcrypt 사용 권장
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * 휴대폰 번호 포맷팅
 * @param countryCode 국가 코드 (예: "82" 또는 "+82")
 * @param phoneNumber 휴대폰 번호
 * @returns 포맷된 휴대폰 번호
 */
function formatPhoneNumber(countryCode: string, phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  const code = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  return `${code}${cleaned}`;
}

/**
 * 휴대폰 번호로 회원가입
 * @param name 사용자 이름
 * @param countryCode 국가 코드
 * @param phoneNumber 휴대폰 번호
 * @returns 회원가입 결과
 */
export async function signupWithPhone(
  name: string,
  countryCode: string,
  phoneNumber: string
): Promise<{
  success: boolean;
  message: string;
  userId?: number;
  user?: any;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: 'Database not available',
      };
    }

    // 1. 입력값 검증
    if (!name || name.trim().length < 2) {
      return {
        success: false,
        message: '이름은 2자 이상이어야 합니다.',
      };
    }
    
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      return {
        success: false,
        message: '유효한 휴대폰 번호를 입력해주세요.',
      };
    }
    
    // 2. 휴대폰 번호 포맷팅
    const formattedPhone = formatPhoneNumber(countryCode, phoneNumber);
    
    // 3. 중복 확인
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, formattedPhone))
      .limit(1);
    
    if (existingUsers.length > 0) {
      return {
        success: false,
        message: '이미 가입된 휴대폰 번호입니다.',
      };
    }
    
    // 4. 비밀번호 자동 생성 (휴대폰 뒷자리 4자리)
    const autoPassword = generatePasswordFromPhone(phoneNumber);
    const hashedPassword = hashPassword(autoPassword);
    
    // 5. 사용자 생성
    const openId = `phone_${formattedPhone}_${Date.now()}`;
    const result = await db.insert(users).values({
      openId,
      name: name.trim(),
      phoneNumber: formattedPhone,
      loginMethod: 'phone',
      role: 'user',
      status: 'active',
    });
    
    const userId = (result as any).insertId as number;
    console.log(`✅ 휴대폰 회원가입 성공: ${formattedPhone}`);
    
    // 6. 사용자 정보 반환
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    const user = userRecords[0];
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다. 비밀번호는 휴대폰 뒷자리 4자리입니다.',
      userId,
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    };
  } catch (error) {
    console.error('❌ 휴대폰 회원가입 중 오류:', error);
    
    return {
      success: false,
      message: '회원가입 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 이메일로 회원가입
 * @param name 사용자 이름
 * @param email 이메일 주소
 * @returns 회원가입 결과
 */
export async function signupWithEmail(
  name: string,
  email: string
): Promise<{
  success: boolean;
  message: string;
  userId?: number;
  user?: any;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: 'Database not available',
      };
    }

    // 1. 입력값 검증
    if (!name || name.trim().length < 2) {
      return {
        success: false,
        message: '이름은 2자 이상이어야 합니다.',
      };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: '유효한 이메일 주소를 입력해주세요.',
      };
    }
    
    // 2. 중복 확인
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUsers.length > 0) {
      return {
        success: false,
        message: '이미 가입된 이메일입니다.',
      };
    }
    
    // 3. 비밀번호 자동 생성 (간단한 기본값)
    // 이메일 사용자는 이메일 앞부분 4자리
    const emailPrefix = email.split('@')[0];
    const autoPassword = emailPrefix.slice(0, 4) || 'pass';
    const hashedPassword = hashPassword(autoPassword);
    
    // 4. 사용자 생성
    const openId = `email_${email}_${Date.now()}`;
    const result = await db.insert(users).values({
      openId,
      name: name.trim(),
      email,
      loginMethod: 'email',
      role: 'user',
      status: 'active',
    });
    
    const userId = (result as any).insertId as number;
    console.log(`✅ 이메일 회원가입 성공: ${email}`);
    
    // 5. 사용자 정보 반환
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    const user = userRecords[0];
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다. 로그인 후 비밀번호를 변경해주세요.',
      userId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    console.error('❌ 이메일 회원가입 중 오류:', error);
    
    return {
      success: false,
      message: '회원가입 중 오류가 발생했습니다.',
    };
  }
}

export default {
  signupWithPhone,
  signupWithEmail,
};
