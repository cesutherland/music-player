import React from 'react';
import player from './player';
import { connect } from 'react-redux';
import play from './play';

class Tracks extends React.Component {

  playTrack (track) {
    play.track(track.id);
  }

  playTracks (tracks) {
    play.tracks(tracks.map(track => track.id));
  }

  render () {

    const tracks = this.props.tracks;

    if (!tracks.length) return <h2 className="text-center">Welcome...</h2>

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
          <tbody onDoubleClick={this.playTracks.bind(this, tracks)}>
          {tracks.map(track =>
            <tr key={track.id}>
              <td><a onClick={this.playTrack.bind(this, track)}>Play</a></td>
              <td>{track.artists.map(artist => artist.name).join(', ')}</td>
              <td>{track.album.name}</td>
              <td>{track.name}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    );
  }
}

const getTracks = (tracks, albumId) => {
  return albumId
    ? tracks.filter(track => track.album.id === albumId)
    : [];
}

export default connect(
  state => {
    return {
      tracks: getTracks(state.tracks, state.albumId)
    };
  }
)(Tracks);
