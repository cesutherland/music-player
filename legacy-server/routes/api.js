const albumResult = album => ({
  id: album.id,
  name: album.name,
  artists: album.artists.map(artistResult)
});

const artistResult = artist => ({
  id: artist.id,
  name: artist.name,
});

const trackResult = track => ({
  id: track.id,
  name: track.name,
  disc_number: track.disc_number,
  track_number: track.track_number,
  added: track.added,
  album: albumResult(track.album),
  artists: track.artists.map(artistResult),
});

const tracksResult = tracks =>
  tracks.map(track => trackResult(track))

export default {
  spotify: (req, res) => {
    const method = req.method.toLowerCase();
    const path = req.path.replace(/^\/api\/spotify/i, '');
    req.spotify.request(method, path, req.body, req.query).then(
      data => res.send(data),
      error => console.error(error.message)
    );
  },
  tracks: (req, res) => {
    req.store
      .tracks(req.session.userId)
      .then(
        //tracks => res.send(tracks),
        tracks => res.send(tracksResult(tracks)),
        error => console.error(error)
      );
  }
};
