import { and, desc, eq } from 'drizzle-orm';
import { draws } from '../drizzle/schema';
import { getDb } from './db';

export interface KoreanLottoApiResponse {
  totSellamnt: number;
  returnValue: string;
  drwNoDate: string;
  firstWinamnt: number;
  firstPrzwnerCo: number;
  bnusNo: number;
  drwNo: number;
  drwtNo1: number;
  drwtNo2: number;
  drwtNo3: number;
  drwtNo4: number;
  drwtNo5: number;
  drwtNo6: number;
}

export interface SyncedKoreanDraw {
  drawNumber: number;
  drawDate: string;
  winningNumbers: number[];
  bonusNumber: number;
  totalSalesAmount: number;
  firstPrizeAmount: number;
  firstPrizeWinnerCount: number;
}

function buildOfficialDrawUrl(drawNumber: number) {
  return `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drawNumber}`;
}

export async function fetchKoreanLottoDraw(drawNumber: number): Promise<SyncedKoreanDraw | null> {
  const response = await fetch(buildOfficialDrawUrl(drawNumber), {
    headers: {
      Accept: 'application/json,text/plain,*/*',
      'User-Agent': 'Mozilla/5.0 Manus WLD Lotto Sync',
    },
  });

  if (!response.ok) {
    throw new Error(`Korean lotto API request failed: ${response.status}`);
  }

  const payload = (await response.json()) as KoreanLottoApiResponse;
  if (payload.returnValue !== 'success') {
    return null;
  }

  return {
    drawNumber: payload.drwNo,
    drawDate: payload.drwNoDate,
    winningNumbers: [
      payload.drwtNo1,
      payload.drwtNo2,
      payload.drwtNo3,
      payload.drwtNo4,
      payload.drwtNo5,
      payload.drwtNo6,
    ],
    bonusNumber: payload.bnusNo,
    totalSalesAmount: payload.totSellamnt,
    firstPrizeAmount: payload.firstWinamnt,
    firstPrizeWinnerCount: payload.firstPrzwnerCo,
  };
}

export async function getLatestStoredDrawNumber(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const latest = await db.select().from(draws).orderBy(desc(draws.drawNumber)).limit(1);
  return latest[0]?.drawNumber ?? 0;
}

export async function syncKoreanLottoDraw(drawNumber: number) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const synced = await fetchKoreanLottoDraw(drawNumber);
  if (!synced) {
    return null;
  }

  const existing = await db.select().from(draws).where(eq(draws.drawNumber, synced.drawNumber)).limit(1);
  const drawDate = new Date(`${synced.drawDate}T20:30:00+09:00`);

  if (existing.length > 0) {
    await db
      .update(draws)
      .set({
        winningNumbers: JSON.stringify(synced.winningNumbers),
        bonusNumber: synced.bonusNumber,
        totalRevenue: synced.totalSalesAmount.toString(),
        totalPrizePool: synced.firstPrizeAmount.toString(),
        status: 'drawn',
        updatedAt: new Date(),
      })
      .where(eq(draws.drawNumber, synced.drawNumber));
  } else {
    await db.insert(draws).values({
      drawNumber: synced.drawNumber,
      drawDate,
      startTime: new Date(drawDate.getTime() - 6 * 24 * 60 * 60 * 1000),
      endTime: new Date(drawDate.getTime() - 30 * 60 * 1000),
      winningNumbers: JSON.stringify(synced.winningNumbers),
      bonusNumber: synced.bonusNumber,
      totalRevenue: synced.totalSalesAmount.toString(),
      totalPrizePool: synced.firstPrizeAmount.toString(),
      status: 'drawn',
      blockchainStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const saved = await db.select().from(draws).where(eq(draws.drawNumber, synced.drawNumber)).limit(1);
  return saved[0] ?? null;
}

export async function closeDrawBeforeOfficialResult(drawId: number) {
  const db = await getDb();
  if (!db) return false;

  const target = await db.select().from(draws).where(and(eq(draws.id, drawId), eq(draws.status, 'active'))).limit(1);
  if (target.length === 0) {
    return false;
  }

  await db
    .update(draws)
    .set({
      status: 'closed',
      updatedAt: new Date(),
    })
    .where(eq(draws.id, drawId));

  return true;
}
