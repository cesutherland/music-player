
exports.up = function(knex) {
  return Promise.all([
    knex.schema.table('user_tracks', table => {
      table.dateTime('added_to_library');
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.table('user_tracks', table => {
      table.dropColumn('added_to_library');
    })
  ]);
};
