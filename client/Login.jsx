import querystring from 'querystring';
import React     from 'react';
import { oauth, api } from '../config';

const authorizeUri = 'https://accounts.spotify.com/authorize?'+querystring.stringify(oauth);

module.exports = (props) => {
  return (
    !props.loggedIn
      ?
      <span>
        <a href={authorizeUri}>Login</a>
      </span>
      :
      <span>
        <a href={api.base + '/logout'}>Logout</a>
      </span>
  );
};
