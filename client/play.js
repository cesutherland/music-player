import axios from 'axios';
import store from './store';

const play = uris => axios({
  method: 'put',
  url: 'http://localhost:3000/api/spotify/me/player/play?device_id='+store.getState().playerDeviceId,
  withCredentials: true,
  data: {
    
    uris: uris
  }
});

const mapTracks = (ids) => ids.map(id => 'spotify:track:'+id);
const mapAlbums = (ids) => ids.map(id => 'spotify:album:'+id);

export default {
  album  : id  => play(mapAlbums([id])),
  albums : ids => play(mapAlbums(ids)),
  track  : id  => play(mapTracks([id])),
  tracks : ids => play(mapTracks(ids))
}
