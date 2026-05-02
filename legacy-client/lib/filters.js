export default {
  tracks: (tracks, query) => {
    query = query.toLowerCase();
    const match = s => s.toLowerCase().indexOf(query) !== -1;
    return tracks.filter(track => 
      match(track.name) ||
      match(track.album.name) ||
      track.artists.filter(artist => match(artist.name)).length
    )
  }
};
