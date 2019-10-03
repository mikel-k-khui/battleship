import * as React from 'react';
import Game from './Game';
// import App from './App.jsx';


export default function GameContainer(props) {
  // console.log("Game Container's create Game has", props.state.count, "clicks");

  const [game, setGame] = React.useState();

  React.useEffect(() => {
    setGame(new Game({appState: props.state, sentGame: props.sentGame}));
  }, [])

  React.useEffect(() => {
    // console.log("Game is now ->", typeof game, game);
    game && game.setProps(props);
    // console.log("In game use effect", props.state);
  }, [props.state.gameState]);

 
  return (
    <section className="phaser-container" id="battleship" />
  );
}