export default {
  genre: tracks => Object.values(tracks.reduce((artists, track) => {
    track.artists.map(artist => {
      artist = artists[artist.id] = artists[artist.id] || artist;
      artist.tracks = artist.tracks || [];
      artist.tracks.push(track);
    })
    return artists;
  }, {})),

  artist: tracks => Object.values(tracks.reduce((artists, track) => {
    track.artists.map(artist => {
      artist = artists[artist.id] = artists[artist.id] || artist;
      artist.tracks = artist.tracks || [];
      artist.tracks.push(track);
    })
    return artists;
  }, {}))
}
