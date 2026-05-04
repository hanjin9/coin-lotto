import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

/**
 * 무기명 로그인 라우터
 * 
 * 기능:
 * 1. 휴대폰/이메일 인증 코드 요청
 * 2. 인증 코드 검증 및 세션 생성
 * 3. 로그아웃
 */

// 이메일 전송 설정 (실제 환경에서는 환경변수로 설정)
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
});

// SMS 전송 설정 (Twilio 또는 다른 서비스)
// 실제 구현 시 Twilio SDK 사용
const sendSMS = async (phoneNumber: string, code: string): Promise<void> => {
  console.log(`📱 SMS 발송: ${phoneNumber} - 코드: ${code}`);
  // 실제: Twilio 또는 다른 SMS 서비스 호출
};

// 이메일 발송
const sendEmail = async (email: string, code: string): Promise<void> => {
  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@wldlotto.com',
      to: email,
      subject: '[WLD LOTTO] 인증 코드',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #333;">WLD LOTTO 인증 코드</h2>
          <p style="font-size: 16px; color: #666;">
            아래 인증 코드를 입력하여 로그인을 완료해주세요.
          </p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="font-size: 32px; font-weight: bold; color: #FFD700; letter-spacing: 4px;">
              ${code}
            </p>
          </div>
          <p style="font-size: 14px; color: #999;">
            이 코드는 5분 동안 유효합니다.
          </p>
        </div>
      `,
    });
    console.log(`📧 이메일 발송 완료: ${email}`);
  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: '이메일 발송 중 오류가 발생했습니다.',
    });
  }
};

// 인증 코드 생성
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 인증 코드 저장소 (실제: Redis 또는 DB 사용)
const verificationStore = new Map<
  string,
  {
    code: string;
    expiresAt: number;
    attempts: number;
    maxAttempts: number;
  }
>();

export const authRouter = router({
  /**
   * 인증 코드 요청
   * 휴대폰 또는 이메일로 6자리 인증 코드 발송
   */
  requestVerificationCode: publicProcedure
    .input(
      z.object({
        contact: z.string().min(1),
        type: z.enum(['phone', 'email']),
      })
    )
    .mutation(async ({ input }) => {
      const { contact, type } = input;

      // 휴대폰 번호 검증
      if (type === 'phone') {
        const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
        if (!phoneRegex.test(contact.replace(/\s/g, ''))) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '유효한 휴대폰 번호를 입력해주세요.',
          });
        }
      }

      // 이메일 검증
      if (type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contact)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '유효한 이메일 주소를 입력해주세요.',
          });
        }
      }

      // 인증 코드 생성
      const code = generateVerificationCode();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5분

      // 저장소에 저장
      verificationStore.set(contact, {
        code,
        expiresAt,
        attempts: 0,
        maxAttempts: 3,
      });

      // 인증 코드 발송
      if (type === 'phone') {
        await sendSMS(contact, code);
      } else {
        await sendEmail(contact, code);
      }

      return {
        success: true,
        message: `${type === 'phone' ? 'SMS' : '이메일'}로 인증 코드를 발송했습니다.`,
        expiresIn: 300, // 5분 (초 단위)
      };
    }),

  /**
   * 인증 코드 검증 및 로그인
   */
  verifyCode: publicProcedure
    .input(
      z.object({
        contact: z.string().min(1),
        code: z.string().length(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { contact, code } = input;

      // 저장된 인증 코드 확인
      const stored = verificationStore.get(contact);

      if (!stored) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '인증 코드 요청 기록이 없습니다. 다시 요청해주세요.',
        });
      }

      // 만료 시간 확인
      if (Date.now() > stored.expiresAt) {
        verificationStore.delete(contact);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '인증 코드가 만료되었습니다. 다시 요청해주세요.',
        });
      }

      // 시도 횟수 확인
      if (stored.attempts >= stored.maxAttempts) {
        verificationStore.delete(contact);
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: '인증 시도 횟수를 초과했습니다. 다시 요청해주세요.',
        });
      }

      // 인증 코드 검증
      if (code !== stored.code) {
        stored.attempts += 1;
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `인증 코드가 일치하지 않습니다. (${stored.attempts}/${stored.maxAttempts})`,
        });
      }

      // 인증 성공 - 저장소에서 제거
      verificationStore.delete(contact);

      // 세션 토큰 생성
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const sessionId = crypto.randomBytes(16).toString('hex');

      // 실제: DB에 세션 저장
      // await db.sessions.create({
      //   sessionId,
      //   contact,
      //   token: sessionToken,
      //   expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일
      // });

      // 쿠키에 세션 저장
      ctx.res?.setHeader(
        'Set-Cookie',
        `sessionId=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}`
      );

      return {
        success: true,
        message: '로그인 성공!',
        sessionId,
        token: sessionToken,
      };
    }),

  /**
   * 현재 사용자 정보 조회
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user?.id,
      email: ctx.user?.email,
      role: ctx.user?.role,
    };
  }),

  /**
   * 로그아웃
   */
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    // 쿠키 삭제
    ctx.res?.setHeader(
      'Set-Cookie',
      'sessionId=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    );

    return {
      success: true,
      message: '로그아웃 되었습니다.',
    };
  }),
});
