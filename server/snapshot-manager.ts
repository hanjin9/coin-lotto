/**
 * Snapshot Manager - 추첨 시점 데이터 스냅샷 저장
 * 추첨 시간의 모든 응모 데이터를 저장하고 블록체인에 기록합니다.
 */

import { getDb } from './db';
import { lotterySnapshots, lotteryTickets } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

interface SnapshotData {
  drawTime: Date;
  blockNumber: number;
  totalTickets: number;
  totalAmount: bigint;
  ticketIds: number[];
}

/**
 * 추첨 시점 데이터 스냅샷 생성
 * 현재 시점의 모든 응모 데이터를 저장합니다.
 */
export async function createSnapshot(drawId: number): Promise<SnapshotData> {
  const now = new Date();
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // 모든 응모권 조회
  const tickets = await db
    .select()
    .from(lotteryTickets)
    .where(eq(lotteryTickets.status, 'confirmed'));

  // 스냅샷 데이터 계산
  const totalAmount = tickets.reduce((sum: bigint, ticket) => {
    return sum + BigInt(ticket.amount || 0);
  }, BigInt(0));

  const snapshotData: SnapshotData = {
    drawTime: now,
    blockNumber: 0,
    totalTickets: tickets.length,
    totalAmount,
    ticketIds: tickets.map((t) => t.id),
  };

  // 스냅샷 저장
  await db.insert(lotterySnapshots).values({
    drawId,
    snapshotTime: now,
    totalTickets: tickets.length,
    totalAmount: totalAmount.toString(),
    ticketCount: tickets.length,
    dataHash: generateDataHash(snapshotData),
  });

  return snapshotData;
}

/**
 * 데이터 해시 생성 (블록체인 기록용)
 */
function generateDataHash(data: SnapshotData): string {
  const crypto = require('crypto');
  const dataString = JSON.stringify({
    drawTime: data.drawTime.toISOString(),
    totalTickets: data.totalTickets,
    totalAmount: data.totalAmount.toString(),
    ticketIds: data.ticketIds.sort((a, b) => a - b),
  });
  
  return crypto
    .createHash('sha256')
    .update(dataString)
    .digest('hex');
}

/**
 * 스냅샷 조회
 */
export async function getSnapshot(drawId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const snapshot = await db
    .select()
    .from(lotterySnapshots)
    .where(eq(lotterySnapshots.drawId, drawId))
    .limit(1);

  return snapshot[0] || null;
}

/**
 * 스냅샷 목록 조회
 */
export async function listSnapshots(limit = 10, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  return await db
    .select()
    .from(lotterySnapshots)
    .limit(limit)
    .offset(offset);
}
