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

  findOAuth: (userId) => 
    knex('oauth')
      .select('*')
      .innerJoin('users', 'users.id', 'oauth.user_id')
      .where({
        key: 'spotify',
        user_id: userId || null
      })
      .then(
        oauths => {
          if (oauths[0]) return oauths[0];
          throw new Error(`Session not found ${userId}`);
        },
        error => (console.error('error', error) || error)
      ),

  updateOAuth: (userId, accessToken) =>
    knex('oauth')
      .update({
        access_token: accessToken,
        connected: true
      })
      .where({
        user_id: userId,
        key: 'spotify'
      }),

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
