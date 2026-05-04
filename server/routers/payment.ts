/**
 * Payment Router - 월드코인 결제 tRPC 라우터
 */

import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  processWorldcoinPayment,
  getPaymentStatus,
  getUserPaymentHistory,
  confirmPayment,
  failPayment,
} from '../worldcoin-payment';

export const paymentRouter = router({
  /**
   * 월드코인 결제 처리
   */
  processPayment: publicProcedure
    .input(
      z.object({
        amount: z.string(),
        userAddress: z.string(),
        recipientAddress: z.string(),
        ticketNumbers: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await processWorldcoinPayment({
        amount: input.amount,
        userAddress: input.userAddress,
        recipientAddress: input.recipientAddress,
        ticketNumbers: input.ticketNumbers,
      });

      if (!result) {
        throw new Error('결제 처리 실패');
      }

      return result;
    }),

  /**
   * 결제 상태 조회
   */
  getStatus: publicProcedure
    .input(z.object({ transactionHash: z.string() }))
    .query(async ({ input }) => {
      const status = await getPaymentStatus(input.transactionHash);

      if (!status) {
        throw new Error('결제를 찾을 수 없습니다');
      }

      return status;
    }),

  /**
   * 사용자 결제 기록 조회
   */
  getHistory: publicProcedure
    .input(z.object({ userAddress: z.string() }))
    .query(async ({ input }) => {
      const history = await getUserPaymentHistory(input.userAddress);
      return history;
    }),

  /**
   * 결제 확인
   */
  confirm: publicProcedure
    .input(
      z.object({
        transactionHash: z.string(),
        blockNumber: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await confirmPayment(input.transactionHash, input.blockNumber);

      if (!success) {
        throw new Error('결제 확인 실패');
      }

      return { success: true };
    }),

  /**
   * 결제 실패 처리
   */
  fail: publicProcedure
    .input(z.object({ transactionHash: z.string() }))
    .mutation(async ({ input }) => {
      const success = await failPayment(input.transactionHash);

      if (!success) {
        throw new Error('결제 실패 처리 실패');
      }

      return { success: true };
    }),
});
