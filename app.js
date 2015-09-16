// Deps:
var express = require('express');
var cors = require('cors');


// App:
var app = express();

app.use(cors());

app.get('/tracks', function (req, res) {
  res.json({
    items: require('./tracks')
  });
});

app.listen(8300, function () {
  console.log('listening on 8300');
});

