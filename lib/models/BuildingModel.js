define(["Game", "SpriteModel", "Collidable", "Vector", "Inventory", "sprites/Zombie"],
       function (Game, SpriteModel, Collidable, Vector, Inventory, Zombie) {

  var MAX_HEALTH = 10;

  var BuildingModel = function (points) {
    this.points = points;

    _.invoke(points, "retain");

    // find center point
    this.pos = _.reduce(points, function (memo, point) {
      return memo.translate(point);
    }, Vector.create(0, 0));
    this.pos.retain();

    this.pos.scale(1/points.length);
    this.pos.rot = 0;

    this.vel = Vector.create(0, 0, true);
    this.vel.rot = 0;

    // how much damage it can take before dude pops out
    this.health = MAX_HEALTH;

    this.inventory = new Inventory({width:12, height:8, name:this.name});

    SpriteModel.prototype.calculateNormals.call(this);

    // building doesn't move so points and normals don't move
    // either
    this.transPoints  = this.points;
    this.transNormals = this.normals;

    SpriteModel.newID(this);
  };
  BuildingModel.prototype = new SpriteModel();

  // don't save when the level is saved like a sprite
  // -- we're going to save this our own way
  BuildingModel.prototype.shouldSave     = false;
  BuildingModel.prototype.name           = 'BuildingModel';
  BuildingModel.prototype.visible        = true;
  BuildingModel.prototype.isBuildingModel     = true;
  BuildingModel.prototype.mass           = Number.MAX_VALUE;
  BuildingModel.prototype.inertia        = Number.MAX_VALUE;
  BuildingModel.prototype.stationary     = true;

  // always in collide range because it's never in game's sprite list
  BuildingModel.prototype.collideRange   = true;

  BuildingModel.prototype.collision = function (other, point, normal, vab) {
    var proj = {};
    other.lineProjection(normal.clone().normalize(), proj);
    // all the way inside
    if (Math.abs(proj.max - proj.min) < normal.magnitude()) {
      // push em out
      other.pos.translate(normal.scale(-1));
    }
  };

  var pushBackDude = function (dude) {
    var node = dude.currentNode;
    var pushback = Game.gridSize / 2;
    // cheesy but hey
    if (node.north.nextSprite && node.north.nextSprite.isBuildingModel) {
      dude.pos.y += pushback;
    } else if (node.south.nextSprite && node.south.nextSprite.isBuildingModel) {
      dude.pos.y -= pushback;
    } else if (node.east.nextSprite && node.east.nextSprite.isBuildingModel) {
      dude.pos.x -= pushback;
    } else if (node.west.nextSprite && node.west.nextSprite.isBuildingModel) {
      dude.pos.x += pushback;
    }
  };

  BuildingModel.prototype.enter = function (dude) {
    if (this.zombies) {
      // zombies pop out!
      for (var i = 0; i < this.zombies; i++) {
        var zombie = new Zombie();
        zombie.pos.set(dude.pos);
        var extra = Vector.create(Math.random() * 360);
        zombie.pos.translate(extra.scale(5));
        Game.addSprite(zombie);
      }

      this.zombies = 0;

      // push dude back a bit
      pushBackDude(dude);

      return false; // can't enter
    } else {
      this.health = MAX_HEALTH;
      Game.events.fireEvent('enter building', this);
      return true; // can enter
    }
  };

  BuildingModel.prototype.leave = function (dude) {
    Game.events.fireEvent('leave building', this);
  };

  BuildingModel.prototype.takeDamage = function (amount) {
    if (Game.dude.inside === this) {
      this.health -= amount;
      if (this.health <= 0) {
        // kick him out!
        Game.dude.leaveBuilding();
      }
    }
  };

  Collidable(BuildingModel, { ignore: ['Building'] });

  // redefine collidable's pointVel
  BuildingModel.prototype.pointVel = function () {
    return this.vel;
  };

  return BuildingModel;
});
