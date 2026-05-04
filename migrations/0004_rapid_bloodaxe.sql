CREATE TABLE `user_facet_chains` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`chain` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
