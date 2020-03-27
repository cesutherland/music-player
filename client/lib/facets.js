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

  yearAdded: facet(track => (new Date(track.added)).getFullYear()),
  yearMonthAdded: facet(track => {
    const date = new Date(track.added);
    const month = (date.getMonth() + 1 +'').padStart(2, '0');
    return `${date.getFullYear()} / ${month}`;
  }),
}
