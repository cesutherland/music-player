module.exports = {
  job: (req, res) => {

    const knex = req.knex;
    const spotify = req.spotify;

    const storeTracks = (tracks) => {
      const track = tracks.shift();
      if (track) {
        return knex('tracks').where({id: track.track.id})
          .then(tracks => tracks.length || knex('tracks').insert({id: track.track.id, track: JSON.stringify(track.track)}))
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

    return spotify.collectPlaylists()
      .then(collectAllPlaylistTracks)
      .then(
        tracks => res.send('ok'),
        error => (console.log(error) && res.send(error.response.data))
      );

    // Collecy tracks:
    spotify.collectTracks()
      .then(storeTracks)
      .then(
        tracks => res.send('ok'),
        error => console.error(error)
      );
  }
};
