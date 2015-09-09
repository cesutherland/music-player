var View = require('app/views/view');

module.exports = require('backbone-list/src/list')(View).extend({
  getRenderData: function () {
    var collection = this.collection;
    return {
      items: collection.toJSON(),
      count: collection.length
    }
  }
});
