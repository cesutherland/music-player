/**
 * Tracks Collection
 */

var Collection = require('app/collections/collection');
var Track = require('app/models/track');
var config = require('app/config');

module.exports = Collection.extend({
  model: Track,
  url: config.apiURL + '/tracks'
});
