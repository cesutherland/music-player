module.exports = {
  spotify: (req, res) => {
    const method = req.method.toLowerCase();
    const path = req.path.replace(/^\/api\/spotify/i, '');
    req.spotify.request(method, path, req.body, req.query).then(
      data => res.send(data),
      error => console.error(error.response)
    );
  },
  tracks: (req, res) => {
    req.store
      .tracks(req.session.userId)
      .then(
        tracks => res.send(tracks.map(track => JSON.parse(track.track))),
        error => console.error(error)
      );
  }
};
