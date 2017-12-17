import querystring from 'querystring';
import React     from 'react';
import { oauth } from './config';

const authorizeUri = 'https://accounts.spotify.com/authorize?'+querystring.stringify(oauth);

module.exports = (props) => {
  return (
    !props.loggedIn ? <a href={authorizeUri}>Login</a> : <span>Welcome!</span>
  );
};
