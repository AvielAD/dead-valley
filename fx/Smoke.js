define(['game', 'Sprite'], function (game, Sprite) {

  var MAX_LIFE = 2; // in seconds

  var Smoke = function () {
    this.init('Smoke');

    this.frame = Math.floor(Math.random() * 4);
    this.life  = 0;
    this.scale = 0.1;

    this.pos.rot = 360 * Math.random();

    this.vel.set(360 * Math.random());
    this.vel.scale(Math.random() * 5);
  };
  Smoke.prototype = new Sprite();

  Smoke.prototype.draw = function (delta) {
    this.drawTile(this.frame);
  };

  Smoke.prototype.preMove = function (delta) {
    this.pos.rot += 20 * delta;
    this.scale += 0.35 * delta;
  };

  Smoke.prototype.postMove = function (delta) {
    this.life += delta;
    if (this.life > MAX_LIFE) {
      this.die();
    }
  };

  // don't need these methods
  Smoke.prototype.transformNormals = function () {};
  Smoke.prototype.updateGrid       = function () {};

  Smoke.createNew = function (position) {
    var smoke = new Smoke();
    smoke.pos.set(position);
    game.sprites.push(smoke);
  };

  return Smoke;
});
