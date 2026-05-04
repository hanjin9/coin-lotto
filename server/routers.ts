import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "../shared/const";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { paymentRouter } from "./routers/payment";
import { statisticsRouter } from "./routers/statistics";

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
