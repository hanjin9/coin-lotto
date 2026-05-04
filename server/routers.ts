import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "../shared/const";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { paymentRouter } from "./routers/payment";
import { statisticsRouter } from "./routers/statistics";
import { sendVerificationCode, verifyCode, resendVerificationCode } from "./sms-auth";
import { handleGmailCallback, validateEmail } from "./email-auth";
import { handleNaverCallback } from "./naver-auth";
import { signupWithPhone, signupWithEmail } from "./simple-signup";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    
    // SMS 인증 - 코드 발송
    sendPhoneVerification: publicProcedure
      .input(
        z.object({
          countryCode: z.string().default("82"), // 한국 기본값
          phoneNumber: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await sendVerificationCode(input.countryCode, input.phoneNumber);
      }),
    
    // SMS 인증 - 코드 검증
    verifyPhoneCode: publicProcedure
      .input(
        z.object({
          countryCode: z.string().default("82"),
          phoneNumber: z.string(),
          code: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await verifyCode(input.countryCode, input.phoneNumber, input.code);
      }),
    
    // SMS 인증 - 코드 재발송
    resendPhoneVerification: publicProcedure
      .input(
        z.object({
          countryCode: z.string().default("82"),
          phoneNumber: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await resendVerificationCode(input.countryCode, input.phoneNumber);
      }),
    
    // Gmail 로그인
    loginWithGmail: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          googleId: z.string(),
          name: z.string().optional(),
          picture: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const result = await handleGmailCallback(
          input.email,
          input.googleId,
          input.name,
          input.picture
        );
        
        if (result.success && result.sessionToken) {
          // 세션 쿠키 설정
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, result.sessionToken, cookieOptions);
        }
        
        return result;
      }),
    
    // 이메일 검증
    validateEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        return await validateEmail(input.email);
      }),
    
    // Naver 로그인
    loginWithNaver: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          naverId: z.string(),
          name: z.string().optional(),
          picture: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const result = await handleNaverCallback(
          input.email,
          input.naverId,
          input.name,
          input.picture
        );
        
        if (result.success && result.sessionToken) {
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, result.sessionToken, cookieOptions);
        }
        
        return result;
      }),
    
    // 간편 회원가입 - 휴대폰
    signupWithPhone: publicProcedure
      .input(
        z.object({
          name: z.string(),
          countryCode: z.string().default("82"),
          phoneNumber: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await signupWithPhone(input.name, input.countryCode, input.phoneNumber);
      }),
    
    // 간편 회원가입 - 이메일
    signupWithEmail: publicProcedure
      .input(
        z.object({
          name: z.string(),
          email: z.string().email(),
        })
      )
      .mutation(async ({ input }) => {
        return await signupWithEmail(input.name, input.email);
      }),
  }),

  // Payment 라우터 (월드코인 결제)
  payment: paymentRouter,

  // Statistics 라우터 (통계 분석)
  statistics: statisticsRouter,

  // Lottery 라우터
  lottery: router({
    // 번호 선택 및 응모
    submit: protectedProcedure
      .input(
        z.object({
          numbers: z.array(z.number().min(1).max(45)).length(6),
          walletAddress: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const db = await getDb();
          if (!db) {
            throw new Error('Database not available');
          }

          console.log(`✅ 응모 접수: 사용자 ${ctx.user.id}, 번호 ${input.numbers}`);

          // 응모 정보 저장 (나중에 DB 저장 추가)
          return {
            success: true,
            message: '응모가 완료되었습니다.',
            numbers: input.numbers.sort((a, b) => a - b),
            timestamp: new Date(),
          };
        } catch (error) {
          console.error('Lottery submit error:', error);
          throw new Error('응모 중 오류가 발생했습니다.');
        }
      }),

    // 사용자의 응모 목록 조회
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(10),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        try {
          const db = await getDb();
          if (!db) {
            throw new Error('Database not available');
          }

          console.log(`📋 응모 목록 조회: 사용자 ${ctx.user.id}`);

          // 임시 응모 목록 반환 (나중에 DB 조회로 변경)
          return [
            {
              id: 1,
              numbers: [1, 5, 10, 15, 20, 25],
              status: 'pending',
              walletAddress: null,
              createdAt: new Date(),
            },
          ];
        } catch (error) {
          console.error('Lottery list error:', error);
          throw new Error('응모 목록 조회 중 오류가 발생했습니다.');
        }
      }),

    // 응모 상세 조회
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          const db = await getDb();
          if (!db) {
            throw new Error('Database not available');
          }

          console.log(`🔍 응모 상세 조회: ID ${input.id}`);

          // 임시 응모 정보 반환 (나중에 DB 조회로 변경)
          return {
            id: input.id,
            numbers: [1, 5, 10, 15, 20, 25],
            status: 'pending',
            walletAddress: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        } catch (error) {
          console.error('Lottery get error:', error);
          throw new Error('응모 상세 조회 중 오류가 발생했습니다.');
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
