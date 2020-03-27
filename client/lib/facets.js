const facet = (dimension) =>
  (items) => items.reduce((faceted, item) => {
    const facet = dimension(item);
    faceted[facet] = faceted[facet] || [];
    faceted[facet].push(item);
    return faceted;
  }, {})

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
    track.album.artists.map(artist => {
      artist = artists[artist.id] = artists[artist.id] || artist;
      artist.tracks = artist.tracks || [];
      artist.tracks.push(track);
    })
    return artists;
  }, {})),

  year: facet(track => (new Date(track.added)).getFullYear()),
}
