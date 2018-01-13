import moment from 'moment';
import React from 'react';
import { connect } from 'react-redux';

class Player extends React.Component {

  render() {

    const props      = this.props;
    const player    = props.player;
    const track     = player.track;
    const format    = player .duration >= 1000 * 60 * 60 ? 'hh:mm:ss' : 'mm:ss';
    const emptyTime = '--:--';
    const position  = player.duration ? moment(player.position).format(format) : emptyTime;
    const duration  = player.duration ? moment(player.duration).format(format) : emptyTime;
    const progress  = (player.duration && player.position / player.duration) * 100 || 0;
    
    return (
      <div className="player">
        <div className="player-controls">
          {track.name
            ? <div className="player-toggle" onClick={this.props.onToggle}>{player.paused
              ? <span className="glyphicon glyphicon-play"></span>
              : <span className="glyphicon glyphicon-pause"></span>}
              </div>
            : ''
          }
        </div>
        <div className="player-info">{track.name || ''}&nbsp;</div>
        <div className="player-scrubber">
          <div className="player-position">{position}</div>
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
          <div className="player-duration">{duration}</div>
        </div>
      </div>
    );
  }
};

const mapStateToProps = state => {
  return {
    player: state.player
  };
}

const toggle = () => {
  return {
    type: 'PLAYER_TOGGLE'
  }
};

const mapDispatchToProps = dispatch => {
  return {
    onToggle: () => dispatch(toggle())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Player);
