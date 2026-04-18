CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hash` varchar(66) NOT NULL,
	`from` varchar(42) NOT NULL,
	`to` varchar(42) NOT NULL,
	`value` varchar(78) NOT NULL,
	`blockNumber` int,
	`confirmations` int DEFAULT 0,
	`status` enum('pending','confirmed','failed') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_hash_unique` UNIQUE(`hash`)
);
