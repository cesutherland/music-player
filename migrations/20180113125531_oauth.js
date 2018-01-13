
exports.up = function(knex, Promise) {
  return knex.schema.createTable('oauth', function (table) {
    table.increments('id').primary().index();
    table.integer('user_id').index();
    table.string('session', 255).index();
    table.string('key', 255);
    table.string('access_token', 255);
    table.string('refresh_token', 255);
    table.integer('expires');
    table.boolean('connected');
  })
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('oauth')
  ]);
};
