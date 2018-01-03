import moment from 'moment';
import React from 'react';
import { connect } from 'react-redux';

const Player = (props) => {
  const player    = props.player;
  const track     = player.track;
  const format    = player .duration >= 1000 * 60 * 60 ? 'hh:mm:ss' : 'mm:ss';
  const emptyTime = '--:--';
  const position  = player.duration ? moment(player.position).format(format) : emptyTime;
  const duration  = player.duration ? moment(player.duration).format(format) : emptyTime;
  return (
    <div className="player">
      <div>Playing: {track.name || '-'}</div>
      <div>Position: {position} / {duration}</div>
    </div>
  );
};

const mapStateToProps = state => {
  return {
    player: state.player
  };
}

export default connect(mapStateToProps, null)(Player);
