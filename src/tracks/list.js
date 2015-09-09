var List = require('app/views/list');

module.exports = List.extend({
  template: require('app/tracks/list.hbs'),
  itemTemplate: require('app/tracks/list-items.hbs')
});
