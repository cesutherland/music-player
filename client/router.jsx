import React                       from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { layout }                  from 'react-sidebar-layout';
import Login                       from './Login.jsx';
import Player                      from './Player.jsx';
import Tracks                      from './Tracks.jsx';
import Sidebar                     from './Sidebar.jsx';

const routes = [
  {
    exact: true,
    path: '/',
    name: 'Home',
    component: (state) => {
      const authentication = state.authentication;
			return () => 
        <div>
          <Player></Player>
          <Tracks tracks={state.tracks}/>
        </div>
		}
  }
];

module.exports = (state) => (
  <Router>
    {layout(
      state,
      routes,
      <Login loggedIn={state.authentication.loggedIn}></Login>,
      <Sidebar tracks={state.tracks}></Sidebar>
    )}
  </Router>
);

