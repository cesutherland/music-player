const getMetadata = (spotify) => {

  const metadata = {};

  return spotify.getTracks()
    .then(result => metadata.tracks = getResultMetadata(result))
    .then(() => spotify.getPlaylists())
    .then(result => metadata.playlists = getResultMetadata(result))
    .then(() => spotify.getAlbums())
    .then(result => metadata.albums = getResultMetadata(result))
    .then(() => metadata);
};

const getResultMetadata = (result) => ({
  total: result.total,
  progress: 0,
});

const jobUpdates = {};
const progress = (jobId) => {
  return jobUpdates[jobId] || null;
};

const job = (req, res) => {

  const knex = req.knex;
  const store = req.store;
  const spotify = req.spotify;
  const userId = req.session.userId;

  const startJob = () =>
    store.insertJob(userId)
    .then(() => store.findJob(userId))
    .then(job => {

      if (!job) console.error('no job');

      let metadata = null;

      const updateJob = (callback) => () => {
        console.log(`update: ${JSON.stringify(metadata)}`);
        const socket = req.getSocket();
        callback && callback();
        jobUpdates[job.id] = metadata;
        if (socket) {
          socket.emit('job-progress', metadata);
        }
      };

      const importTracks = () =>
        spotify.collectTracks()
          .then(tracks => storeTracks(tracks, updateJob(() => metadata.tracks.progress++)))

      const importAlbums = () =>
        spotify.collectAlbums()
          .then(list => { console.log(`albums: ${list.length}`); return list; })
          .then(list => collectAllAlbumTracks(list, updateJob(() => metadata.albums.progress++)))

      const importPlaylists = () =>
        spotify.collectPlaylists()
          .then(playlists => { console.log('playlists: '+playlists.length); return playlists; })
          .then(playlists => collectAllPlaylistTracks(playlists, updateJob(() => metadata.playlists.progress++)))

      // Collect tracks:
      getMetadata(spotify)
        .then(m => metadata = m)
      //.then(importTracks)
      //.then(importAlbums)
        .then(importPlaylists)
        .then(null, error => error)
        .then(error => knex('jobs')
          .where({id: job.id})
          .update({
            finished: new Date(),
            job: JSON.stringify({
              error: error
            })
          })
        )
        .then(() => store.findJob(userId))
        .then(job => {
          const socket = req.getSocket();
          if (socket) {
            socket.emit('job', job);
          }
          jobUpdates[job.id] = null;
        }, error => console.error(error));

      return job;
    });

  const storeTracks = (tracks, callback) => {
    let track = tracks.shift();
    if (track) {
      let dateAdded = track.added_at;
      track = track.track || track;
      return storeTrack(track, dateAdded)
        .then(callback)
        .then(() => storeTracks(tracks, callback))
        .catch(error => console.error(error));
    }
  };

  const storeTrack = (track, dateAdded) =>
    store
      .findTrack(track.id)
      .then(foundTrack => ((foundTrack && foundTrack.id) || store.insertTrack(track)))
      .then(trackId => store.insertUserTrack(userId, trackId, dateAdded));

  const collectAllPlaylistTracks = (playlists, callback) => {
    const playlist = playlists.length && playlists.shift();
    if (playlist) {
      return spotify.collectPlaylistTracks(playlist.owner.id, playlist.id)
        .then(storeTracks)
        .then(callback)
        .then(() => collectAllPlaylistTracks(playlists, callback))
    }
  }

  const collectAllAlbumTracks = (albums, callback) => {
    const album = albums.length && albums.shift();
    if (album) {
      return spotify.collectAlbumTracks(album.album.id)
        .then(tracks => tracks.map(track => {
          track.album = album.album;
          track.added_at = album.added_at;
          return track;
        }))
        .then(storeTracks)
        .then(callback)
        .then(() => collectAllAlbumTracks(albums, callback))
    }
  }

  return store.findJob(userId)
    .then(job => { return job || startJob(); })
    .then(
      job => res.send(job),
      error => { console.error(error); res.send(400) }
    );
};

export { progress };

export default {
  job,
};
