module.exports = {
  job: (req, res) => {

    const knex = req.knex;
    const spotify = req.spotify;
    const userId = req.session.userId;


    const storeTracks = (tracks) => {
      const track = tracks.shift();
      if (track) {
        return knex('tracks').where({foreign_id: track.track.id})
          .then(
            tracks => (tracks.length && tracks[0].id) || knex('tracks').insert({
              foreign_id: track.track.id,
              track: JSON.stringify(track.track)
            }).then(resp => resp[0])
          )
          .then(trackId =>
            knex('user_tracks').insert({
              user_id: userId,
              track_id: trackId
            })
            .catch(error => console.error(error))
          )
          .then(() => storeTracks(tracks));
      }
    }

    const collectAllPlaylistTracks = (playlists) => {
      const playlist = playlists.shift();
      if (playlist) {
        console.log('syncing', playlist.name);
        console.log('remaining:', playlists.length);
        return spotify.collectPlaylistTracks(playlist.owner.id, playlist.id)
          .then(storeTracks)
          .then(() => collectAllPlaylistTracks(playlists))
      }
    }

    // Collecy tracks:
    return spotify.collectTracks()
      .then(storeTracks)
      .then(() => spotify.collectPlaylists())
      .then(collectAllPlaylistTracks)
      .then(
        tracks => res.send('ok'),
        error => (console.log(error) && res.send(error.response.data))
      );
  }
};
