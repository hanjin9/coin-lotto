/**
 * 이메일 인증 모듈 (Gmail OAuth 기반)
 * 파일명: server/email-auth.ts
 * 작성자: Manus_AI
 * 작성일: 20260504
 * 
 * 기능:
 * - Gmail 계정으로 로그인
 * - 이메일 검증
 * - 사용자 자동 생성
 */

import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Gmail OAuth 콜백 처리
 * @param email Gmail 이메일 주소
 * @param googleId Google 계정 ID
 * @param name 사용자 이름
 * @param picture 프로필 사진 URL
 * @returns 사용자 정보 및 세션 토큰
 */
export async function handleGmailCallback(
  email: string,
  googleId: string,
  name?: string,
  picture?: string
): Promise<{
  success: boolean;
  message: string;
  userId?: number;
  user?: any;
  sessionToken?: string;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: 'Database not available',
      };
    }

    // 1. 기존 사용자 확인
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    let userId: number;
    
    if (existingUsers.length > 0) {
      // 기존 사용자 - 정보 업데이트
      userId = existingUsers[0].id;
      
      await db
        .update(users)
        .set({
          openId: `google_${googleId}`,
          name: name || existingUsers[0].name,
          lastSignedIn: new Date(),
        })
        .where(eq(users.id, userId));
      
      console.log(`✅ Gmail 로그인 성공 (기존 사용자): ${email}`);
    } else {
      // 신규 사용자 생성
      const result = await db.insert(users).values({
        email,
        openId: `google_${googleId}`,
        name: name || email.split('@')[0],
        phoneNumber: null,
        walletAddress: null,
        lastSignedIn: new Date(),
      });
      
      userId = (result as any).insertId as number;
      
      console.log(`✅ Gmail 로그인 성공 (신규 사용자): ${email}`);
    }
    
    // 2. 사용자 정보 조회
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (userRecords.length === 0) {
      return {
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.',
      };
    }
    
    const user = userRecords[0];
    
    // 3. 세션 토큰 생성 (실제 구현에서는 JWT 사용)
    const sessionToken = Buffer.from(`${userId}:${Date.now()}`).toString('base64');
    
    return {
      success: true,
      message: '로그인이 완료되었습니다.',
      userId,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      sessionToken,
    };
  } catch (error) {
    console.error('❌ Gmail 로그인 처리 중 오류:', error);
    
    return {
      success: false,
      message: 'Gmail 로그인 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 이메일 검증 (선택사항)
 * @param email 이메일 주소
 * @returns 검증 결과
 */
export async function validateEmail(email: string): Promise<{
  isValid: boolean;
  message: string;
}> {
  // 기본 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: '유효한 이메일 주소가 아닙니다.',
    };
  }
  
  // Gmail 도메인 확인
  if (!email.endsWith('@gmail.com')) {
    return {
      isValid: false,
      message: 'Gmail 계정만 사용 가능합니다.',
    };
  }
  
  return {
    isValid: true,
    message: '유효한 Gmail 주소입니다.',
  };
}

/**
 * 이메일로 사용자 조회
 * @param email 이메일 주소
 * @returns 사용자 정보
 */
export async function getUserByEmail(email: string): Promise<any | null> {
  try {
    const db = await getDb();
    if (!db) {
      return null;
    }

    const records = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return records.length > 0 ? records[0] : null;
  } catch (error) {
    console.error('❌ 이메일로 사용자 조회 중 오류:', error);
    return null;
  }
}

export default {
  handleGmailCallback,
  validateEmail,
  getUserByEmail,
};
