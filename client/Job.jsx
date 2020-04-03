import React from 'react';

// {
//   tracks: {total: 1061, progress: 1061},
//   playlists: {total: 505, progress: 195},
//   albums: {total: 505, progress: 195},
// }

export default (job, {tracks, playlists, albums} = {}) =>  {

  const importing         = !job || job.finished;
  const tracksProgress    = tracks && tracks.progress / tracks.total;
  const playlistsProgress = playlists && playlists.progress / playlists.total;
  const albumsProgress    = albums && albums.progress / albums.total;

  return (
    <div className="splash job-progress">
      {!job && <div>loading...</div>}
      {job && !tracksProgress && !playlistsProgress && !albumsProgress && <div>preparing import</div>}
      {job && tracksProgress ? <div>importing tracks:    {(Math.round(tracksProgress * 100))}%</div> : ''}
      {playlistsProgress ? <div>importing playlists: {(Math.round(playlistsProgress * 100))}%</div> : ''}
    </div>
  );
};
