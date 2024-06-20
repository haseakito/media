CREATE TABLE `email_verification_tokens` (
	`id` varchar(255) NOT NULL,
	`code` varchar(8) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `email_verification_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_verification_tokens_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `user_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email_verified` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `email_verification_tokens` ADD CONSTRAINT `email_verification_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `email_verification_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `email_verification_tokens` (`email`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `users` (`email`);