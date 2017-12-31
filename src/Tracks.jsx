import React from 'react';
import axios from 'axios';
import player from './player';
import { connect } from 'react-redux';

class Tracks extends React.Component {

  onPlayClick (id) {
    axios({
      method: 'put',
      url: 'http://localhost:3000/api/spotify/me/player/play',
      withCredentials: true,
      data: {
        uris: ['spotify:track:'+id]
      }
    }).then(data => {
      console.log(data);
    });
  }

  render () {
    return (
      <div>
        <h2>Tracks:</h2>
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Artist</th>
              <th>Album</th>
              <th>Title</th>
            </tr>
          </thead>
          <tbody>
          {this.props.tracks.map(track =>
            <tr key={track.id}>
              <td><a onClick={this.onPlayClick.bind(this, track.id)}>Play</a></td>
              <td>{track.artists.map(artist => artist.name).join(', ')}</td>
              <td>{track.album.name}</td>
              <td>{track.name}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    )
  }
}

const getTracks = (tracks, albumId) => {
  return albumId
    ? tracks.filter(track => track.album.id === albumId)
    : tracks;
}

const mapStateToProps = state => {
  return {
    tracks: getTracks(state.tracks, state.albumId)
  };
}


export default connect(mapStateToProps, null)(Tracks);
