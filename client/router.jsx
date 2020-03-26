import querystring                 from 'querystring';
import React                       from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Layout                      from './Layout.jsx';
import Login                       from './Login.jsx';
import Player                      from './Player.jsx';
import Tracks                      from './Tracks.jsx';
import Sidebar                     from './Sidebar.jsx';
import { oauth }                   from './config';

const authorizeUri = 'https://accounts.spotify.com/authorize?'+querystring.stringify(oauth);

const routes = [
  {
    exact: true,
    path: '/',
    name: 'Home',
    component: () => {
			return () => 
        <div>
          <Player></Player>
          <Tracks />
        </div>
		}
  }
];

const jobWidget = (job, jobProgress) =>  {

  const importing         = !job || job.finished;
  const tracks            = jobProgress && jobProgress.tracks;
  const playlists         = jobProgress && jobProgress.playlists;
  const tracksProgress    = tracks && tracks.progress / tracks.total;
  const playlistsProgress = playlists && playlists.progress / playlists.total;

  return (
    <div className="splash job-progress">
      {!job && <div>loading...</div>}
      {job && !tracksProgress && !playlistsProgress && <div>preparing import</div>}
      {tracksProgress    ? <div>importing tracks:    {(Math.round(tracksProgress * 100))}%</div> : ''}
      {playlistsProgress ? <div>importing playlists: {(Math.round(playlistsProgress * 100))}%</div> : ''}
    </div>
  );
};

//
// {tracks: {total: 1061, progress: 1061}, playlists: {total: 505, progress: 195}}]
// 

const router = (state) => (
  <Router>
    {state.authentication.loggedIn
      ? (!state.job || state.job.finished
        ? Layout(
          state,
          routes,
          <Login loggedIn={state.authentication.loggedIn}></Login>,
          <Sidebar tracks={state.tracks}></Sidebar>
        )
        : jobWidget(state.job, state.jobProgress)
      )
      : (
        <div className="splash">
          <div className="splash-login">
            <h1>altplayer</h1>
            <a className="btn btn-primary btn-large" href={authorizeUri}>Connect to Spotify</a>
          </div>
        </div>
      )
    }
  </Router>
);

export default router;
