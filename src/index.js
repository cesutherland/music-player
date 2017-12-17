import ReactDOM from 'react-dom';
import router   from './router.jsx';
import axios from 'axios';

ReactDOM.render(router({authentication:{}}), document.getElementById('layout'));

axios({
  method: 'get',
  url: 'http://localhost:3000/init',
  withCredentials: true
}).then(response => {
  const data = response.data;
  const state = {
    authentication: {
      loggedIn: data.access_token ? true : false,
      accessToken: data.access_token
    }
  }
  ReactDOM.render(router(state), document.getElementById('layout'));
});

window.onSpotifyWebPlaybackSDKReady = () => null;
