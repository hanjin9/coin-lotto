/**
 * DB CRUD bridge layer
 * 목적: 현재 v2 스키마 기준으로 타입 오류 없이 안전하게 CRUD를 제공한다.
 * 원칙: 기존 코드와 신규 스키마 사이를 잇는 최소 안전 계층으로 유지한다.
 */

import { and, desc, eq, gte, lte } from 'drizzle-orm';
import {
  adminLogs,
  draws,
  lotteryWinners,
  tickets,
  transactions,
  users,
} from '../drizzle/schema';
import { getDb } from './db';

export async function createUser(userData: {
  openId?: string;
  phoneNumber?: string;
  email?: string;
  name?: string;
  walletAddress?: string;
  preferredWalletType?: 'metamask' | 'walletconnect' | 'coinbase';
  role?: 'admin' | 'user';
}) {
  const db = await getDb();
  if (!db) return null;

  const openId = userData.openId ?? `anon_${Date.now()}`;

  await db.insert(users).values({
    openId,
    phoneNumber: userData.phoneNumber ?? null,
    email: userData.email ?? null,
    name: userData.name ?? null,
    loginMethod: userData.phoneNumber ? 'phone' : userData.email ? 'email' : 'wallet',
    walletAddress: userData.walletAddress ?? null,
    preferredWalletType: userData.preferredWalletType ?? null,
    role: userData.role ?? 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  });

  const created = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return created[0] ?? null;
}

export async function getUserByWallet(walletAddress: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
  return result[0] ?? null;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] ?? null;
}

export async function updateUserWallet(
  userId: number,
  walletAddress: string,
  walletType: 'metamask' | 'walletconnect' | 'coinbase'
) {
  const db = await getDb();
  if (!db) return null;

  await db
    .update(users)
    .set({
      walletAddress,
      preferredWalletType: walletType,
      walletVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return getUserById(userId);
}

export async function createDraw(drawData: {
  drawNumber: number;
  drawDate: Date;
  startTime: Date;
  endTime: Date;
  status?: 'scheduled' | 'active' | 'closed' | 'drawn' | 'settled';
  winningNumbers?: string;
  bonusNumber?: number;
  totalPrizePool?: string;
  prizeDistribution?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(draws).values({
    drawNumber: drawData.drawNumber,
    drawDate: drawData.drawDate,
    startTime: drawData.startTime,
    endTime: drawData.endTime,
    status: drawData.status ?? 'scheduled',
    winningNumbers: drawData.winningNumbers ?? null,
    bonusNumber: drawData.bonusNumber ?? null,
    totalPrizePool: drawData.totalPrizePool ?? null,
    prizeDistribution: drawData.prizeDistribution ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const created = await db.select().from(draws).where(eq(draws.drawNumber, drawData.drawNumber)).limit(1);
  return created[0] ?? null;
}

export async function getDrawById(drawId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(draws).where(eq(draws.id, drawId)).limit(1);
  return result[0] ?? null;
}

export async function getLatestDraw() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(draws).orderBy(desc(draws.drawNumber)).limit(1);
  return result[0] ?? null;
}

export async function createTicket(ticketData: {
  userId: number;
  drawId: number;
  numbers: string;
  purchaseAmount: string;
  purchaseCurrency?: 'worldcoin' | 'ethereum' | 'polygon' | 'usdt' | 'usdc';
  purchaseMethod?: 'wallet' | 'card' | 'bank_transfer';
  status?: 'pending' | 'confirmed' | 'drawn' | 'won' | 'lost' | 'refunded';
  transactionHash?: string;
  walletAddress?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(tickets).values({
    userId: ticketData.userId,
    drawId: ticketData.drawId,
    numbers: ticketData.numbers,
    purchaseAmount: ticketData.purchaseAmount,
    purchaseCurrency: ticketData.purchaseCurrency ?? 'worldcoin',
    purchaseMethod: ticketData.purchaseMethod ?? 'wallet',
    status: ticketData.status ?? 'pending',
    transactionHash: ticketData.transactionHash ?? null,
    walletAddress: ticketData.walletAddress ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const created = await db
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.userId, ticketData.userId),
        eq(tickets.drawId, ticketData.drawId),
        eq(tickets.numbers, ticketData.numbers)
      )
    )
    .orderBy(desc(tickets.id))
    .limit(1);

  return created[0] ?? null;
}

export async function getTicketsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tickets).where(eq(tickets.userId, userId)).orderBy(desc(tickets.createdAt));
}

export async function getTicketsByDraw(drawId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tickets).where(eq(tickets.drawId, drawId)).orderBy(desc(tickets.createdAt));
}

export async function updateTicketStatus(
  ticketId: number,
  status: 'pending' | 'confirmed' | 'drawn' | 'won' | 'lost' | 'refunded'
) {
  const db = await getDb();
  if (!db) return null;

  await db.update(tickets).set({ status, updatedAt: new Date() }).where(eq(tickets.id, ticketId));

  const result = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  return result[0] ?? null;
}

export async function createTransaction(txData: {
  userId: number;
  amount: string;
  currency: 'worldcoin' | 'ethereum' | 'polygon' | 'usdt' | 'usdc';
  txHash?: string;
  status?: 'pending' | 'confirmed' | 'failed' | 'refunded';
  retryCount?: number;
  confirmations?: number;
  blockNumber?: number;
  gasUsed?: string;
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(transactions).values({
    userId: txData.userId,
    amount: txData.amount,
    currency: txData.currency,
    txHash: txData.txHash ?? null,
    status: txData.status ?? 'pending',
    retryCount: txData.retryCount ?? 0,
    maxRetries: 3,
    confirmations: txData.confirmations ?? 0,
    blockNumber: txData.blockNumber ?? null,
    gasUsed: txData.gasUsed ?? null,
    errorMessage: txData.errorMessage ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const created = await db
    .select()
    .from(transactions)
    .where(eq(transactions.txHash, txData.txHash ?? ''))
    .limit(1);

  return created[0] ?? null;
}

export async function getTransactionsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
}

export async function updateTransactionStatus(
  txId: number,
  status: 'pending' | 'confirmed' | 'failed' | 'refunded',
  retryCount?: number
) {
  const db = await getDb();
  if (!db) return null;

  const updatePayload: {
    status: 'pending' | 'confirmed' | 'failed' | 'refunded';
    updatedAt: Date;
    retryCount?: number;
  } = {
    status,
    updatedAt: new Date(),
  };

  if (retryCount !== undefined) {
    updatePayload.retryCount = retryCount;
  }

  await db.update(transactions).set(updatePayload).where(eq(transactions.id, txId));
  const result = await db.select().from(transactions).where(eq(transactions.id, txId)).limit(1);
  return result[0] ?? null;
}

export async function createWinner(winnerData: {
  ticketId: number;
  userId: number;
  drawId: number;
  matchedNumbers: number;
  prizeRank: number;
  prizeAmount: string;
  taxAmount?: string;
  netAmount: string;
}) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(lotteryWinners).values({
    ticketId: winnerData.ticketId,
    userId: winnerData.userId,
    drawId: winnerData.drawId,
    matchedNumbers: winnerData.matchedNumbers,
    prizeRank: winnerData.prizeRank,
    prizeAmount: winnerData.prizeAmount,
    taxAmount: winnerData.taxAmount ?? '0',
    netAmount: winnerData.netAmount,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const created = await db
    .select()
    .from(lotteryWinners)
    .where(
      and(
        eq(lotteryWinners.ticketId, winnerData.ticketId),
        eq(lotteryWinners.drawId, winnerData.drawId)
      )
    )
    .limit(1);

  return created[0] ?? null;
}

export async function getWinnersByDraw(drawId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lotteryWinners).where(eq(lotteryWinners.drawId, drawId)).orderBy(desc(lotteryWinners.prizeRank));
}

export async function createAdminLog(logData: {
  adminId: number;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  suspiciousActivity?: boolean;
}) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(adminLogs).values({
    adminId: logData.adminId,
    action: logData.action,
    details: logData.details ?? null,
    ipAddress: logData.ipAddress ?? null,
    userAgent: logData.userAgent ?? null,
    suspiciousActivity: logData.suspiciousActivity ?? false,
    createdAt: new Date(),
  });

  const created = await db.select().from(adminLogs).orderBy(desc(adminLogs.id)).limit(1);
  return created[0] ?? null;
}

export async function getAdminLogs(adminId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminLogs).where(eq(adminLogs.adminId, adminId)).orderBy(desc(adminLogs.createdAt)).limit(limit);
}

export async function getSuspiciousActivities() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminLogs).where(eq(adminLogs.suspiciousActivity, true)).orderBy(desc(adminLogs.createdAt));
}

export async function getPaymentStatistics(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) {
    return {
      total: 0,
      successful: 0,
      failed: 0,
      refunded: 0,
      successRate: '0.00',
      failureRate: '0.00',
    };
  }

  const txs = await db
    .select()
    .from(transactions)
    .where(and(gte(transactions.createdAt, startDate), lte(transactions.createdAt, endDate)));

  const total = txs.length;
  const successful = txs.filter((tx) => tx.status === 'confirmed').length;
  const failed = txs.filter((tx) => tx.status === 'failed').length;
  const refunded = txs.filter((tx) => tx.status === 'refunded').length;

  return {
    total,
    successful,
    failed,
    refunded,
    successRate: total > 0 ? ((successful / total) * 100).toFixed(2) : '0.00',
    failureRate: total > 0 ? ((failed / total) * 100).toFixed(2) : '0.00',
  };
}

export async function getUserStatistics() {
  const db = await getDb();
  if (!db) {
    return { total: 0, admins: 0, regularUsers: 0 };
  }

  const allUsers = await db.select().from(users);
  return {
    total: allUsers.length,
    admins: allUsers.filter((u) => u.role === 'admin').length,
    regularUsers: allUsers.filter((u) => u.role === 'user').length,
  };
}

export async function getDrawStatistics(drawId: number) {
  const draw = await getDrawById(drawId);
  if (!draw) return null;

  const drawTickets = await getTicketsByDraw(drawId);

  return {
    drawId,
    drawNumber: draw.drawNumber,
    totalTickets: drawTickets.length,
    confirmedTickets: drawTickets.filter((ticket) => ticket.status === 'confirmed').length,
    totalPrizePool: draw.totalPrizePool,
    blockchainStatus: draw.blockchainStatus,
    blockNumber: draw.blockNumber,
  };
}
