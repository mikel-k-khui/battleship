import 'phaser';
import greenBoatImg from '../assets/green_battleship_sprite.png';
import waterImg from '../assets/battleship_sprite_water.png';
import explosionImg from '../assets/explosion.png';
import explosionImgBlue from '../assets/explosion_blue.png';
import config from '../config';
import io from 'socket.io-client';
import sample from '../sample0';
import { SENT_GAME } from '../hooks/gameReducers';

const socket = io(config.API_PATH);

const gridDimensions = {
  singleSquareLength: 60,
  gridRows: 6
}; // e.g. we have a <gridRows> x <gridRows> square grid where each square has a width and height of <singleSquareLength>

let boats = {};

var myTurn = false;

const rowNumbers = {
  a: 1,
  b: 2,
  c: 3,
  d: 4,
  e: 5,
  f: 6
};

const getKeyByValue = function(object, value) {
  return Object.keys(object).find(key => object[key] === value);
};

const getRowLetterByNumber = function(rowNumber) {
  // rowNumber is 0-5, this will return a-f
  return getKeyByValue(rowNumbers, rowNumber + 1);
};

const distributeShips = function(spotsOccupiedObj) {
  let shipsArray = [];

  while (shipsArray.length < 5) {
    let ship = {
      // assign random spot
      row: Object.keys(rowNumbers)[
        Math.floor(Math.random() * Object.keys(rowNumbers).length)
      ],
      col:
        rowNumbers[
          Object.keys(rowNumbers)[
            Math.floor(Math.random() * Object.keys(rowNumbers).length)
          ]
        ],
      size: 2,
      sunk: false,
      horizontal: Math.random() >= 0.5 // true or false
    };
    if (ShipLocationIsValid(ship, spotsOccupiedObj)) {
      // now verify that the proposed location is in fact valid, AND NOT OVERLAPPING EXISTING SHIP!
      shipsArray.push(ship);
      occupySpots(ship, spotsOccupiedObj);
    }
  }
  return shipsArray;
};

const ShipLocationIsValid = function(ship, spotsOccupiedObj) {
  if (ship.col === 6 && ship.horizontal === true) {
    return false;
  }
  // ship cannot start in 6th row and be vertical
  if (ship.row === 'f' && ship.horizontal === false) {
    return false;
  }
  if (ship.horizontal) {
    if (
      spotsOccupiedObj[ship.row][ship.col - 1] === 1 ||
      spotsOccupiedObj[ship.row][ship.col] === 1
    ) {
      return false; // ship cannot overlap an existing boat
    }
  } else {
    // ship is vertical
    if (
      spotsOccupiedObj[ship.row][ship.col - 1] === 1 ||
      spotsOccupiedObj[nextChar(ship.row)][ship.col - 1] === 1
    ) {
      return false; // ship cannot overlap an existing boat
    }
  }
  return true;
};

const occupySpots = function(ship, spotsOccupiedObj) {
  if (ship.horizontal) {
    spotsOccupiedObj[ship.row][ship.col - 1] = 1;
    spotsOccupiedObj[ship.row][ship.col] = 1;
  } else {
    //if ship is vertical
    spotsOccupiedObj[ship.row][ship.col - 1] = 1;
    spotsOccupiedObj[nextChar(ship.row)][ship.col - 1] = 1;
  }
};

const nextChar = function(c) {
  return String.fromCharCode(c.charCodeAt(0) + 1);
};

const playerSpotsOccupied = sample.gameState.boards.own;
// const opponentSpotsOccupied = sample.gameState.boards.opponent;
let opponentSpotsOccupied = {
  a: [0, 0, 0, 0, 0, 0],
  b: [0, 0, 0, 0, 0, 0],
  c: [0, 0, 0, 0, 0, 0],
  d: [0, 0, 0, 0, 0, 0],
  e: [0, 0, 0, 0, 0, 0],
  f: [0, 0, 0, 0, 0, 0]
};

let playerTwoShips = distributeShips(opponentSpotsOccupied);

let shotsOnPlayerOne = sample.gameState.shots.opponent;
let shotsOnOpponent = sample.gameState.shots.own;

export default class BootScene extends Phaser.Scene {
  constructor(props) {
    super('Boot');
  }

  // set props(props) {
  //   this.state = props.state;
  //   this.setState = props.setState;
  // }

  preload() {
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
    this.load.spritesheet('boomBlue', explosionImgBlue, {
      frameWidth: 64,
      frameHeight: 64,
      endFrame: 23
    });
    this.load.spritesheet('water', waterImg, {
      frameWidth: 60,
      frameHeight: 60
    });
  }

  create() {
    const leftTitle = this.add.text(200 - 360 / 2, 0, 'Your Ships', {
      font: '24pt "Inconsolata"',
      fill: 'green'
    });
    leftTitle.setInteractive({ useHandCursor: true });
    leftTitle.on('pointerup', () => {
      console.log('Bootscene ', this.game.state.count);
      this.game.setState({
        ...this.game.state,
        count: this.game.state.count - 1
      });
    });
    const rightTitle = this.add.text(650 - 360 / 2, 0, 'Opponent', {
      font: '24pt "Inconsolata"',
      fill: 'green'
    });

    const playerBoard = this.displayGrid(
      50,
      80,
      playerSpotsOccupied,
      shotsOnPlayerOne,
      false
    );
    const opponentBoard = this.displayGrid(
      500,
      80,
      opponentSpotsOccupied,
      shotsOnOpponent,
      true
    );

    // console.log("In create():", this.game.appState.gameState.gameState.boards.own);

    const playerOneShips = this.game.appState.gameState.gameState.ships.own;
    // let playerTwoShips = this.game.appState.gameState.gameState.ships.opponent;
    this.renderShips('playerBoard', playerOneShips, false);
    this.renderShips('opponentBoard', playerTwoShips, true);

    const explodeconfig = {
      key: 'explode',
      frames: this.anims.generateFrameNumbers('boom', {
        start: 0,
        end: 23,
        first: 23
      }),
      frameRate: 20
    };

    const explodeconfigBlue = {
      key: 'explodeBlue',
      frames: this.anims.generateFrameNumbers('boomBlue', {
        start: 0,
        end: 23,
        first: 23
      }),
      frameRate: 20
    };

    this.anims.create(explodeconfig);
    this.anims.create(explodeconfigBlue);
  }
  update() {
    let hits = 0;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        const row = getRowLetterByNumber(j);
        const col = i;
        if (
          shotsOnOpponent[row][col] === 1 &&
          opponentSpotsOccupied[row][col] === 1
        )
          hits++;
      }
    }
    // console.log('hits', hits);
    if (hits === 10) {
      console.log('end game');
      // this.scene.pause(); // works
    }
  }

  renderShips = function(board, shipsArray, onlySunk) {
    let adjustmentx = 440; // hardcoded to align with opponent board
    let adjustmenty = 50;
    let frame = 0;
    if (board === 'playerBoard') {
      adjustmentx = -10;
    }
    // filter for only non-sunk ships if onlySunk flag tripped
    if (onlySunk) {
      shipsArray = shipsArray.filter(ship => ship.sunk === true);
    }
    // now display them
    shipsArray.forEach((ship, index) => {
      boats[index] = this.add.sprite(
        ship.col * gridDimensions.singleSquareLength + adjustmentx,
        rowNumbers[ship.row] * gridDimensions.singleSquareLength + adjustmenty,
        'greenBoat',
        ship.sunk ? (frame = 3) : (frame = 0)
      );
      if (ship.horizontal) {
        boats[index].angle = 90;
        boats[index].x += gridDimensions.singleSquareLength / 2;
        boats[index].y -= gridDimensions.singleSquareLength / 2;
      }
      const tween = this.tweens.add({
        targets: boats[index],
        alpha: { from: 0, to: 1 },
        // alpha: { start: 0, to: 1 },
        // alpha: 1,
        // alpha: '+=1',
        ease: 'Back',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
        duration: 2000,
        repeat: 0,            // -1: infinity
        yoyo: false
    });
    });
  };

  explode = function(board, row, col, blue) {
    let adjustmentx = 500;
    let adjustmenty = 20;
    if (board === 'playerBoard') {
      adjustmentx = -10;
    }
    const xcoord = gridDimensions.singleSquareLength * col + adjustmentx;
    const ycoord =
      gridDimensions.singleSquareLength * rowNumbers[row] + adjustmenty;
    if (!blue) {
      const boom = this.add.sprite(xcoord, ycoord, 'boom');
      boom.anims.play('explode');
    } else {
      const boomBlue = this.add.sprite(xcoord, ycoord, 'boomBlue');
      boomBlue.anims.play('explodeBlue');
    }
  };

  isHit = function(row, col, board) {
    return board[row][col] === 1;
  };

  areShipsSunk = function(spotsOccupiedObj, shotsObj, shipsArray) {
    shipsArray.forEach(ship => {
      if (ship.horizontal) {
        if (
          shotsObj[ship.row][ship.col - 1] === 1 &&
          shotsObj[ship.row][ship.col] === 1
        ) {
          ship.sunk = true;
        }
      } else {
        if (
          shotsObj[ship.row][ship.col - 1] === 1 &&
          shotsObj[nextChar(ship.row)][ship.col - 1] === 1
        ) {
          ship.sunk = true;
        }
      }
    });
  };

  displayGrid = function(
    xoffset,
    yoffset,
    spotsOccupiedObj,
    shotsObj,
    opponentBoardFlag
  ) {
    myTurn = true;
    for (let i = 0; i < 6; i++) {
      for (let k = 0; k < 6; k++) {
        let tile = this.add.sprite(60 * i + xoffset, 60 * k + yoffset, 'water');

        //.setInteractive(); for vacant spots;
        const row = getRowLetterByNumber(k);
        const col = i;
        if (spotsOccupiedObj[row][col] === 1 && shotsObj[row][col] === 1) {
          tile.setFrame(3); // it's a hit!
        } else if (
          spotsOccupiedObj[row][col] === 0 &&
          shotsObj[row][col] === 1
        ) {
          tile.setFrame(2); // it's a miss!
        } else if (opponentBoardFlag) {
          // && turn?
          tile.setInteractive(); // let's blow stuff up!
        }

        if (opponentBoardFlag) {
          myTurn = true;
          tile.on('pointerover', function(pointer) {
            tile.setFrame(1);
          });
          tile.on('pointerout', function(pointer) {
            tile.setFrame(0);
          });
          tile.on('pointerdown', function(pointer) {
            shotsObj[row][col] = 1; // update the hit
            this.scene.game.sentGame({
              row: getRowLetterByNumber(k),
              col: i
            });
            if (spotsOccupiedObj[row][col] === 1) {
              // It's a hit!
              this.scene.explode('opponentBoard', row, col);
              tile.setFrame(3);
              tile.removeInteractive();
              // now check if any boats are sunk
              this.scene.areShipsSunk(
                shotsOnOpponent,
                shotsObj,
                playerTwoShips
              );
              // and add these boats to the scene
              this.scene.renderShips('opponentBoard', playerTwoShips, true); // render any sunken ships
            }
            if (spotsOccupiedObj[row][col] === 0) {
              // It's a miss!
              this.scene.explode('opponentBoard', row, col, 1);
              tile.setFrame(2);
              tile.removeInteractive();
            }
            // myTurn = false;
            // this.scene.scene.pause(); // works
            // console.log('clicked', getKeyByValue(rowNumbers, k + 1), i + 1);
            // now send socket message to server…
          });
        }
      }
    }
  };
}
