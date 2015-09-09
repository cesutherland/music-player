module.exports = function (BaseView) {
  return BaseView.extend({
    beforeRender: function () {
    },
    afterRender: function () {
    },
    getRenderData: function () {
    },
    render: function () {
      this.beforeRender();
      this.$el.html(this.template(this.getRenderData()));
      BaseView.prototype.render.apply(this, arguments);
      this.afterRender();
      this.trigger('render');
      return this;
    },
    remove: function () {
      BaseView.prototype.remove.apply(this, arguments);
      this.trigger('remove');
      return this;
    },
    delegateEvents: function () {
      BaseView.prototype.delegateEvents.apply(this, arguments);
      this.trigger('delegate');
      return this;
    }
  });
}
