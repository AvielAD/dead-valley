// a Web Worker for filling out the map

// so we can use tileMarshal even though it's defined
// with requirejs
var tileMarshal;
var define = function (r) {
  tileMarshal = r();
};

importScripts('json2.js', 'tilemarshal.js', 'underscore-min.js');

var Tile = function () {};
tileMarshal(Tile);

onmessage = function (e) {
  var config = JSON.parse(e.data);
  var total = config.width * config.height;
  var tiles = [];

  for (var i = 0; i < total; i++) {
    var tile = new Tile();
    tile.tileOffset = (Math.random() > 0.9) ? Math.floor(Math.random()*2) + 1 : 0;
    tile.tileFlip = Math.random() > 0.5;
    tile.tileRotate = Math.floor(Math.random() * 4);
    tiles.push(tile);
  }

  postMessage(_(tiles).map(function (t) { return t.toString(); }));
};