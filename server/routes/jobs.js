module.exports = {
  job: (req, res) => {

    const knex = req.knex;
    const store = req.store;
    const spotify = req.spotify;
    const userId = req.session.userId;

    const startJob = () =>
      store.insertJob(userId)
      .then(() => store.findJob(userId))
      .then(job => {

        if (!job) console.error('no job');

        // Collect tracks:
        getMetadata().then(metadata => {
          const updateJob = (callback) => () => {
            const socket = req.getSocket();
            callback();
            if (socket) {
              socket.emit('job-progress', metadata);
            }
          };
          return spotify
            .collectTracks()
            .then(tracks => storeTracks(tracks, updateJob(() => metadata.tracks.progress++)))
            .then(() => spotify.collectAlbums())
            .then(list => { console.log(`albums: ${list.length}`); return list; })
            .then(list => collectAllAlbumTracks(list, tracks => (console.log(tracks.length) && tracks)))
            .then(() => spotify.collectPlaylists())
            .then(playlists => { console.log('playlists: '+playlists.length); return playlists; })
            .then(playlists => collectAllPlaylistTracks(playlists, updateJob(() => metadata.playlists.progress++)))
            .then(tracks => null, error => error)
            .then(error => knex('jobs')
              .where({id: job.id})
              .update({
                finished: new Date(),
                job: JSON.stringify({
                  error: error
                })
              })
            );
        });

        return job;
      });

    const storeTrack = track =>
      store
        .findTrack(track.id)
        .then(foundTrack => (foundTrack || store.insertTrack(track)))
        .then(track => track.id)
        .then(trackId => store.insertUserTrack(userId, trackId));

    const storeTracks = (tracks, callback) => {
      let track = tracks.shift();
      if (track) {
        track = track.track || track;
        return storeTrack(track)
          .then(callback)
          .then(() => storeTracks(tracks, callback))
          .catch(error => console.error(error));
      }
    };

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

    const collectAllAlbumTracks = (albums, callback) => {
      const album = albums.length && albums.shift();
      if (album) {
        console.log('syncing', album.album.name);
        console.log('remaining:', albums.length);
        return spotify.collectAlbumTracks(album.album.id)
          .then(tracks => tracks.map(track => (track.album = album.album) && track))
          .then(storeTracks)
        //  .then(callback)
          .then(() => collectAllAlbumTracks(albums, callback))
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

    return store.findJob(userId)
      .then(job => { return job || startJob(); })
      .then(
        job => res.send(job),
        error => { console.error(error); res.send(400) }
      );
  }
};
