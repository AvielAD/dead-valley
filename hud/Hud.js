// Place where we handle all the HUD interaction details
define(['Game',
        'hud/InventoryDisplay',
        'hud/DudeHandsInventoryDisplay',
        'hud/LifeMeter',
        'hud/Pause',
        'hud/Framerate',
        'hud/FuelGauge',
        'hud/Tip',
        'hud/CheckEngineLight',
        'Firearm'],

       function (Game,
                 InventoryDisplay,
                 DudeHandsInventoryDisplay,
                 LifeMeter,
                 Pause,
                 Framerate,
                 FuelGauge,
                 Tip,
                 CheckEngineLight,
                 Firearm) {

  var dudeInventory, dudeHands;
  var inventoryShown = false;
  var $dudeInventoryDiv = $('#dude-inventory').hide();
  var $otherInventoryDiv = $('#other-inventory').hide();
  var otherInventory = null;
  var otherInventoryDisplay = null;
  var change = false

  var hudStatus = {
    fuelGauge:      false,
    checkEngine:    false,
    dudeInventory:  false,
    otherInventory: false
  };

  var hudElements = {
    fuelGauge:      FuelGauge,
    checkEngine:    CheckEngineLight,
    dudeInventory:  $dudeInventoryDiv,
    otherInventory: $otherInventoryDiv
  };

  // run once per frame
  var updateHud = function () {

    if (change) {

      if (!otherInventory && otherInventoryDisplay) {
        removeOtherInventory();
      }

      if (otherInventory &&
         (!otherInventoryDisplay ||
          otherInventory !== otherInventoryDisplay.inventory)) {
        updateOtherInventory();
      }

      _.each(hudStatus, function (status, hud) {
        var element = hudElements[hud];
        status = inventoryShown && status;
        if (element) {
          status ? element.show() : element.hide();
        }
      });

      change = false;
    }

  };

  // remove the current other inventory
  var removeOtherInventory = function () {
    if (otherInventoryDisplay) {
      otherInventoryDisplay.clearEventHandlers();
      otherInventoryDisplay = null;
      otherInventory = null;
      $otherInventoryDiv.empty();
    }
  };

  // update the other inventory to whatever is focused
  var updateOtherInventory = function () {
    removeOtherInventory();
    otherInventoryDisplay = new InventoryDisplay(otherInventory,
                                                 $otherInventoryDiv,
                                                 { doubleClickTarget:Game.dude.inventory });
    otherInventoryDisplay.show();
  };

  // set up the dude's inventories and other handlers
  var dudeSetup = function (dude) {
    $dudeInventoryDiv.empty();
    dudeInventory = new InventoryDisplay(Game.dude.inventory,
                                         $dudeInventoryDiv,
                                         { doubleClickTarget: Game.dude.hands });
    dudeHands = DudeHandsInventoryDisplay($dudeInventoryDiv);
    dudeInventory.show();
    dudeHands.show();

    // now that we have a dude, attach his handlers
    attachHandlers(dude, dudeHandlers);
  };

  var attachHandlers = function (eventMachine, handlers) {
    _.each(handlers, function (handler, key) {
      eventMachine.subscribe(key, function () {
        handler.apply(this, arguments);
        change = true;
      });
    });
  };

  var gameHandlers = {
    'toggle inventory': function () {
      inventoryShown = !inventoryShown;
      hudStatus.dudeInventory = inventoryShown;
    },
    'hide inventory': function () {
      inventoryShown = false;
      hudStatus.dudeInventory = false;
    },
    'start fueling': function (fuelee) {
      if (fuelee.isCar) {
        hudStatus.fuelGauge = true;
      }
    },
    'stop fueling': function (fuelee) {
      hudStatus.fuelGauge = false;
    },
    'new dude': dudeSetup,
    'end frame': updateHud
  };

  var dudeHandlers = {
    'entered car': function (car) {
      otherInventory = car.inventory;
      hudStatus.otherInventory = true;
      hudStatus.fuelGauge      = true;
      hudStatus.checkEngine    = true;
    },

    'left car': function (car) {
      otherInventory = null;
      hudStatus.otherInventory = false;
      hudStatus.fuelGauge      = false;
      hudStatus.checkEngine    = false;
    },

    'entered building': function (building) {
      otherInventory = building.inventory;
      hudStatus.otherInventory = true;
    },

    'left building': function (building) {
      otherInventory = null;
      hudStatus.otherInventory = false;
    },

    'started touching': function (sprite) {
      // show the car's inventory when we touch it
      if (sprite.isCar && sprite.inventory) {
        otherInventory = sprite.inventory;
        hudStatus.otherInventory = true;
      }
    },

    'stopped touching': function (sprite) {
      if (sprite.isCar) {
        otherInventory = null;
        hudStatus.otherInventory = false;
      }
    }
  };

  // use items on right click
  $("#canvas-mask .inventory .inventory-item").live('mousedown', function (e) {
    if (e.button == 2) { // right click
      var item = $(this).data('item');
      if (item.use) {
        item.use();
      } else if (item instanceof Firearm && item.ammoType) {
        // eject ammo from firearms on right click
        var count = item.eject();
        if (count) {
          var ammo = new item.ammoType(count);
          dudeInventory.restartDrag(ammo, null, e);
        }
      }
      e.preventDefault();
    }
  });

  // framerate HUD
  Game.addSprite(Framerate);

  // so the light can blink
  Game.addSprite(CheckEngineLight);
  
  // attach all the handlers to game events we care about
  attachHandlers(Game.events, gameHandlers);
});
