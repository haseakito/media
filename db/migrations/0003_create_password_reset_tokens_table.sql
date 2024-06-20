CREATE TABLE `password_reset_tokens` (
	`id` varchar(255) NOT NULL,
	`token` varchar(40) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `password_reset_tokens` (`user_id`);