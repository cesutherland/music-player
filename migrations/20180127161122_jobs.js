
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('jobs', function (table) {
      table.increments('id').primary().index();
      table.integer('user_id').index();
      table.string('key', 255);
      table.dateTime('created');
      table.dateTime('finished');
      table.json('job');
      table.collate('utf8_unicode_ci')
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('jobs'),
  ]);
};
