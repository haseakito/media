CREATE TABLE `accounts` (
	`provider_id` varchar(255) NOT NULL,
	`provider_account_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	CONSTRAINT `accounts_provider_id_provider_account_id_pk` PRIMARY KEY(`provider_id`,`provider_account_id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `password` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(30);--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `provider_account_id_idx` ON `accounts` (`provider_account_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `accounts` (`user_id`);