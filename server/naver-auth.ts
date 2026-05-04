/**
 * Naver OAuth 인증 모듈
 * 파일명: server/naver-auth.ts
 * 작성자: Manus_AI
 * 작성일: 20260504
 * 
 * 기능:
 * - Naver 계정으로 로그인
 * - 사용자 자동 생성
 */

import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Naver OAuth 콜백 처리
 * @param email Naver 이메일
 * @param naverId Naver 계정 ID
 * @param name 사용자 이름
 * @param picture 프로필 사진 URL
 * @returns 사용자 정보 및 세션 토큰
 */
export async function handleNaverCallback(
  email: string,
  naverId: string,
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
          openId: `naver_${naverId}`,
          name: name || existingUsers[0].name,
          lastSignedIn: new Date(),
        })
        .where(eq(users.id, userId));
      
      console.log(`✅ Naver 로그인 성공 (기존 사용자): ${email}`);
    } else {
      // 신규 사용자 생성
      const result = await db.insert(users).values({
        email,
        openId: `naver_${naverId}`,
        name: name || email.split('@')[0],
        phoneNumber: null,
        walletAddress: null,
        lastSignedIn: new Date(),
      });
      
      userId = (result as any).insertId as number;
      
      console.log(`✅ Naver 로그인 성공 (신규 사용자): ${email}`);
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
    
    // 3. 세션 토큰 생성
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
    console.error('❌ Naver 로그인 처리 중 오류:', error);
    
    return {
      success: false,
      message: 'Naver 로그인 중 오류가 발생했습니다.',
    };
  }
}

export default {
  handleNaverCallback,
};
