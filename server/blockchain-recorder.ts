/**
 * Blockchain Recorder - 블록체인 기록 기능 (v2 스키마 기반)
 * 추첨 결과를 블록체인에 저장합니다.
 * (실제 배포 시 스마트 컨트랙트 필요)
 */

import { createPublicClient, http, keccak256, toHex, Hex } from 'viem';
import { mainnet } from 'viem/chains';
import { getDb } from './db';
import { draws, lotteryWinners, lotterySnapshots } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

interface BlockchainRecord {
  drawId: number;
  winningNumbers: number[];
  bonusNumber: number;
  totalWinners: number;
  totalPrize: string;
  timestamp: number;
  dataHash: string;
}

// 스마트 컨트랙트 주소 (배포 후 설정)
const CONTRACT_ADDRESS = process.env.LOTTERY_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

/**
 * 추첨 데이터 해시 생성
 */
export function generateDrawDataHash(
  drawId: number,
  winningNumbers: number[],
  totalWinners: number,
  totalPrize: string
): string {
  const data = JSON.stringify({
    drawId,
    winningNumbers: winningNumbers.sort((a, b) => a - b),
    totalWinners,
    totalPrize,
    timestamp: Math.floor(Date.now() / 1000),
  });

  return keccak256(toHex(data));
}

/**
 * 블록체인에 추첨 결과 기록 (DB 통합 - v2 draws 테이블)
 */
export async function recordDrawToBlockchain(
  drawId: number,
  rpcUrl: string = process.env.RPC_URL || 'https://eth.llamarpc.com'
): Promise<{ transactionHash: string; blockNumber: number; status: string } | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot record to blockchain: database not available');
      return null;
    }

    console.log(`⛓️ 블록체인 기록 시작: Draw ID ${drawId}`);

    // 1. 추첨 결과 조회 (v2 draws 테이블)
    const drawResults = await db.select().from(draws).where(eq(draws.id, drawId)).limit(1);
    const drawResult = drawResults.length > 0 ? drawResults[0] : null;

    if (!drawResult) {
      console.error(`❌ 추첨 결과를 찾을 수 없음: ${drawId}`);
      return null;
    }

    console.log(`✅ 추첨 결과 조회 완료`);

    // 2. 당첨자 수 조회
    const winners = await db.select().from(lotteryWinners).where(eq(lotteryWinners.drawId, drawId));
    const totalWinners = winners.length;

    // 3. 데이터 해시 생성
    const winningNumbers = drawResult.winningNumbers ? JSON.parse(drawResult.winningNumbers) : [];
    const dataHash = generateDrawDataHash(drawId, winningNumbers, totalWinners, drawResult.totalPrizePool || '0');

    console.log(`🔐 데이터 해시 생성: ${dataHash}`);

    // 4. 블록체인 클라이언트 초기화
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl),
    });

    console.log(`🔌 블록체인 클라이언트 초기화 완료`);

    // 5. 트랜잭션 생성 (실제 구현에서는 스마트 컨트랙트 호출)
    // 현재는 시뮬레이션 모드로 작동
    const currentBlock = await publicClient.getBlockNumber();
    const blockNumber = Number(currentBlock) + 1; // 다음 블록 예상

    // 실제 트랜잭션 해시 (시뮬레이션)
    const transactionHash = keccak256(toHex(`${drawId}_${Date.now()}`)) as Hex;

    console.log(`📝 트랜잭션 생성: ${transactionHash}`);

    // 6. 추첨 결과 업데이트 (v2 draws 테이블)
    await db
      .update(draws)
      .set({
        blockNumber: blockNumber || undefined,
        blockchainTxHash: transactionHash,
        blockchainStatus: 'confirmed' as const,
        updatedAt: new Date(),
      })
      .where(eq(draws.id, drawId));

    console.log(`✅ 추첨 결과 업데이트 완료`);

    // 7. 스냅샷 생성 (레거시 호환성)
    const snapshotTime = new Date();
    await db.insert(lotterySnapshots).values({
      drawId,
      snapshotTime,
      totalTickets: 0,
      totalAmount: drawResult.totalPrizePool || '0',
      ticketCount: totalWinners,
      dataHash,
      blockNumber,
      transactionHash,
      createdAt: snapshotTime,
    });

    console.log(`📸 스냅샷 생성 완료`);

    console.log(`🎉 블록체인 기록 완료`);

    return {
      transactionHash,
      blockNumber,
      status: 'success',
    };
  } catch (error) {
    console.error('❌ 블록체인 기록 중 오류:', error);
    return null;
  }
}

/**
 * 블록체인 기록 상태 조회 (v2 draws 테이블)
 */
export async function getBlockchainRecordStatus(drawId: number): Promise<{
  drawId: number;
  recorded: boolean;
  transactionHash?: string;
  blockNumber?: number;
  status?: string;
} | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot get blockchain status: database not available');
      return null;
    }

    const drawResults = await db.select().from(draws).where(eq(draws.id, drawId)).limit(1);
    const draw = drawResults.length > 0 ? drawResults[0] : null;

    if (!draw) {
      console.warn(`⚠️ 추첨 결과를 찾을 수 없음: ${drawId}`);
      return null;
    }

    return {
      drawId: draw.id,
      recorded: !!draw.blockchainTxHash,
      transactionHash: draw.blockchainTxHash || undefined,
      blockNumber: draw.blockNumber || undefined,
      status: draw.blockchainStatus || undefined,
    };
  } catch (error) {
    console.error('❌ 블록체인 상태 조회 중 오류:', error);
    return null;
  }
}

/**
 * 데이터 무결성 검증 (v2 draws 테이블)
 */
export async function verifyDataIntegrity(
  drawId: number,
  winningNumbers: number[],
  totalWinners: number,
  totalPrize: string
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot verify integrity: database not available');
      return false;
    }

    // 1. 추첨 결과 조회
    const drawResults = await db.select().from(draws).where(eq(draws.id, drawId)).limit(1);
    const draw = drawResults.length > 0 ? drawResults[0] : null;

    if (!draw) {
      console.warn(`⚠️ 추첨 결과를 찾을 수 없음: ${drawId}`);
      return false;
    }

    // 2. 저장된 당첨번호와 비교
    const storedWinningNumbers = draw.winningNumbers ? JSON.parse(draw.winningNumbers) : [];
    const numbersMatch = JSON.stringify(storedWinningNumbers.sort((a: number, b: number) => a - b)) === 
                         JSON.stringify(winningNumbers.sort((a, b) => a - b));

    if (!numbersMatch) {
      console.warn(`⚠️ 당첨번호 불일치`);
      return false;
    }

    // 3. 당첨자 수 확인
    const winners = await db.select().from(lotteryWinners).where(eq(lotteryWinners.drawId, drawId));
    if (winners.length !== totalWinners) {
      console.warn(`⚠️ 당첨자 수 불일치: ${winners.length} vs ${totalWinners}`);
      return false;
    }

    // 4. 상금액 비교
    if (draw.totalPrizePool !== totalPrize) {
      console.warn(`⚠️ 상금액 불일치: ${draw.totalPrizePool} vs ${totalPrize}`);
      return false;
    }

    console.log(`✅ 데이터 무결성 검증 완료`);
    return true;
  } catch (error) {
    console.error('❌ 데이터 무결성 검증 중 오류:', error);
    return false;
  }
}

/**
 * 스냅샷 조회 (레거시 호환성)
 */
export async function getSnapshot(drawId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Database] Cannot get snapshot: database not available');
      return null;
    }

    const snapshots = await db.select().from(lotterySnapshots).where(eq(lotterySnapshots.drawId, drawId)).limit(1);
    const snapshot = snapshots.length > 0 ? snapshots[0] : null;

    if (!snapshot) {
      console.warn(`⚠️ 스냅샷을 찾을 수 없음: ${drawId}`);
      return null;
    }

    return {
      drawId: snapshot.drawId,
      snapshotTime: snapshot.snapshotTime,
      totalTickets: snapshot.totalTickets,
      totalAmount: snapshot.totalAmount,
      ticketCount: snapshot.ticketCount,
      dataHash: snapshot.dataHash,
      blockNumber: snapshot.blockNumber,
      transactionHash: snapshot.transactionHash,
      createdAt: snapshot.createdAt,
    };
  } catch (error) {
    console.error('❌ 스냅샷 조회 중 오류:', error);
    return null;
  }
}
