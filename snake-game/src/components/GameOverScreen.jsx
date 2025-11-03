import React, { useEffect } from 'react';
import Phaser from 'phaser';
import SnakeGame from '../scenes/GameScene';

function Game() {
  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: 'phaser-root',
      backgroundColor: '#000000',
      scene: SnakeGame
    };

    const game = new Phaser.Game(config);

    return () => game.destroy(true);
  }, []);

  return <div id="phaser-root" style={{ width: '100vw', height: '100vh' }} />;
}

export default Game;
