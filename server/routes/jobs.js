module.exports = {
  job: (req, res) => {

    const knex = req.knex;
    const spotify = req.spotify;
    const userId = req.session.userId;

    const storeTracks = (tracks, callback) => {
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
            .catch(error => (false && console.error(error)))
          )
          .then(callback)
          .then(() => storeTracks(tracks, callback));
      }
    }

    const collectAllPlaylistTracks = (playlists, callback) => {
      const playlist = playlists.length && playlists.shift();
      if (playlist) {
        console.log('syncing', playlist.name);
        console.log('remaining:', playlists.length);
        return spotify.collectPlaylistTracks(playlist.owner.id, playlist.id)
          .then(storeTracks)
          .then(callback)
          .then(() => collectAllPlaylistTracks(playlists, callback))
      }
    }

    const getMetadata = () => {
      const metadata = {
        tracks: {
          total: 0,
          progress: 0
        },
        playlists: {
          total: 0,
          progress: 0
        }
      };

      return spotify
        .getTracks(0, 1)
        .then(result => metadata.tracks.total = result.total)
        .then(() => spotify.getPlaylists(0, 1))
        .then(result => metadata.playlists.total = result.total)
        .then(() => metadata);
    };

    // Collect tracks:
    return getMetadata().then(metadata => {
      const updateJob = (callback) => () => {
        const socket = req.getSocket();
        callback();
        if (socket) {
          socket.emit('job-progress', metadata);
        }
        console.log(metadata);
      };
      return spotify
        .collectTracks()
        .then(tracks => storeTracks(tracks, updateJob(() => metadata.tracks.progress++)))
        .then(() => spotify.collectPlaylists())
        .then(playlists => { console.log('playlists: '+playlists.length); return playlists; })
        .then(playlists => collectAllPlaylistTracks(playlists, updateJob(() => metadata.playlists.progress++)))
        .then(
          tracks => res.send('ok'),
          error => (console.log(error.response || error) && res.send(error.response.data))
        );
    });
  }
};
