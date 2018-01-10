import axios from 'axios';
import store from './store';
import { api } from '../config';

const play = data => axios({
  method: 'put',
  url: api.base + '/api/spotify/me/player/play?device_id='+store.getState().playerDeviceId,
  withCredentials: true,
  data: data
});

const playAlbum  = uri   => play({context_uri: uri});
const playTracks = uris  => play({uris: uris});
const mapAlbum   = (id)  => 'spotify:album:'+id;
const mapTracks  = (ids) => ids.map(id => 'spotify:track:'+id);

export default {
  album  : id  => playAlbum(mapAlbum(id)),
  track  : id  => playTracks(mapTracks([id])),
  tracks : ids => playTracks(mapTracks(ids))
}
