module.exports = (knex) => ({
  tracks: (userId) =>
    knex('tracks')
      .select('*')
      .join('user_tracks', 'tracks.id', '=', 'user_tracks.track_id')
      .where({
        'user_tracks.user_id': userId
      })
      .then(tracks => tracks.map(track => JSON.parse(track.track)))
});
