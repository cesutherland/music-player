const trackResult = (track) => {
  const added = track.added_to_library;
  track = JSON.parse(track.track);
  track.added = added;
  return track;
};

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
      .then(tracks => tracks.map(trackResult)),

  insertUserTrack: (userId, trackId, dateAdded) => {
    const userTrack = {
      user_id: userId,
      track_id: trackId,
      added_to_library: new Date(dateAdded)
    };
    return knex('user_tracks')
      .insert(userTrack)
      .catch(error => console.error(error));
  }
});
