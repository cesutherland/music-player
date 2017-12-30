import ReactDOM from 'react-dom';
import axios    from 'axios';
import router   from './router.jsx';
import player   from './player';


ReactDOM.render(router({tracks: [], authentication:{}}), document.getElementById('layout'));

function render(state) {
  ReactDOM.render(router(state), document.getElementById('layout'));
}

axios({
  method: 'get',
  url: 'http://localhost:3000/init',
  withCredentials: true
}).then(response => {

  const data = response.data;
  const loggedIn = data.access_token ? true : false;
  const state = {
    tracks: [],
    authentication: {
      loggedIn: loggedIn,
      accessToken: data.access_token
    }
  };

  player.init(data.access_token);
  render(state);

  axios({
    method: 'get',
    url: 'http://localhost:3000/api/tracks',
    withCredentials: true
  }).then(res => {
    state.tracks = res.data;
    render(state);
  });
});
