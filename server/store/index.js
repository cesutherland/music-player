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

  tracks: (userId) =>
    knex('tracks')
      .select('*')
      .join('user_tracks', 'tracks.id', '=', 'user_tracks.track_id')
      .where({
        'user_tracks.user_id': userId
      })
      .then(tracks => tracks.map(track => JSON.parse(track.track))),
});
