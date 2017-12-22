import React                       from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { layout }                  from 'react-sidebar-layout';
import Login from './Login.jsx';
import Player from './Player.jsx';
import Tracks from './Tracks.jsx';

const routes = [
  {
    exact: true,
    path: '/',
    name: 'Home',
    component: (a) => {
      const authentication = a.authentication;
			return (a) => {
        return (
          <div>
            <Player accessToken={authentication ? authentication.accessToken : null}></Player>
            <Tracks />
          </div>
        );
      }
		}
  }
];

module.exports = (state) => (
  <Router>
    {layout(state, routes, <Login loggedIn={state.authentication.loggedIn}></Login>)}
  </Router>
);

