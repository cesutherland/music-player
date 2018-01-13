import player from './player';

export default {
  toggle: () => {
    player.then(player => player.togglePlay());
  },
  seek: (position) => {
    player.then(player => player.seek(position));
  }
};
