CREATE TABLE `album_artists` (
	`album_id` integer NOT NULL,
	`artist_id` integer NOT NULL,
	PRIMARY KEY(`album_id`, `artist_id`),
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `albums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spotify_id` text NOT NULL,
	`name` text NOT NULL,
	`album_type` text,
	`release_date` text,
	`release_date_precision` text,
	`image_url` text,
	`imported_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `albums_spotify_id_unique` ON `albums` (`spotify_id`);--> statement-breakpoint
CREATE TABLE `artists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spotify_id` text NOT NULL,
	`name` text NOT NULL,
	`imported_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artists_spotify_id_unique` ON `artists` (`spotify_id`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`progress` text,
	`last_error` text,
	`created_at` integer NOT NULL,
	`scheduled_at` integer NOT NULL,
	`claimed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `jobs_kind_status` ON `jobs` (`kind`,`status`,`scheduled_at`);--> statement-breakpoint
CREATE INDEX `jobs_user_id` ON `jobs` (`user_id`);--> statement-breakpoint
CREATE TABLE `track_artists` (
	`track_id` integer NOT NULL,
	`artist_id` integer NOT NULL,
	PRIMARY KEY(`track_id`, `artist_id`),
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spotify_id` text NOT NULL,
	`name` text NOT NULL,
	`album_id` integer NOT NULL,
	`disc_number` integer,
	`track_number` integer,
	`duration_ms` integer,
	`explicit` integer,
	`is_local` integer,
	`imported_at` integer NOT NULL,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tracks_spotify_id_unique` ON `tracks` (`spotify_id`);--> statement-breakpoint
CREATE TABLE `user_saved_tracks` (
	`user_id` integer NOT NULL,
	`track_id` integer NOT NULL,
	`added_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `track_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade
);
