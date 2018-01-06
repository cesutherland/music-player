const axios           = require('axios');

const base = 'https://api.spotify.com/v1';
const limit = 50;

function spotify (config) {

  const request = (method, path, data, query) => axios({
    method: method,
    url: base+path,
    headers: {
      'Authorization': 'Bearer '+config.access_token
    },
    data: method !== 'get' ? data : null,
    params: method === 'get' ? data : query 
  }).then(response => response.data);

  const collectList = (request, offset = 0) => 
    request(offset).then(data =>
      (data.total > offset + limit)
        ? collectList(request, offset + limit).then(items => data.items.concat(items))
        : data.items
    );
  ;

  const getList = (
    path,
    offset = 0,
    limit = 50
  ) => request('get', path, {
    offset: offset ? offset : 0,
    limit: limit ? limit : 50
  });

  const getPlaylists = (offset, limit) => getList('/me/playlists', offset, limit);
  const getTracks    = (offset, limit) => getList('me/tracks', offset, limit);

  return {
    request,
    getList,
    getTracks,
    getPlaylists,
    collectPlaylists : () => collectList(getPlaylists),
    collectPlaylistTracks : (owner, id) => collectList(offset => getList(`/users/${owner}/playlists/${id}/tracks`)),
    collectTracks : () => collectList(getTracks)
  }
}

module.exports = spotify;
