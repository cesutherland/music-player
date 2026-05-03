CREATE INDEX `album_artists_artist_id` ON `album_artists` (`artist_id`);--> statement-breakpoint
CREATE INDEX `playlist_tracks_track_id` ON `playlist_tracks` (`track_id`);--> statement-breakpoint
CREATE INDEX `track_artists_artist_id` ON `track_artists` (`artist_id`);--> statement-breakpoint
CREATE INDEX `tracks_album_id` ON `tracks` (`album_id`);--> statement-breakpoint
CREATE INDEX `user_playlists_playlist_id` ON `user_playlists` (`playlist_id`);--> statement-breakpoint
CREATE INDEX `user_saved_albums_album_id` ON `user_saved_albums` (`album_id`);--> statement-breakpoint
CREATE INDEX `user_saved_tracks_track_id` ON `user_saved_tracks` (`track_id`);