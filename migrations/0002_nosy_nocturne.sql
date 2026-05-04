CREATE TABLE `playlist_tracks` (
	`playlist_id` integer NOT NULL,
	`track_id` integer NOT NULL,
	`position` integer NOT NULL,
	`added_at` integer,
	PRIMARY KEY(`playlist_id`, `position`),
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spotify_id` text NOT NULL,
	`name` text NOT NULL,
	`owner_id` text NOT NULL,
	`snapshot_id` text,
	`imported_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `playlists_spotify_id_unique` ON `playlists` (`spotify_id`);--> statement-breakpoint
CREATE TABLE `user_playlists` (
	`user_id` integer NOT NULL,
	`playlist_id` integer NOT NULL,
	PRIMARY KEY(`user_id`, `playlist_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_saved_albums` (
	`user_id` integer NOT NULL,
	`album_id` integer NOT NULL,
	`added_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `album_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade
);
