import moment from 'moment';
import React from 'react';
import { connect } from 'react-redux';
import playerActions from './playerActions';

class Player extends React.Component {

  onScrub(event) {
    const target = event.currentTarget;
    const bounds = target.getBoundingClientRect();
    const percent = (event.clientX - bounds.left) / target.offsetWidth;
    const position = Math.floor(percent * this.props.player.duration);
    playerActions.seek(position);
  }

  onToggle(event) {
    playerActions.toggle();
  }

  render() {

    const props     = this.props;
    const player    = props.player;
    const track     = player.track;
    const hasTrack  = track.name;
    const format    = player .duration >= 1000 * 60 * 60 ? 'hh:mm:ss' : 'mm:ss';
    const emptyTime = '--:--';
    const position  = player.duration ? moment(player.position).format(format) : emptyTime;
    const duration  = player.duration ? moment(player.duration).format(format) : emptyTime;
    const progress  = (player.duration && player.position / player.duration) * 100 || 0;
    
    return (
      <div className="player">
        <div className="player-controls">
          {track.name
            ? <div className="player-toggle" onClick={this.onToggle.bind(this)}>{player.paused
              ? <span className="glyphicon glyphicon-play"></span>
              : <span className="glyphicon glyphicon-pause"></span>}
              </div>
            : ''
          }
        </div>
        <div className="player-info">{this.formatTrack(track)}&nbsp;</div>
        <div className="player-scrubber">
          <div className="player-position">{hasTrack && position}</div>
          <div className="player-scrub" onClick={this.onScrub.bind(this)}>
            <div className="player-progress progress">
              <div
                className="progress-bar"
                role="progressbar"
                aria-valuenow={position}
                aria-valuemin='00:00'
                aria-valuemax={duration}
                style={{width: progress + '%'}}
              ></div>
            </div>
          </div>
          <div className="player-duration">{duration}</div>
        </div>
      </div>
    );
  }

  formatTrack (track) {
    return track.name
      ? `${track.name} — ${track.artists[0].name} — ${track.album.name}`
      : '';

  }
};

const mapStateToProps = state => {
  return {
    player: state.player
  };
};


const mapDispatchToProps = dispatch => {
  return {
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Player);
