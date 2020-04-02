
exports.up = function(knex) {
  return Promise.all([
    knex.schema.createTable('oauth', function (table) {
      table.increments('id').primary().index();
      table.integer('user_id').index();
      table.string('session', 1024).index();
      table.string('key', 255);
      table.string('access_token', 1024);
      table.string('refresh_token', 1024);
      table.integer('expires');
      table.boolean('connected');
      table.collate('utf8_unicode_ci')
    }),

    knex.schema.createTable('tracks', function (table) {
      table.increments('id').primary().index();
      table.string('foreign_id', 1024).unique();
      table.json('track');
      table.collate('utf8_unicode_ci')
    }),

    knex.schema.createTable('user_tracks', function (table) {
      table.integer('user_id').index();
      table.integer('track_id').index();
      table.primary(['user_id', 'track_id']);
      table.collate('utf8_unicode_ci')
    }),

    knex.schema.createTable('users', function (table) {
      table.increments('id').primary().index();
      table.string('email', 255).unique();
      table.collate('utf8_unicode_ci')
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTable('oauth'),
    knex.schema.dropTable('tracks'),
    knex.schema.dropTable('user_tracks'),
    knex.schema.dropTable('users')
  ]);
};
