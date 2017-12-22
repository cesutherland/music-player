import ReactDOM from 'react-dom';
import axios    from 'axios';
import router   from './router.jsx';
import player   from './player';

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
  player.init(data.access_token);
  ReactDOM.render(router(state), document.getElementById('layout'));
});
