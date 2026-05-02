import React   from 'react';
import { api } from './config';

export default (props) => {
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
