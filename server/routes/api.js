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
    req.knex('tracks').select('*').then(tracks =>
      res.send(tracks.map(track => JSON.parse(track.track))));
  }
};
