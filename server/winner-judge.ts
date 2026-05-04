/**
 * Winner Judge - 당첨자 판별 로직
 * 응모권과 당첨번호를 비교하여 당첨자를 판별하고 상금을 계산합니다.
 */

import { getDb } from './db';
import { draws, lotteryWinners, tickets } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

interface WinnerResult {
  ticketId: number;
  userId: number;
  matchedNumbers: number;
  rank: number | null;
  prizeAmount: bigint;
}

// 등급별 상금 (기본값)
const PRIZE_TABLE = {
  1: BigInt('2000000000'), // 1등: 20억
  2: BigInt('50000000'),   // 2등: 5천만
  3: BigInt('1000000'),    // 3등: 100만
  4: BigInt('50000'),      // 4등: 5만
  5: BigInt('5000'),       // 5등: 5천
};

/**
 * 두 번호 배열 비교 - 맞은 번호 개수 계산
 */
function countMatchedNumbers(userNumbers: number[], winningNumbers: number[]): number {
  const winningSet = new Set(winningNumbers);
  return userNumbers.filter(num => winningSet.has(num)).length;
}

/**
 * 맞은 번호 개수로 등급 판별
 */
function determineRank(matchedCount: number, hasBonus: boolean): number | null {
  if (matchedCount === 6) return 1; // 1등
  if (matchedCount === 5 && hasBonus) return 2; // 2등
  if (matchedCount === 5) return 3; // 3등
  if (matchedCount === 4) return 4; // 4등
  if (matchedCount === 3) return 5; // 5등
  return null; // 낙첨
}

/**
 * 상금 계산
 */
function calculatePrize(rank: number | null, totalPrize: bigint, winnerCount: number): bigint {
  if (!rank || !PRIZE_TABLE[rank as keyof typeof PRIZE_TABLE]) {
    return BigInt(0);
  }

  // 기본 상금 테이블 사용 (실제로는 총상금을 등급별로 분배)
  return PRIZE_TABLE[rank as keyof typeof PRIZE_TABLE];
}

/**
 * 당첨자 판별 및 상금 계산
 */
export async function judgeWinners(
  drawId: number,
  winningNumbers: number[],
  bonusNumber: number,
  totalPrize: bigint
): Promise<WinnerResult[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // 모든 응모권 조회
  const confirmedTickets = await db
    .select()
    .from(tickets)
    .where(eq(tickets.status, 'confirmed'));

  const winners: WinnerResult[] = [];
  const winnerRecords = [];

  // 각 응모권 검사
  for (const ticket of confirmedTickets) {
    const userNumbers = JSON.parse(ticket.numbers) as number[];
    const matchedCount = countMatchedNumbers(userNumbers, winningNumbers);
    const hasBonus = userNumbers.includes(bonusNumber);
    const rank = determineRank(matchedCount, hasBonus);

    if (rank) {
      const prizeAmount = calculatePrize(rank, totalPrize, 1);

      winners.push({
        ticketId: ticket.id,
        userId: ticket.userId,
        matchedNumbers: matchedCount,
        rank,
        prizeAmount,
      });

      // 당첨자 기록 저장
      winnerRecords.push({
        ticketId: ticket.id,
        drawId,
        userId: ticket.userId,
        matchedNumbers: matchedCount,
        prizeAmount: prizeAmount.toString(),
        prizeRank: rank,
        taxAmount: '0',
        netAmount: prizeAmount.toString(),
      });
    }
  }

  // 당첨자 기록 저장
  if (winnerRecords.length > 0) {
    await db.insert(lotteryWinners).values(winnerRecords);
  }

  // 당첨 결과 저장
  const now = new Date();
  await db.insert(draws).values({
    drawNumber: drawId,
    drawDate: now,
    startTime: now,
    endTime: now,
    winningNumbers: JSON.stringify(winningNumbers),
    bonusNumber,
    totalPrizePool: totalPrize.toString(),
    status: 'drawn',
    blockchainStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  });

  return winners;
}

/**
 * 당첨자 목록 조회
 */
export async function getWinners(drawId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  return await db
    .select()
    .from(lotteryWinners)
    .where(eq(lotteryWinners.drawId, drawId));
}

/**
 * 사용자의 당첨 기록 조회
 */
export async function getUserWinnings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  return await db
    .select()
    .from(lotteryWinners)
    .where(eq(lotteryWinners.userId, userId));
}

/**
 * 당첨 결과 조회
 */
export async function getDrawResult(drawId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result = await db
    .select()
      .from(draws)
      .where(eq(draws.drawNumber, drawId))
    .limit(1);

  return result[0] || null;
}
