/**
 * Lottery Draw - 관리자 추첨 로직
 * 당첨번호 입력 → 당첨자 자동 선정 → 상금 배분 → 블록체인 기록
 */

import { getDb } from './db';
import { draws, lotteryWinners, tickets } from '../drizzle/schema';
import { and, eq } from 'drizzle-orm';

/**
 * 추첨 설정
 */
export interface DrawConfig {
  drawId: number;
  winningNumbers: number[]; // 당첨번호 (6개)
  totalPrize: string; // 총 상금 (wei)
  prizeDistribution: {
    rank1: string; // 6개 일치 상금
    rank2: string; // 5개 일치 상금
    rank3: string; // 4개 일치 상금
    rank4: string; // 3개 일치 상금
  };
}

/**
 * 당첨자 선정 결과
 */
export interface DrawResult {
  drawId: number;
  winningNumbers: number[];
  winners: {
    rank: number;
    count: number;
    prizeAmount: string;
    winners: Array<{
      ticketId: number;
      userId: number;
      matchedNumbers: number;
      prizeAmount: string;
    }>;
  }[];
  totalPrizeDistributed: string;
  blockchainRecorded: boolean;
  recordedAt?: Date;
}

/**
 * 당첨번호 유효성 검사
 */
export function validateWinningNumbers(numbers: number[]): boolean {
  // 6개 번호 확인
  if (numbers.length !== 6) {
    console.error('❌ 당첨번호는 정확히 6개여야 합니다');
    return false;
  }

  // 1~45 범위 확인
  if (!numbers.every((n) => n >= 1 && n <= 45)) {
    console.error('❌ 당첨번호는 1~45 범위여야 합니다');
    return false;
  }

  // 중복 확인
  if (new Set(numbers).size !== 6) {
    console.error('❌ 당첨번호에 중복이 있습니다');
    return false;
  }

  return true;
}

/**
 * 응모권과 당첨번호 매칭
 */
function matchTicketNumbers(ticketNumbers: number[], winningNumbers: number[]): number {
  const matchCount = ticketNumbers.filter((n) => winningNumbers.includes(n)).length;
  return matchCount;
}

/**
 * 매칭 개수에 따른 등급 결정
 */
function getRankByMatchCount(matchCount: number): number | null {
  if (matchCount === 6) return 1;
  if (matchCount === 5) return 2;
  if (matchCount === 4) return 3;
  if (matchCount === 3) return 4;
  return null; // 당첨 안 됨
}

/**
 * 추첨 실행 및 당첨자 선정
 */
export async function executeDraw(config: DrawConfig): Promise<DrawResult | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot execute draw: database not available');
      return null;
    }

    console.log(`🎰 추첨 시작: Draw ID ${config.drawId}`);

    // 1. 당첨번호 유효성 검사
    if (!validateWinningNumbers(config.winningNumbers)) {
      return null;
    }

    console.log(`✅ 당첨번호 검증 완료: ${config.winningNumbers.join(', ')}`);

    // 2. 확정된 모든 응모권 조회
    const allTickets = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.status, 'confirmed'), eq(tickets.drawId, config.drawId)));

    if (allTickets.length === 0) {
      console.warn('⚠️ 확정된 응모권이 없습니다');
      return null;
    }

    console.log(`📊 총 응모권: ${allTickets.length}개`);

    // 3. 당첨자 선정
    const winnersByRank = new Map<number, Array<{ ticketId: number; userId: number; prizeAmount: string }>>();

    for (const ticket of allTickets) {
      const ticketNumbers = JSON.parse(ticket.numbers) as number[];
      const matchCount = matchTicketNumbers(ticketNumbers, config.winningNumbers);
      const rank = getRankByMatchCount(matchCount);

      if (rank) {
        if (!winnersByRank.has(rank)) {
          winnersByRank.set(rank, []);
        }

        // 상금 결정
        let prizeAmount = '0';
        if (rank === 1) prizeAmount = config.prizeDistribution.rank1;
        else if (rank === 2) prizeAmount = config.prizeDistribution.rank2;
        else if (rank === 3) prizeAmount = config.prizeDistribution.rank3;
        else if (rank === 4) prizeAmount = config.prizeDistribution.rank4;

        winnersByRank.get(rank)!.push({
          ticketId: ticket.id,
          userId: ticket.userId,
          prizeAmount,
        });
      }
    }

    console.log(`🏆 당첨자 선정 완료`);

    // 4. 당첨 결과 DB에 저장
    const drawTime = new Date();
    const existingDraw = await db.select().from(draws).where(eq(draws.id, config.drawId)).limit(1);

    if (existingDraw.length > 0) {
      await db
        .update(draws)
        .set({
          winningNumbers: JSON.stringify(config.winningNumbers),
          totalPrizePool: config.totalPrize,
          status: 'drawn',
          updatedAt: drawTime,
        })
        .where(eq(draws.id, config.drawId));
    } else {
      await db.insert(draws).values({
        drawNumber: config.drawId,
        drawDate: drawTime,
        startTime: drawTime,
        endTime: drawTime,
        winningNumbers: JSON.stringify(config.winningNumbers),
        totalPrizePool: config.totalPrize,
        status: 'drawn',
        blockchainStatus: 'pending',
        createdAt: drawTime,
        updatedAt: drawTime,
      });
    }

    console.log(`✅ 추첨 결과 저장됨`);

    // 5. 당찬자 정보 DB에 저장
    const winnerRecords = [];
    const rankEntries = Array.from(winnersByRank.entries());
    for (const [rank, winners] of rankEntries) {
      for (const winner of winners) {
        await db.insert(lotteryWinners).values({
          ticketId: winner.ticketId,
          drawId: config.drawId,
          userId: winner.userId,
          matchedNumbers: rank === 1 ? 6 : rank === 2 ? 5 : rank === 3 ? 4 : 3,
          prizeAmount: winner.prizeAmount,
          prizeRank: rank,
          claimStatus: 'pending',
          taxAmount: '0',
          netAmount: winner.prizeAmount,
          claimedAt: null,
          createdAt: drawTime,
          updatedAt: drawTime,
        });

        // 응모권 상태 업데이트
        await db
          .update(tickets)
          .set({
            status: 'won',
            updatedAt: drawTime,
          })
          .where(eq(tickets.id, winner.ticketId));

        winnerRecords.push({
          ticketId: winner.ticketId,
          userId: winner.userId,
          matchedNumbers: rank === 1 ? 6 : rank === 2 ? 5 : rank === 3 ? 4 : 3,
          prizeAmount: winner.prizeAmount,
          rank,
        });
      }
    }

    console.log(`✅ 당첨자 정보 저장됨: ${winnerRecords.length}명`);

    // 6. 결과 구성
    const winnersArray: Array<{
      rank: number;
      count: number;
      prizeAmount: string;
      winners: Array<{
        ticketId: number;
        userId: number;
        matchedNumbers: number;
        prizeAmount: string;
      }>;
    }> = [];

    winnersByRank.forEach((winners, rank) => {
      winnersArray.push({
        rank,
        count: winners.length,
        prizeAmount: winners[0]?.prizeAmount || '0',
        winners: winners.map((w) => ({
          ticketId: w.ticketId,
          userId: w.userId,
          matchedNumbers: rank === 1 ? 6 : rank === 2 ? 5 : rank === 3 ? 4 : 3,
          prizeAmount: w.prizeAmount,
        })),
      });
    });

    const result: DrawResult = {
      drawId: config.drawId,
      winningNumbers: config.winningNumbers,
      winners: winnersArray,
      totalPrizeDistributed: winnerRecords
        .reduce((sum, w) => BigInt(sum) + BigInt(w.prizeAmount), BigInt(0))
        .toString(),
      blockchainRecorded: false,
      recordedAt: undefined,
    };

    console.log(`🎉 추첨 완료: ${winnerRecords.length}명 당첨`);

    return result;
  } catch (error) {
    console.error('❌ 추첨 실행 중 오류:', error);
    return null;
  }
}

/**
 * 추첨 결과 조회
 */
export async function getDrawResult(drawId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot get draw result: database not available');
      return null;
    }

    // 추첨 결과 조회
    const resultData = await db.select().from(draws).where(eq(draws.id, drawId)).limit(1);
    const result = resultData.length > 0 ? resultData[0] : null;

    if (!result) {
      console.warn(`⚠️ 추첨 결과를 찾을 수 없음: ${drawId}`);
      return null;
    }

    // 당첨자 조회
    const winners = await db.select().from(lotteryWinners).where(eq(lotteryWinners.drawId, drawId));

    return {
      drawId: result.id,
      winningNumbers: result.winningNumbers ? JSON.parse(result.winningNumbers) : [],
      drawTime: result.drawDate,
      totalPrize: result.totalPrizePool,
      winnerCount: winners.length,
      winners: winners.map((w) => ({
        ticketId: w.ticketId,
        userId: w.userId,
        matchedNumbers: w.matchedNumbers,
        prizeAmount: w.prizeAmount,
        rank: w.prizeRank,
        claimedAt: w.claimedAt,
      })),
      blockNumber: result.blockNumber,
      transactionHash: result.blockchainTxHash,
      createdAt: result.createdAt,
    };
  } catch (error) {
    console.error('❌ 추첨 결과 조회 중 오류:', error);
    return null;
  }
}

/**
 * 당첨자 목록 조회
 */
export async function getWinnersByDraw(drawId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot get winners: database not available');
      return [];
    }

    const winners = await db.select().from(lotteryWinners).where(eq(lotteryWinners.drawId, drawId));

    return winners.map((w) => ({
      id: w.id,
      ticketId: w.ticketId,
      userId: w.userId,
      matchedNumbers: w.matchedNumbers,
      prizeAmount: w.prizeAmount,
        rank: w.prizeRank,
        claimedAt: w.claimedAt,
      createdAt: w.createdAt,
    }));
  } catch (error) {
    console.error('❌ 당첨자 목록 조회 중 오류:', error);
    return [];
  }
}

/**
 * 상금 청구 처리
 */
export async function claimPrize(winnerId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot claim prize: database not available');
      return false;
    }

    const claimedAt = new Date();
    await db
      .update(lotteryWinners)
      .set({
        claimedAt,
        claimStatus: 'claimed',
        updatedAt: claimedAt,
      })
      .where(eq(lotteryWinners.id, winnerId));

    console.log(`✅ 상금 청구 완료: Winner ID ${winnerId}`);
    return true;
  } catch (error) {
    console.error('❌ 상금 청구 중 오류:', error);
    return false;
  }
}
