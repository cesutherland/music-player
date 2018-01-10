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
      <div className="tracks">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Title</th>
              <th>Artist</th>
              <th>Album</th>
            </tr>
          </thead>
          <tbody onDoubleClick={this.playTracks.bind(this, tracks)}>
          {tracks.map(track =>
            <tr key={track.id}>
              <td>{track.disc_number}.{track.track_number}&nbsp;&nbsp;<a onClick={this.playTrack.bind(this, track)}> ▶</a></td>
              <td>{track.name}</td>
              <td>{track.artists.map(artist => artist.name).join(', ')}</td>
              <td>{track.album.name}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    );
  }
}

const getTracks = (tracks, albumId) => {
  return albumId
    ? tracks
    .filter(track => track.album.id === albumId)
    .sort((a, b) => (a.disc_number - b.disc_number) || (a.track_number - b.track_number))
    : [];
}

export default connect(
  state => {
    return {
      tracks: getTracks(state.tracks, state.albumId)
    };
  }
)(Tracks);
