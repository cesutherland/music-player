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

  const collectList = (request, offset = 0) => {
    return request(offset).then(data =>
      (data.total > offset + limit)
        ? collectList(request, offset + limit).then(items => data.items.concat(items))
        : data.items
    );
  };

  const getList = (
    path,
    offset = 0,
    limit = 50
  ) => {
    return request('get', path, {
      offset: offset,
      limit: limit
    });
  };

  const getMe        = ()              => request('get', '/me');
  const getAlbums    = (offset, limit) => getList('/me/albums', offset, limit);
  const getPlaylists = (offset, limit) => getList('/me/playlists', offset, limit);
  const getTracks    = (offset, limit) => getList('/me/tracks', offset, limit);

  return {
    request,
    getMe,
    getList,
    getAlbums,
    getTracks,
    getPlaylists,
    collectAlbums: () => collectList(getAlbums),
    collectAlbumTracks: (id) => collectList(offset => getList(`/albums/${id}/tracks`, offset)),
    collectPlaylists: () => collectList(getPlaylists),
    collectPlaylistTracks: (owner, id) => collectList(offset => getList(`/users/${owner}/playlists/${id}/tracks`, offset)),
    collectTracks: () => collectList(getTracks)
  }
}

module.exports = spotify;
