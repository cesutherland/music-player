import querystring                 from 'querystring';
import React                       from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Job                         from './Job.jsx';
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

const router = (state) => {
  const loggedIn = state.authentication.loggedIn;
  return (
    <Router>
      {loggedIn
        ? (!state.job || state.job.finished)
          ? Layout(
            state,
            routes,
            <Login loggedIn={state.authentication.loggedIn}></Login>,
            <Sidebar tracks={state.tracks}></Sidebar>)
          : Job(state.job, state.jobProgress)
        : <div className="splash">
            <div className="splash-login">
              <h1>altplayer</h1>
              <a className="btn btn-primary btn-large" href={authorizeUri}>Connect to Spotify</a>
            </div>
          </div>
      }
    </Router>
  )
};

export default router;
