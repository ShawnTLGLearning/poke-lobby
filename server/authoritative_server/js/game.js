const players = {};

const config = {
  type: Phaser.HEADLESS,
  parent: "phaser-example",
  width: 1850,
  height: 1850,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: 0 },
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  autoFocus: false,
};

function preload() {
  this.load.image("ship", "assets/spaceShips_001.png");
  this.load.image("star", "assets/star_gold.png");

  this.load.image("otherPlayer", "assets/enemyBlack5.png");
  this.load.image("bg", "https://i.imgur.com/IgxkQw0.gif");
  this.load.spritesheet("phoenix", "assets/phoenix.png", {
    frameWidth: 96,
    frameHeight: 95,
  });
  this.load.spritesheet("leviathan", "assets/leviathan.png", {
    frameWidth: 96,
    frameHeight: 95,
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
  const self = this;
  this.players = this.physics.add.group();

  this.scores = {
    blue: 0,
    red: 0,
  };
  this.skins = {
    angel: "static",
    altima: "static",
    golbez: "static",
    ifrit: "static",
    sora: "static",
    daisy: "static",
    phoenix: "not static",
    leviathan: "not static",
    daisy: "static",
  };
  this.legends = {
    angel: "static",
    altima: "static",
    golbez: "static",
    ifrit: "static",
    sora: "static",
    daisy: "static",
    phoenix: "not static",
    leviathan: "not static",
    daisy: "static",
  };

  this.star = this.physics.add.image(
    randomPosition(700),
    randomPosition(500),
    "star"
  );
  this.physics.add.collider(this.players);

  this.physics.add.overlap(this.players, this.star, function (star, player) {
    if (players[player.playerId].team === "red") {
      self.scores.red += 10;
    } else {
      self.scores.blue += 10;
    }
    self.star.setPosition(randomPosition(1830), randomPosition(1830));
    io.emit("updateScore", self.scores);
    io.emit("starLocation", { x: self.star.x, y: self.star.y });
  });

  io.on("connection", function (socket) {
    console.log("a user connected");
    // create a new player and add it to our players object
    let allSkins = Object.keys(self.skins);
    players[socket.id] = {
      rotation: 0,
      x: Math.floor(Math.random() * 700) + 700,
      y: Math.floor(Math.random() * 500) + 400,
      playerId: socket.id,
      userName: "newb" + Object.keys(players).length,
      team: Math.floor(Math.random() * 2) == 0 ? "red" : "blue",
      skin: allSkins[Math.floor(Math.random() * allSkins.length)],
      input: {
        left: false,
        right: false,
        up: false,
        down: false,
      },
    };
    // add player to server
    addPlayer(self, players[socket.id]);
    // send the players object to the new player
    socket.emit("currentPlayers", players);
    // update all other players of the new player
    socket.broadcast.emit("newPlayer", players[socket.id]);
    // send the star object to the new player
    socket.emit("starLocation", { x: self.star.x, y: self.star.y });
    // send the current scores
    socket.emit("updateScore", self.scores);

    socket.on("disconnect", function () {
      console.log("user disconnected");
      // remove player from server
      removePlayer(self, socket.id);
      // remove this player from our players object
      delete players[socket.id];
      // emit a message to all players to remove this player
      io.emit("disconnect", socket.id);
    });

    // when a player moves, update the player data
    socket.on("playerInput", function (inputData) {
      handlePlayerInput(self, socket.id, inputData);
    });
  });
}

function update() {
  this.players.getChildren().forEach((player) => {
    const input = players[player.playerId].input;
    if (input.left) {
      player.setVelocityX(-300);
    } else if (input.right) {
      player.setVelocityX(300);
    } else {
      player.setVelocityX(0);
    }
    if (input.up) {
      player.setVelocityY(-300);
    } else if (input.down) {
      player.setVelocityY(300);
    } else {
      player.setVelocityY(0);
    }

    players[player.playerId].x = player.x;
    players[player.playerId].y = player.y;
    players[player.playerId].velocityX = player.body.velocity.x;
    players[player.playerId].velocityY = player.body.velocity.y;
  });
  this.physics.world.setBounds(0, 0, 1850, 1850);

  io.emit("playerUpdates", players);
}

function randomPosition(max) {
  return Math.floor(Math.random() * max) + 50;
}

function handlePlayerInput(self, playerId, input) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      players[player.playerId].input = input;
    }
  });
}

function addPlayer(self, playerInfo) {
  const player = self.physics.add
    .image(playerInfo.x, playerInfo.y, playerInfo.skin)
    .setOrigin(0.5, 0.5)
    .setDisplaySize(96, 96);

  player.setDrag(100);
  player.setAngularDrag(100);
  player.setMaxVelocity(200);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
  player.setCollideWorldBounds(true);
}

function removePlayer(self, playerId) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      player.destroy();
    }
  });
}

const game = new Phaser.Game(config);
window.done();
