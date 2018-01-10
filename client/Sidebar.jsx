import React       from 'react';
import { connect } from 'react-redux';
import filter      from './lib/filters';
import facet       from './lib/facets';
import play        from './play';

const getArtistAlbums = (artist) => {
  var albums = Object.values(artist.tracks.reduce((albums, track) => {
    albums[track.album.id] = albums[track.album.id] || track.album;
    return albums;
  }, {})).sort((a, b) => a.name.localeCompare(b.name));
  return albums;
}

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

  search (event) {
    const query = event.target.value;
    this.setState({query: query});
  }

  render () {

    const tracks = filter.tracks(this.props.tracks, this.state.query);
    const artists = facet.artist(tracks).sort((a, b) => a.name.localeCompare(b.name));

    const autoExpand = artists.length <= 5;

    return (
      <div className="browser">
        <div className="browser-search">
          <input type="text" value={this.state.query} className="form-control input-sm" onChange={this.search.bind(this)}/>
        </div>
        <ul className="browser-list list-unstyled">
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
              {getArtistAlbums(artist).map(album =>
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



// Controller stuff:

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
