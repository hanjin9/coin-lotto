-- Complete migration to v2 schema
-- This file adds missing v2 fields to existing tables and creates new tables

-- 1) transactions 테이블 확장 (v2 필드 추가 - 기존 필드는 이미 존재)
ALTER TABLE `transactions`
  ADD COLUMN IF NOT EXISTS `userId` int,
  ADD COLUMN IF NOT EXISTS `amount` decimal(20,8),
  ADD COLUMN IF NOT EXISTS `currency` enum('worldcoin','ethereum','polygon','usdt','usdc') DEFAULT 'worldcoin',
  ADD COLUMN IF NOT EXISTS `txHash` varchar(66),
  ADD COLUMN IF NOT EXISTS `retryCount` int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `maxRetries` int DEFAULT 3,
  ADD COLUMN IF NOT EXISTS `lastRetryAt` timestamp NULL,
  ADD COLUMN IF NOT EXISTS `gasUsed` decimal(20,8),
  ADD COLUMN IF NOT EXISTS `errorMessage` text;

CREATE INDEX IF NOT EXISTS `transactions_user_idx` ON `transactions` (`userId`);
CREATE INDEX IF NOT EXISTS `transactions_txhash_idx` ON `transactions` (`txHash`);

-- 2) lottery_winners 테이블 확장 (v2 필드 추가)
ALTER TABLE `lottery_winners`
  ADD COLUMN IF NOT EXISTS `prizeRank` int,
  ADD COLUMN IF NOT EXISTS `claimStatus` enum('pending','claimed','expired') DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS `claimTxHash` varchar(66),
  ADD COLUMN IF NOT EXISTS `taxAmount` decimal(20,8) DEFAULT '0',
  ADD COLUMN IF NOT EXISTS `netAmount` decimal(20,8),
  ADD COLUMN IF NOT EXISTS `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;

-- 기존 rank -> prizeRank 백필
UPDATE `lottery_winners` SET `prizeRank` = `rank` WHERE `prizeRank` IS NULL;
UPDATE `lottery_winners` SET `netAmount` = `prizeAmount` WHERE `netAmount` IS NULL;

-- 3) draws 신규 생성 (v2 테이블)
CREATE TABLE IF NOT EXISTS `draws` (
  `id` int AUTO_INCREMENT NOT NULL,
  `drawNumber` int NOT NULL,
  `drawDate` timestamp NOT NULL,
  `status` enum('scheduled','active','closed','drawn','settled') DEFAULT 'scheduled',
  `startTime` timestamp NOT NULL,
  `endTime` timestamp NOT NULL,
  `winningNumbers` varchar(100),
  `bonusNumber` int,
  `totalPrizePool` decimal(20,8),
  `prizeDistribution` text,
  `totalTickets` int DEFAULT 0,
  `totalRevenue` decimal(20,8) DEFAULT '0',
  `blockchainTxHash` varchar(66),
  `blockchainStatus` enum('pending','confirmed','failed') DEFAULT 'pending',
  `blockNumber` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `draws_id` PRIMARY KEY(`id`),
  CONSTRAINT `draws_drawNumber_unique` UNIQUE(`drawNumber`)
);

-- 4) tickets 신규 생성 (v2 테이블)
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `drawId` int NOT NULL,
  `numbers` varchar(100) NOT NULL,
  `purchaseAmount` decimal(20,8) NOT NULL,
  `purchaseCurrency` enum('worldcoin','ethereum','polygon','usdt','usdc') DEFAULT 'worldcoin',
  `purchaseMethod` enum('wallet','card','bank_transfer') DEFAULT 'wallet',
  `status` enum('pending','confirmed','drawn','won','lost','refunded') DEFAULT 'pending',
  `transactionHash` varchar(66),
  `walletAddress` varchar(42),
  `matchedNumbers` int DEFAULT 0,
  `prizeAmount` decimal(20,8) DEFAULT '0',
  `prizeRank` int,
  `refundAmount` decimal(20,8) DEFAULT '0',
  `refundedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `tickets_id` PRIMARY KEY(`id`)
);

CREATE INDEX IF NOT EXISTS `tickets_user_draw_idx` ON `tickets` (`userId`, `drawId`);
CREATE INDEX IF NOT EXISTS `tickets_wallet_idx` ON `tickets` (`walletAddress`);

-- 5) admin_logs 신규 생성 (v2 테이블)
CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `adminId` int NOT NULL,
  `action` varchar(100) NOT NULL,
  `details` text,
  `ipAddress` varchar(45),
  `userAgent` text,
  `suspiciousActivity` boolean DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `admin_logs_id` PRIMARY KEY(`id`)
);

CREATE INDEX IF NOT EXISTS `admin_logs_admin_idx` ON `admin_logs` (`adminId`);
CREATE INDEX IF NOT EXISTS `admin_logs_suspicious_idx` ON `admin_logs` (`suspiciousActivity`);

-- 6) verification_codes 신규 생성 (v2 테이블)
CREATE TABLE IF NOT EXISTS `verification_codes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `phoneNumber` varchar(20),
  `email` varchar(320),
  `code` varchar(10) NOT NULL,
  `verified` boolean DEFAULT false,
  `attemptCount` int DEFAULT 0,
  `maxAttempts` int DEFAULT 3,
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `verification_codes_id` PRIMARY KEY(`id`)
);

-- 7) payment_statistics 신규 생성 (v2 테이블)
CREATE TABLE IF NOT EXISTS `payment_statistics` (
  `id` int AUTO_INCREMENT NOT NULL,
  `date` timestamp NOT NULL,
  `totalTransactions` int DEFAULT 0,
  `successfulTransactions` int DEFAULT 0,
  `failedTransactions` int DEFAULT 0,
  `refundedTransactions` int DEFAULT 0,
  `totalAmount` decimal(20,8) DEFAULT '0',
  `successAmount` decimal(20,8) DEFAULT '0',
  `failedAmount` decimal(20,8) DEFAULT '0',
  `refundAmount` decimal(20,8) DEFAULT '0',
  `successRate` decimal(5,2) DEFAULT '0',
  `failureRate` decimal(5,2) DEFAULT '0',
  `retryCount0` int DEFAULT 0,
  `retryCount1` int DEFAULT 0,
  `retryCount2` int DEFAULT 0,
  `retryCount3Plus` int DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `payment_statistics_id` PRIMARY KEY(`id`),
  CONSTRAINT `payment_statistics_date_unique` UNIQUE(`date`)
);
