module.exports = (knex) => ({
  insertJob: (userId) =>
    knex('jobs')
      .insert({
          user_id: userId,
          key: 'spotify-import',
          created: new Date(),
          job: '{}'
        }),

  findJob: (userId) =>
    knex('jobs')
      .where({
        user_id: userId,
        key: 'spotify-import',
        finished: null
      })
      .then(jobs => jobs[0]),

  findTrack: (foreignId) =>
    knex('tracks')
      .where({foreign_id: foreignId})
      .then(tracks => tracks[0]),

  insertTrack: (track) =>
    knex('tracks')
      .insert({
        foreign_id: track.id,
        track: JSON.stringify(track)
      })
      .then(tracks => tracks[0]),

  tracks: (userId) =>
    knex('tracks')
      .select('*')
      .join('user_tracks', 'tracks.id', '=', 'user_tracks.track_id')
      .where({
        'user_tracks.user_id': userId
      })
      .then(tracks => tracks.map(track => JSON.parse(track.track))),

  insertUserTrack: (userId, trackId) =>
    knex('user_tracks')
      .insert({
        user_id: userId,
        track_id: trackId,
      })
      .catch(error => (false && console.error(error))),
});
