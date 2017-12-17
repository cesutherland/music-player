import React from 'react';

const Player = (props) => {

	setTimeout(function () {
		var player = new Spotify.Player({
			name: "Carly Rae Jepsen Player",
			getOAuthToken: function (callback) {
        console.log(props.accessToken);
				callback(props.accessToken);
			},
			volume: 0.5
		});
    setTimeout(function () {
      player.connect();
    }, 1000);
	}, 1000);

  return <h1>Player</h1>
};

export default Player;
