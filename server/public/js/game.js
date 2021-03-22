let gameState = {
  skins: [
    "leviathan",
    "phoenix",
    "bahamut",
    "altima",
    "angel",
    "golbez",
    "ifrit",
    "sora",
    "daisy",
    "peach",
    "sailormoon",
  ],

  keys: ["walk-left", "walk-up", "walk-down", "walk-right"],

  frames: {
    "walk-left": { start: 4, end: 7 },
    "walk-right": { start: 8, end: 11 },
    "walk-up": { start: 12, end: 15 },
    "walk-down": { start: 0, end: 3 },
  },
};

var config = {
  type: Phaser.AUTO,
  parent: "phaser example",
  width: 1000,
  height: 600,
  scale: {
    mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT,
    autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
  },
  roundPixels: false,
  audio: { noAudio: false },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      enableBody: true,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

var game = new Phaser.Game(config);

function preload() {
  this.load.image("ship", "assets/spaceShips_001.png");
  this.load.image("otherPlayer", "assets/enemyBlack5.png");
  this.load.image("star", "assets/star_gold.png");
  this.load.image("pokeballs", "assets/pokeball.png");
  this.load.image("bg", "https://i.imgur.com/IgxkQw0.gif");
  this.load.spritesheet("phoenix", "assets/phoenix.png", {
    frameWidth: 96,
    frameHeight: 95,
  });
  this.load.spritesheet("leviathan", "assets/leviathan.png", {
    frameWidth: 96,
    frameHeight: 96,
  });
  this.load.spritesheet("bahamut", "assets/bahamut.png", {
    frameWidth: 96,
    frameHeight: 95,
  });
  this.load.spritesheet("altima", "assets/altima2.png", {
    frameWidth: 48,
    frameHeight: 48,
  });
  this.load.spritesheet("angel", "assets/angelsanctuary_alexiel.png", {
    frameWidth: 48,
    frameHeight: 48,
  });
  this.load.spritesheet("golbez", "assets/golbez.png", {
    frameWidth: 32,
    frameHeight: 48,
  });
  this.load.spritesheet("ifrit", "assets/ifrit.png", {
    frameWidth: 80,
    frameHeight: 80,
  });
  this.load.spritesheet("sora", "assets/kingdomhearts_sora.png", {
    frameWidth: 32,
    frameHeight: 48,
  });
  this.load.spritesheet("daisy", "assets/mario_princessdaisy.png", {
    frameWidth: 32,
    frameHeight: 48,
  });
  this.load.spritesheet("peach", "assets/mario_princesspeach.png", {
    frameWidth: 32,
    frameHeight: 48,
  });
  this.load.spritesheet("peach", "assets/sailormoon.png", {
    frameWidth: 32,
    frameHeight: 48,
  });
}

function create() {
  var self = this;
  this.socket = io();
  this.players = this.add.group();
  this.bg = this.add.image(0, 0, "bg");
  this.bg.setOrigin(0, 0);
  this.blueScoreText = this.add.text(500, 430, "", {
    fontSize: "32px",
    fill: "#0000FF",
  });
  this.redScoreText = this.add.text(1250, 430, "", {
    fontSize: "32px",
    fill: "#FF0000",
  });
  //make animations
  gameState.skins.forEach((skin) => {
    gameState.keys.forEach((key) => {
      console.table(skin);
      self.anims.create({
        key: key + "-" + skin,
        repeat: -1,
        frameRate: 4,
        frames: this.anims.generateFrameNames(skin, gameState.frames[key]),
      });
    });
  });

  const birdie = this.add.sprite(200, 200, "phoenix", 0);
  birdie.play("walk-down-phoenix");

  this.socket.on("currentPlayers", function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        //Adding
        gameState.player = self.add
          .sprite(players[id].x, players[id].y, players[id].skin, 0)
          .setOrigin(0.5, 0.5)
          .setDisplaySize(48, 96);
        gameState.player.play("walk-down" + "-" + players[id].skin, true);
        gameState.player.skin = players[id].skin;
        console.table(Object.entries(players[id]));
        // if (players[id].team === "blue") gameState.player.setTint(0x0000ff);
        // else gameState.player.setTint(0xff0000);
        gameState.player.playerId = players[id].playerId;
        self.players.add(gameState.player);
        self.cameras.main.setBounds(0, 0, 1830, 1830);
        self.cameras.main.startFollow(gameState.player, true, 0.5, 0.5);
      } else {
        displayPlayers(self, players[id], players[id].skin);
      }
    });
  });

  this.socket.on("newPlayer", function (playerInfo) {
    displayPlayers(self, playerInfo, playerInfo.skin);
  });

  this.socket.on("disconnect", function (playerId) {
    self.players.getChildren().forEach(function (player) {
      if (playerId === player.playerId) {
        player.setActive(false).setVisible(false);
        player.destroy();
      }
    });
  });

  this.socket.on("playerUpdates", function (players) {
    Object.keys(players).forEach(function (id) {
      self.players.getChildren().forEach(function (player) {
        if (players[id].playerId === player.playerId) {
          player.setRotation(players[id].rotation);
          player.setPosition(players[id].x, players[id].y);
        } else {
        }
      });
    });
  });

  this.socket.on("updateScore", function (scores) {
    self.blueScoreText.setText("Blue: " + scores.blue);
    self.redScoreText.setText("Red: " + scores.red);
  });

  this.socket.on("starLocation", function (starLocation) {
    if (!self.star) {
      self.star = self.add
        .image(starLocation.x, starLocation.y, "pokeballs")
        .setDisplaySize(50, 50);
    } else {
      self.star.setPosition(starLocation.x, starLocation.y);
    }
  });

  this.cursors = this.input.keyboard.createCursorKeys();
  this.leftKeyPressed = false;
  this.rightKeyPressed = false;
  this.upKeyPressed = false;
  this.downKeyPressed = false;
}

function update() {
  const left = this.leftKeyPressed;
  const right = this.rightKeyPressed;
  const up = this.upKeyPressed;
  const down = this.downKeyPressed;

  if (this.cursors.left.isDown) {
    this.leftKeyPressed = true;
    gameState.player.play("walk-left-" + gameState.player.skin, true);
  } else {
    this.leftKeyPressed = false;
  }
  if (this.cursors.right.isDown) {
    this.rightKeyPressed = true;
    gameState.player.play("walk-right-" + gameState.player.skin, true);
  } else {
    this.rightKeyPressed = false;
  }
  if (this.cursors.up.isDown) {
    gameState.player.play("walk-up-" + gameState.player.skin, true);
    this.upKeyPressed = true;
  } else {
    this.upKeyPressed = false;
  }
  if (this.cursors.down.isDown) {
    gameState.player.play("walk-down" + "-" + gameState.player.skin, true);
    this.downKeyPressed = true;
  } else {
    this.downKeyPressed = false;
  }

  if (
    left !== this.leftKeyPressed ||
    right !== this.rightKeyPressed ||
    up !== this.upKeyPressed ||
    down !== this.downKeyPressed
  ) {
    this.socket.emit("playerInput", {
      left: this.leftKeyPressed,
      right: this.rightKeyPressed,
      up: this.upKeyPressed,
      down: this.downKeyPressed,
    });
  }
}

function displayPlayers(self, playerInfo, sprite) {
  const player = self.add
    .sprite(playerInfo.x, playerInfo.y, sprite)
    .setOrigin(0.5, 0.5)
    .setDisplaySize(96, 96);

  player.playerId = playerInfo.playerId;
  self.players.add(player);
}
