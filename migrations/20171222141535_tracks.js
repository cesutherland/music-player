exports.up = function(knex, Promise) {
  return Promise.all([
    // Tracks table:
    knex.schema.createTable("tracks", function (table) {
      table.string("id").primary().index().unique();
      table.json("track");
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('tracks')
  ]);
};
