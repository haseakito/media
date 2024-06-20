CREATE TABLE `users` (
	`id` varchar(255) NOT NULL,
	`name` varchar(30) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean DEFAULT false,
	`password` varchar(255) NOT NULL,
	`bio` text,
	`link` varchar(255),
	`dob` date,
	`profile_image` varchar(255),
	`cover_image` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
