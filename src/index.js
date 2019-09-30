import Phaser from 'phaser';
import logoImg from './assets/logo.png';
import greenBoatImg from './assets/green_battleship_sprite.png';
import explosionImg from './assets/explosion.png';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App.jsx';
const config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 1000,
  height: 600,
  scene: {
    preload: preload,
    create: create
  },
  scale: {
    // mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_HORIZONTALLY
  }
};
const gridDimensions = {
  singleSquareLength: 60,
  gridRows: 6
}
const game = new Phaser.Game(config);
function preload() {
  // this.load.image('splash', splashImg);
  this.load.spritesheet('greenBoat', greenBoatImg, {
    frameWidth: 66,
    frameHeight: 113
  });
  this.load.spritesheet('boom', explosionImg, {
    frameWidth: 64,
    frameHeight: 64,
    endFrame: 23
  });
}
function create() {
  this.add.text(200 - 360 / 2, 0, 'Your Ships', {
    font: '24pt "Inconsolata"',
    fill: 'green'
  });
  this.add.text(650 - 360 / 2, 0, 'Opponent', {
    font: '24pt "Inconsolata"',
    fill: 'green'
  });

  const boardLength = gridDimensions.gridRows * gridDimensions.singleSquareLength;
  const playerBoard = this.add.grid(200, 230, boardLength, boardLength, gridDimensions.singleSquareLength, gridDimensions.singleSquareLength, 0x057605);
  const opponentBoard = this.add.grid(650, 230, boardLength, boardLength, gridDimensions.singleSquareLength, gridDimensions.singleSquareLength, 0x057605);

  const boat = this.add.sprite(46, 230, 'greenBoat');
  
  boat.rotation = Math.PI / 2; // rotate 90 degrees
  boat.x += gridDimensions.singleSquareLength / 2;
  boat.y -= gridDimensions.singleSquareLength / 2;

  Phaser.Actions.GridAlign(boat, {
    cellWidth: 32,
    cellHeight: 32,
    x: 100,
    y: 100
  });

  var config = {
    key: 'explode',
    frames: this.anims.generateFrameNumbers('boom', {
      start: 0,
      end: 23,
      first: 23
    }),
    frameRate: 20
  };

  this.anims.create(config);

  const boom = this.add.sprite(100, 300, 'boom');

  boom.anims.play('explode');
}

let playerOneShips = [
  { x: 5, y: 4, size: 2, hits: 0, horizontal: false },
  { x: 5, y: 4, size: 2, hits: 0, horizontal: true },
  { x: 5, y: 4, size: 2, hits: 0, horizontal: true },
  { x: 5, y: 4, size: 2, hits: 0, horizontal: false },
  { x: 5, y: 4, size: 2, hits: 0, horizontal: false }
];


const renderShips = function(shipsArray) {
  shipsArray.foreach();
};

ReactDOM.render(<App />, document.getElementById('root'));
