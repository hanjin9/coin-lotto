/**
 * Deposit to Ticket - 입금감지 → 응모권 자동발급 통합 로직
 * Mempool Watcher에서 입금을 감지하면 자동으로 응모권을 발급합니다.
 */

import { getDb } from './db';
import { draws, tickets, transactions, users } from '../drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import { DepositTransaction } from './mempool-watcher';

/**
 * 입금 감지 시 자동 응모권 발급 처리
 * @param deposit 감지된 입금 거래
 * @returns 발급된 응모권 정보
 */
export async function processDepositToTicket(
  deposit: DepositTransaction
): Promise<{ ticketId: number; userId: number; status: string } | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot process deposit: database not available');
      return null;
    }

    console.log(`🔄 입금 처리 시작: ${deposit.hash}`);

    // 1. 거래 해시로 중복 확인
    const existingTx = await db.select().from(transactions).where(eq(transactions.txHash, deposit.hash)).limit(1);
    if (existingTx.length > 0) {
      console.log(`⚠️ 이미 처리된 거래: ${deposit.hash}`);
      return null;
    }

    // 2. 지갑 주소 기준 사용자 확인 또는 생성
    const user = await findOrCreateUserByWallet(deposit.from);
    if (!user) {
      console.warn(`⚠️ 사용자를 찾거나 생성할 수 없음: ${deposit.from}`);
      return null;
    }

    // 2-1. 현재 진행 중 회차 확인
    const activeDraws = await db.select().from(draws).orderBy(desc(draws.drawNumber)).limit(1);
    const activeDraw = activeDraws[0] ?? null;
    if (!activeDraw) {
      console.warn('⚠️ 활성 회차가 없어 응모권을 발급할 수 없음');
      return null;
    }

    // 3. 거래 DB에 저장
    await db.insert(transactions).values({
      userId: user.id,
      amount: deposit.value.toString(),
      currency: 'worldcoin',
      txHash: deposit.hash,
      blockNumber: deposit.blockNumber,
      confirmations: deposit.confirmations,
      status: deposit.status === 'pending' || deposit.status === 'confirmed' || deposit.status === 'failed' ? deposit.status : 'pending',
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ 거래 저장됨: ${deposit.hash}`);

    // 4. 입금액을 기반으로 응모권 개수 계산
    // 월드코인 1만원 = 응모권 1개
    const amountInWei = BigInt(deposit.value);
    const tenThousandWon = BigInt('10000000000000000'); // 약 0.01 ETH (임시값)
    const ticketCount = Number(amountInWei / tenThousandWon);

    if (ticketCount <= 0) {
      console.warn(`⚠️ 입금액이 최소 금액 미만: ${amountInWei}`);
      return null;
    }

    console.log(`🎫 발급할 응모권: ${ticketCount}개`);

    // 5. 응모권 자동 생성 (기본 번호: 1~45 중 6개 랜덤 선택)
    const generatedNumbers = generateRandomNumbers(6, 1, 45);
    const numbersJson = JSON.stringify(generatedNumbers);

    // 6. 응모권 DB에 저장
    await db.insert(tickets).values({
      userId: user.id,
      drawId: activeDraw.id,
      numbers: numbersJson,
      purchaseAmount: deposit.value.toString(),
      purchaseCurrency: 'worldcoin',
      purchaseMethod: 'wallet',
      walletAddress: deposit.from,
      transactionHash: deposit.hash,
      status: deposit.status === 'confirmed' ? 'confirmed' : 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`🎉 응모권 발급 완료`);

    // 방금 생성된 응모권 조회
    const newTickets = await db.select().from(tickets).where(eq(tickets.transactionHash, deposit.hash)).limit(1);
    const newTicket = newTickets.length > 0 ? newTickets[0] : null;

    if (!newTicket) {
      console.error('❌ 생성된 응모권을 찾을 수 없음');
      return null;
    }

    return {
      ticketId: newTicket.id,
      userId: user.id,
      status: deposit.status === 'confirmed' ? 'confirmed' : 'pending',
    };
  } catch (error) {
    console.error('❌ 입금 처리 중 오류:', error);
    return null;
  }
}

/**
 * 랜덤 번호 생성 (1~45 중 중복 없이 6개 선택)
 */
function generateRandomNumbers(count: number, min: number, max: number): number[] {
  const numbers = new Set<number>();

  while (numbers.size < count) {
    const random = Math.floor(Math.random() * (max - min + 1)) + min;
    numbers.add(random);
  }

  return Array.from(numbers).sort((a, b) => a - b);
}

/**
 * 지갑 주소로 사용자 찾기 또는 생성
 */
export async function findOrCreateUserByWallet(
  walletAddress: string
): Promise<{ id: number; openId: string } | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot find user: database not available');
      return null;
    }

    // 기존 사용자 찾기
    const existingUserResult = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
    const existingUser = existingUserResult.length > 0 ? existingUserResult[0] : null;

    if (existingUser) {
      return {
        id: existingUser.id,
        openId: existingUser.openId,
      };
    }

    // 새로운 사용자 생성 (임시 openId 사용)
    const tempOpenId = `wallet_${walletAddress}_${Date.now()}`;
    await db.insert(users).values({
      openId: tempOpenId,
      name: `User_${walletAddress.slice(0, 6)}`,
      email: null,
      loginMethod: 'wallet',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    console.log(`👤 새 사용자 생성: ${tempOpenId}`);

    // 생성된 사용자 조회
    const createdUserResult = await db.select().from(users).where(eq(users.openId, tempOpenId)).limit(1);
    const createdUser = createdUserResult.length > 0 ? createdUserResult[0] : null;

    if (!createdUser) {
      console.error('❌ 생성된 사용자를 찾을 수 없음');
      return null;
    }

    return {
      id: createdUser.id,
      openId: tempOpenId,
    };
  } catch (error) {
    console.error('❌ 사용자 찾기/생성 중 오류:', error);
    return null;
  }
}

/**
 * 거래 상태 업데이트 (pending → confirmed)
 */
export async function updateTransactionStatus(
  hash: string,
  status: 'pending' | 'confirmed' | 'failed',
  confirmations: number
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot update transaction: database not available');
      return false;
    }

    await db
      .update(transactions)
      .set({
        status,
        confirmations,
        updatedAt: new Date(),
      })
      .where(eq(transactions.txHash, hash));

    console.log(`✅ 거래 상태 업데이트: ${hash} → ${status}`);

    // 상태가 confirmed로 변경되면 응모권도 업데이트
    if (status === 'confirmed') {
      await db
        .update(tickets)
        .set({
          status: 'confirmed',
          updatedAt: new Date(),
        })
        .where(eq(tickets.transactionHash, hash));

      console.log(`✅ 응모권 상태 업데이트: ${hash} → confirmed`);
    }

    return true;
  } catch (error) {
    console.error('❌ 거래 상태 업데이트 중 오류:', error);
    return false;
  }
}

/**
 * 사용자의 미확인 응모권 조회
 */
export async function getPendingTickets(userId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot get pending tickets: database not available');
      return [];
    }

    const userTickets = await db.select().from(tickets).where(eq(tickets.userId, userId));

    return userTickets.filter((t: any) => t.status === 'pending' || t.status === 'confirmed');
  } catch (error) {
    console.error('❌ 미확인 응모권 조회 중 오류:', error);
    return [];
  }
}

/**
 * 응모권 상태 조회
 */
export async function getTicketStatus(ticketId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot get ticket: database not available');
      return null;
    }

    const ticketResult = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
    const ticket = ticketResult.length > 0 ? ticketResult[0] : null;

    if (!ticket) {
      console.warn(`⚠️ 응모권을 찾을 수 없음: ${ticketId}`);
      return null;
    }

    // 거래 상태 확인
    const txResult = await db.select().from(transactions).where(eq(transactions.txHash, ticket.transactionHash || '')).limit(1);
    const tx = txResult.length > 0 ? txResult[0] : null;

    return {
      ticketId: ticket.id,
      numbers: JSON.parse(ticket.numbers),
      status: ticket.status,
      amount: ticket.purchaseAmount,
      walletAddress: ticket.walletAddress,
      transactionHash: ticket.transactionHash,
      transactionStatus: tx?.status,
      transactionConfirmations: tx?.confirmations,
      createdAt: ticket.createdAt,
    };
  } catch (error) {
    console.error('❌ 응모권 상태 조회 중 오류:', error);
    return null;
  }
}
