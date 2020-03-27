import React       from 'react';
import { connect } from 'react-redux';
import filter      from './lib/filters';
import facet       from './lib/facets';
import play        from './play';

const AUTO_EXPAND_LIMIT = 5;

const getArtistAlbums = (artist) => {
  var albums = Object.values(artist.tracks.reduce((albums, track) => {
    albums[track.album.id] = albums[track.album.id] || track.album;
    return albums;
  }, {})).sort((a, b) => a.name.localeCompare(b.name));
  return albums;
}

const facets = [
  {
    key: 'artist_album',
    name: 'Artist / Album',
  },
  {
    key: 'added_yyyy',
    name: 'Added Year',
  },
];

class Sidebar extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      facet: 'artist_album',
      expanded: {},
      query: ''
    };
  }

  toggle (facet, value) {
    const id = `${facet}::${value}`;
    const expanded = this.state.expanded;
    expanded[id] = !expanded[id];
    this.setState({
      expanded: expanded
    });
  }

  expanded (facet, value) {
    const id = `${facet}::${value}`;
    return this.state.expanded[id];
  }

  selectFacet (event) {
    this.setState({facet: event.target.value});
  }

  search (event) {
    const query = event.target.value;
    this.setState({query: query});
  }

  render () {

    const tracks = filter.tracks(this.props.tracks, this.state.query);

    return (
      <div className="browser">
        <div className="browser-search">
          <input type="text" value={this.state.query} className="form-control input-sm" onChange={this.search.bind(this)}/>
        </div>
        {this.renderFacets()}
        <ul className="browser-list list-unstyled">
          {this.renderTracks(tracks)}
        </ul>
      </div>
    );
  }

  renderFacets () {
    return (
      <div className="browser-facets">
        <select
          className="form-control input-sm"
          value={this.state.facet}
          onChange={this.selectFacet.bind(this)}
        >
          {facets.map(facet =>
            <option key={facet.key} value={facet.key}>
              {facet.name}
            </option>
          )}
        </select>
      </div>
    );
  }

  renderTracks (tracks) {
    const map = {
      'artist_album': 'renderFacetArtistAlbum',
      'added_yyyy': 'renderFacetAdded',
    };
    return this[map[this.state.facet]](tracks);
  }

  renderFacetArtistAlbum (tracks) {

    const artists = facet.artist(tracks).sort((a, b) => a.name.localeCompare(b.name));
    const autoExpand = artists.length <= AUTO_EXPAND_LIMIT;
    const expanded = (artist) => autoExpand || this.expanded('artist', artist.id);

    return (
      artists.map((artist, i) =>
        <li key={artist.id}>
          <a
            onClick={() => this.toggle('artist', artist.id)}
            className={expanded(artist) ? 'expanded' : ''}
          >
            {artist.name}
          </a>
          {expanded(artist) &&
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
      )
    );
  }

  renderFacetAdded (tracks) {

    const years = Object.entries(facet.year(tracks));
    const autoExpand = years.length <= AUTO_EXPAND_LIMIT;
    const expanded = (year) => autoExpand || this.expanded('year', year);

    return years.map(([year, tracks]) =>
      <li key={year}>
        <a
          onClick={() => this.toggle('year', year)}
          className={expanded(year) ? 'expanded' : ''}
        >
          {year}
        </a>
        {expanded(year) &&
          <ul className="list-unstyled">
            {this.renderFacetArtistAlbum(tracks)}
          </ul>
        }
      </li>
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
