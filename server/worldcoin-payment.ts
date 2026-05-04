/**
 * Worldcoin Payment - 월드코인 결제 처리
 * 사용자가 월드코인으로 로또 응모권을 구매합니다.
 */

import { getDb } from './db';
import { tickets, transactions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { findOrCreateUserByWallet, processDepositToTicket } from './deposit-to-ticket';
import { DepositTransaction } from './mempool-watcher';

/**
 * 월드코인 결제 설정
 */
export interface WorldcoinPaymentConfig {
  amount: string; // 결제 금액 (wei)
  userAddress: string; // 사용자 지갑 주소
  recipientAddress: string; // 수령 지갑 주소
  ticketNumbers?: number[]; // 응모 번호 (선택사항)
}

/**
 * 월드코인 결제 결과
 */
export interface WorldcoinPaymentResult {
  transactionHash: string;
  amount: string;
  userAddress: string;
  status: 'pending' | 'confirmed' | 'failed';
  ticketId?: number;
  createdAt: Date;
}

/**
 * 월드코인 결제 금액 검증
 */
export function validatePaymentAmount(amount: string): boolean {
  try {
    const amountBigInt = BigInt(amount);
    // 최소 금액: 1만원 상당 (약 0.01 ETH)
    const minAmount = BigInt('10000000000000000');

    if (amountBigInt < minAmount) {
      console.error(`❌ 결제 금액이 최소 금액 미만: ${amount}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ 결제 금액 검증 중 오류:', error);
    return false;
  }
}

/**
 * 결제 금액으로 응모권 개수 계산
 */
export function calculateTicketCount(amount: string): number {
  try {
    const amountBigInt = BigInt(amount);
    // 1만원 = 1응모권
    const tenThousandWon = BigInt('10000000000000000');
    const ticketCount = Number(amountBigInt / tenThousandWon);

    return ticketCount;
  } catch (error) {
    console.error('❌ 응모권 개수 계산 중 오류:', error);
    return 0;
  }
}

/**
 * 월드코인 결제 처리
 */
export async function processWorldcoinPayment(
  config: WorldcoinPaymentConfig
): Promise<WorldcoinPaymentResult | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot process payment: database not available');
      return null;
    }

    console.log(`💳 월드코인 결제 처리 시작`);
    console.log(`   금액: ${config.amount}`);
    console.log(`   사용자: ${config.userAddress}`);

    // 1. 결제 금액 검증
    if (!validatePaymentAmount(config.amount)) {
      return null;
    }

    console.log(`✅ 결제 금액 검증 완료`);

    // 2. 응모권 개수 계산
    const ticketCount = calculateTicketCount(config.amount);
    console.log(`🎫 발급할 응모권: ${ticketCount}개`);

    // 3. 거래 기록 생성
    const transactionHash = `0x${Buffer.from(JSON.stringify({
      from: config.userAddress,
      to: config.recipientAddress,
      amount: config.amount,
      timestamp: Date.now(),
    })).toString('hex').slice(0, 64)}`;

    const createdAt = new Date();

    // 4. 사용자 확인 후 거래 DB에 저장
    const user = await findOrCreateUserByWallet(config.userAddress);
    if (!user) {
      console.error('❌ 결제 사용자 확인 실패');
      return null;
    }

    await db.insert(transactions).values({
      userId: user.id,
      amount: config.amount,
      currency: 'worldcoin',
      txHash: transactionHash,
      blockNumber: null,
      confirmations: 0,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      createdAt,
      updatedAt: createdAt,
    });

    console.log(`✅ 거래 저장됨: ${transactionHash}`);

    // 5. 응모권 자동 생성
    const depositTx: DepositTransaction = {
      hash: transactionHash,
      from: config.userAddress,
      to: config.recipientAddress,
      value: BigInt(config.amount),
      blockNumber: null,
      confirmations: 0,
      status: 'pending',
      timestamp: createdAt,
    };

    const ticketResult = await processDepositToTicket(depositTx);

    if (!ticketResult) {
      console.error('❌ 응모권 발급 실패');
      return null;
    }

    console.log(`🎉 결제 처리 완료`);

    return {
      transactionHash,
      amount: config.amount,
      userAddress: config.userAddress,
      status: 'pending',
      ticketId: ticketResult.ticketId,
      createdAt,
    };
  } catch (error) {
    console.error('❌ 월드코인 결제 처리 중 오류:', error);
    return null;
  }
}

/**
 * 결제 상태 조회
 */
export async function getPaymentStatus(transactionHash: string) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot get payment status: database not available');
      return null;
    }

    const txResult = await db.select().from(transactions).where(eq(transactions.txHash, transactionHash)).limit(1);
    const tx = txResult.length > 0 ? txResult[0] : null;

    if (!tx) {
      console.warn(`⚠️ 거래를 찾을 수 없음: ${transactionHash}`);
      return null;
    }

    // 연관된 응모권 찾기
    const ticketsResult = await db.select().from(tickets).where(eq(tickets.transactionHash, transactionHash));
    const ticket = ticketsResult.length > 0 ? ticketsResult[0] : null;

    return {
      transactionHash: tx.txHash,
      amount: tx.amount,
      from: null,
      to: null,
      status: tx.status,
      confirmations: tx.confirmations,
      blockNumber: tx.blockNumber,
      ticketId: ticket?.id,
      ticketStatus: ticket?.status,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
    };
  } catch (error) {
    console.error('❌ 결제 상태 조회 중 오류:', error);
    return null;
  }
}

/**
 * 사용자의 결제 기록 조회
 */
export async function getUserPaymentHistory(userAddress: string) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot get payment history: database not available');
      return [];
    }

    const user = await findOrCreateUserByWallet(userAddress);
    if (!user) return [];

    const payments = await db.select().from(transactions).where(eq(transactions.userId, user.id));

    return payments.map((tx) => ({
      transactionHash: tx.txHash,
      amount: tx.amount,
      status: tx.status,
      confirmations: tx.confirmations,
      createdAt: tx.createdAt,
    }));
  } catch (error) {
    console.error('❌ 결제 기록 조회 중 오류:', error);
    return [];
  }
}

/**
 * 결제 확인 (pending → confirmed)
 */
export async function confirmPayment(transactionHash: string, blockNumber: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot confirm payment: database not available');
      return false;
    }

    await db
      .update(transactions)
      .set({
        status: 'confirmed',
        blockNumber,
        confirmations: 1,
        updatedAt: new Date(),
      })
      .where(eq(transactions.txHash, transactionHash));

    console.log(`✅ 결제 확인됨: ${transactionHash}`);

    // 연관된 응모권도 업데이트
    await db
      .update(tickets)
      .set({
        status: 'confirmed',
        updatedAt: new Date(),
      })
      .where(eq(tickets.transactionHash, transactionHash));

    console.log(`✅ 응모권 상태 업데이트: confirmed`);

    return true;
  } catch (error) {
    console.error('❌ 결제 확인 중 오류:', error);
    return false;
  }
}

/**
 * 결제 실패 처리
 */
export async function failPayment(transactionHash: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot fail payment: database not available');
      return false;
    }

    await db
      .update(transactions)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(transactions.txHash, transactionHash));

    console.log(`❌ 결제 실패: ${transactionHash}`);

    return true;
  } catch (error) {
    console.error('❌ 결제 실패 처리 중 오류:', error);
    return false;
  }
}
