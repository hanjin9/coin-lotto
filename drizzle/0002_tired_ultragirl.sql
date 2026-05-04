CREATE TABLE `lottery_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drawId` int NOT NULL,
	`winningNumbers` text NOT NULL,
	`drawTime` timestamp NOT NULL,
	`totalPrize` varchar(78),
	`blockNumber` int,
	`transactionHash` varchar(66),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lottery_results_id` PRIMARY KEY(`id`),
	CONSTRAINT `lottery_results_drawId_unique` UNIQUE(`drawId`)
);
--> statement-breakpoint
CREATE TABLE `lottery_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drawId` int NOT NULL,
	`snapshotTime` timestamp NOT NULL,
	`totalTickets` int NOT NULL,
	`totalAmount` varchar(78) NOT NULL,
	`ticketCount` int NOT NULL,
	`dataHash` varchar(64) NOT NULL,
	`blockNumber` int,
	`transactionHash` varchar(66),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lottery_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `lottery_snapshots_drawId_unique` UNIQUE(`drawId`)
);
--> statement-breakpoint
CREATE TABLE `lottery_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`numbers` text NOT NULL,
	`amount` varchar(78),
	`walletAddress` varchar(42),
	`transactionHash` varchar(66),
	`status` enum('pending','confirmed','drawn','won','lost') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lottery_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lottery_winners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`drawId` int NOT NULL,
	`userId` int NOT NULL,
	`matchedNumbers` int NOT NULL,
	`prizeAmount` varchar(78) NOT NULL,
	`rank` int,
	`claimedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lottery_winners_id` PRIMARY KEY(`id`)
);
