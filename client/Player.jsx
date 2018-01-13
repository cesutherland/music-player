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
        <div>Playing: {track.name || '-'}</div>
        <div>Position: {position} / {duration}</div>
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
  console.log('here');
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
