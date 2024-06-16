ALTER TABLE `email_verification_table` MODIFY COLUMN `user_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `user_id` varchar(255) NOT NULL;