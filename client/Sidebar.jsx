import React from 'react';
import player from './player';
import play from './play';
import { connect } from 'react-redux';

class Sidebar extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      expanded: {},
      query: ''
    };
  }

  selectArtist (id) {
    const expanded = this.state.expanded;
    expanded[id] = !expanded[id];
    this.setState({
      expanded: expanded
    });
  }

  getArtistAlbums (artist) {
    var albums = Object.values(artist.tracks.reduce((albums, track) => {
      albums[track.album.id] = albums[track.album.id] || track.album;
      return albums;
    }, {})).sort((a, b) => a.name.localeCompare(b.name));
    return albums;
  }

  search (event) {
    const query = event.target.value;
    this.setState({query: query});
  }

  render () {

    const query = this.state.query.toLowerCase();
    const match = s => s.toLowerCase().indexOf(query) !== -1;
    const tracks = this.props.tracks.filter(track => 
      match(track.name) ||
      match(track.album.name) ||
      track.artists.filter(artist => match(artist.name)).length
    );

    const artists = Object.values(tracks.reduce((artists, track) => {
      track.artists.map(artist => {
        artist = artists[artist.id] = artists[artist.id] || artist;
        artist.tracks = artist.tracks || [];
        artist.tracks.push(track);
      })
      return artists;
    }, {})).sort((a, b) => a.name.localeCompare(b.name));

    const autoExpand = artists.length <= 5;

    return (
      <div className="browser">
        <div class="browser-search">
          <input type="text" value={this.state.query} className="form-control input-sm" onChange={this.search.bind(this)}/>
        </div>
        <ul className="explorer list-unstyled">
        {artists.map((artist, i) => 
          <li key={artist.id}>
            <a
              onClick={this.selectArtist.bind(this, artist.id)}
              className={autoExpand || this.state.expanded[artist.id] ? 'expanded' : ''}
            >
              {artist.name}
            </a>
            {(autoExpand || this.state.expanded[artist.id]) &&
              <ul className="list-unstyled">
              {this.getArtistAlbums(artist).map(album =>
                <li key={album.id}>
                  <a
                    onClick={this.props.onLoadAlbum.bind(this, album.id)}
                    onDoubleClick={play.album.bind(play, album.id)}
                  >
                    {album.name}
                  </a>
                </li>
              )}
              </ul>
            }
          </li>
        )}
        </ul>
      </div>
    );
  }
}

const loadAlbum = id => {
  return {
    type: 'LOAD_ALBUM',
    id
  }
};

const mapDispatchToProps = dispatch => {
  return {
    onLoadAlbum: id => dispatch(loadAlbum(id))
  }
}

export default connect(null, mapDispatchToProps)(Sidebar)
