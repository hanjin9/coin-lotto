/**
 * Web3 로또 플랫폼 - 완벽한 스키마 v2
 * 모든 필드 최적화 + 관계 설정 + 인덱스
 */

import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  boolean,
  index,
  foreignKey
} from "drizzle-orm/mysql-core";

// ===== 1. USERS 테이블 (확장) =====
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  email: varchar("email", { length: 320 }).unique(),
  name: text("name"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  
  // Web3 지갑 정보
  walletAddress: varchar("walletAddress", { length: 42 }).unique(),
  preferredWalletType: mysqlEnum("preferredWalletType", ["metamask", "walletconnect", "coinbase"]),
  walletVerified: boolean("walletVerified").default(false),
  
  // 역할 및 상태
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "suspended", "banned"]).default("active"),
  
  // 2FA 설정
  twoFactorEnabled: boolean("twoFactorEnabled").default(false),
  twoFactorSecret: varchar("twoFactorSecret", { length: 64 }),
  
  // 회원 등급
  membershipTier: mysqlEnum("membershipTier", [
    "SILVER", "GOLD", "BLUE_SAPPHIRE", "GREEN_EMERALD",
    "DIAMOND", "BLUE_DIAMOND", "PLATINUM", "BLACK_PLATINUM"
  ]).default("SILVER"),
  
  // 통계
  totalTicketsPurchased: int("totalTicketsPurchased").default(0),
  totalWinnings: decimal("totalWinnings", { precision: 20, scale: 8 }).default("0"),
  totalLosses: decimal("totalLosses", { precision: 20, scale: 8 }).default("0"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  walletIdx: index("walletIdx").on(table.walletAddress),
  phoneIdx: index("phoneIdx").on(table.phoneNumber),
  emailIdx: index("emailIdx").on(table.email),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ===== 2. DRAWS 테이블 (추첨 정보) =====
export const draws = mysqlTable("draws", {
  id: int("id").autoincrement().primaryKey(),
  drawNumber: int("drawNumber").notNull().unique(), // 한국 로또 회차 번호
  drawDate: timestamp("drawDate").notNull(),
  status: mysqlEnum("status", ["scheduled", "active", "closed", "drawn", "settled"]).default("scheduled"),
  
  // 응모 기간
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  
  // 당첨 정보
  winningNumbers: varchar("winningNumbers", { length: 100 }), // "1,2,3,4,5,6"
  bonusNumber: int("bonusNumber"),
  
  // 상금 정보
  totalPrizePool: decimal("totalPrizePool", { precision: 20, scale: 8 }),
  prizeDistribution: text("prizeDistribution"), // JSON: {1등: 50%, 2등: 30%, ...}
  
  // 응모 통계
  totalTickets: int("totalTickets").default(0),
  totalRevenue: decimal("totalRevenue", { precision: 20, scale: 8 }).default("0"),
  
  // 블록체인 기록
  blockchainTxHash: varchar("blockchainTxHash", { length: 66 }),
  blockchainStatus: mysqlEnum("blockchainStatus", ["pending", "confirmed", "failed"]).default("pending"),
  blockNumber: int("blockNumber"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  drawNumberIdx: index("drawNumberIdx").on(table.drawNumber),
  statusIdx: index("statusIdx").on(table.status),
}));

export type Draw = typeof draws.$inferSelect;
export type InsertDraw = typeof draws.$inferInsert;

// ===== 3. TICKETS 테이블 (응모권) =====
export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  drawId: int("drawId").notNull(),
  
  // 선택 번호
  numbers: varchar("numbers", { length: 100 }).notNull(), // "1,2,3,4,5,6"
  
  // 구매 정보
  purchaseAmount: decimal("purchaseAmount", { precision: 20, scale: 8 }).notNull(),
  purchaseCurrency: mysqlEnum("purchaseCurrency", ["worldcoin", "ethereum", "polygon", "usdt", "usdc"]).default("worldcoin"),
  purchaseMethod: mysqlEnum("purchaseMethod", ["wallet", "card", "bank_transfer"]).default("wallet"),
  
  // 상태
  status: mysqlEnum("status", ["pending", "confirmed", "drawn", "won", "lost", "refunded"]).default("pending"),
  
  // 거래 정보
  transactionHash: varchar("transactionHash", { length: 66 }),
  walletAddress: varchar("walletAddress", { length: 42 }),
  
  // 당첨 정보
  matchedNumbers: int("matchedNumbers").default(0),
  prizeAmount: decimal("prizeAmount", { precision: 20, scale: 8 }).default("0"),
  prizeRank: int("prizeRank"), // 1등, 2등, ...
  
  // 환불 정보
  refundAmount: decimal("refundAmount", { precision: 20, scale: 8 }).default("0"),
  refundedAt: timestamp("refundedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userDrawIdx: index("userDrawIdx").on(table.userId, table.drawId),
  statusIdx: index("statusIdx").on(table.status),
  walletIdx: index("walletIdx").on(table.walletAddress),
}));

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

// ===== 4. TRANSACTIONS 테이블 (결제 거래) =====
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // 거래 정보
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  currency: mysqlEnum("currency", ["worldcoin", "ethereum", "polygon", "usdt", "usdc"]).notNull(),
  txHash: varchar("txHash", { length: 66 }).unique(),
  
  // 상태
  status: mysqlEnum("status", ["pending", "confirmed", "failed", "refunded"]).default("pending"),
  
  // 재시도 정보
  retryCount: int("retryCount").default(0),
  maxRetries: int("maxRetries").default(3),
  lastRetryAt: timestamp("lastRetryAt"),
  
  // 블록체인 정보
  blockNumber: int("blockNumber"),
  confirmations: int("confirmations").default(0),
  gasUsed: decimal("gasUsed", { precision: 20, scale: 8 }),
  
  // 에러 정보
  errorMessage: text("errorMessage"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("userIdx").on(table.userId),
  statusIdx: index("statusIdx").on(table.status),
  txHashIdx: index("txHashIdx").on(table.txHash),
}));

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// ===== 5. LOTTERY_WINNERS 테이블 (당첨자) =====
export const lotteryWinners = mysqlTable("lottery_winners", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  userId: int("userId").notNull(),
  drawId: int("drawId").notNull(),
  
  // 당첨 정보
  matchedNumbers: int("matchedNumbers").notNull(),
  prizeRank: int("prizeRank").notNull(), // 1등, 2등, ...
  prizeAmount: decimal("prizeAmount", { precision: 20, scale: 8 }).notNull(),
  
  // 상금 청구
  claimStatus: mysqlEnum("claimStatus", ["pending", "claimed", "expired"]).default("pending"),
  claimedAt: timestamp("claimedAt"),
  claimTxHash: varchar("claimTxHash", { length: 66 }),
  
  // 세금 정보 (한국 기준 22%)
  taxAmount: decimal("taxAmount", { precision: 20, scale: 8 }).default("0"),
  netAmount: decimal("netAmount", { precision: 20, scale: 8 }).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userDrawIdx: index("userDrawIdx").on(table.userId, table.drawId),
  claimStatusIdx: index("claimStatusIdx").on(table.claimStatus),
}));

export type LotteryWinner = typeof lotteryWinners.$inferSelect;
export type InsertLotteryWinner = typeof lotteryWinners.$inferInsert;

// ===== 6. ADMIN_LOGS 테이블 (관리자 작업 로그) =====
export const adminLogs = mysqlTable("admin_logs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  
  // 작업 정보
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  
  // 보안 정보
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  suspiciousActivity: boolean("suspiciousActivity").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  adminIdx: index("adminIdx").on(table.adminId),
  suspiciousIdx: index("suspiciousIdx").on(table.suspiciousActivity),
}));

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = typeof adminLogs.$inferInsert;

// ===== 7. VERIFICATION_CODES 테이블 (인증 코드) =====
export const verificationCodes = mysqlTable("verification_codes", {
  id: int("id").autoincrement().primaryKey(),
  
  // 인증 대상
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  email: varchar("email", { length: 320 }),
  
  // 인증 코드
  code: varchar("code", { length: 10 }).notNull(),
  
  // 상태
  verified: boolean("verified").default(false),
  attemptCount: int("attemptCount").default(0),
  maxAttempts: int("maxAttempts").default(3),
  
  // 만료 시간
  expiresAt: timestamp("expiresAt").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  phoneIdx: index("phoneIdx").on(table.phoneNumber),
  emailIdx: index("emailIdx").on(table.email),
  expiresIdx: index("expiresIdx").on(table.expiresAt),
}));

export type VerificationCode = typeof verificationCodes.$inferSelect;
export type InsertVerificationCode = typeof verificationCodes.$inferInsert;

// ===== 8. PAYMENT_STATISTICS 테이블 (결제 통계) =====
export const paymentStatistics = mysqlTable("payment_statistics", {
  id: int("id").autoincrement().primaryKey(),
  
  // 기간
  date: timestamp("date").notNull().unique(),
  
  // 통계
  totalTransactions: int("totalTransactions").default(0),
  successfulTransactions: int("successfulTransactions").default(0),
  failedTransactions: int("failedTransactions").default(0),
  refundedTransactions: int("refundedTransactions").default(0),
  
  // 금액
  totalAmount: decimal("totalAmount", { precision: 20, scale: 8 }).default("0"),
  successAmount: decimal("successAmount", { precision: 20, scale: 8 }).default("0"),
  failedAmount: decimal("failedAmount", { precision: 20, scale: 8 }).default("0"),
  refundAmount: decimal("refundAmount", { precision: 20, scale: 8 }).default("0"),
  
  // 비율
  successRate: decimal("successRate", { precision: 5, scale: 2 }).default("0"),
  failureRate: decimal("failureRate", { precision: 5, scale: 2 }).default("0"),
  
  // 재시도 분석
  retryCount0: int("retryCount0").default(0),
  retryCount1: int("retryCount1").default(0),
  retryCount2: int("retryCount2").default(0),
  retryCount3Plus: int("retryCount3Plus").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("dateIdx").on(table.date),
}));

export type PaymentStatistic = typeof paymentStatistics.$inferSelect;
export type InsertPaymentStatistic = typeof paymentStatistics.$inferInsert;
