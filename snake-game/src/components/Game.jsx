import React, { useEffect } from 'react';
import Phaser from 'phaser';
import GameScene from '../scenes/GameScene';

function Game({ difficulty, onGameOver }) {
  useEffect(() => {
    // Create Phaser game instance
    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: 'phaser-root',
      physics: {
        default: 'arcade',
        arcade: { debug: false }
      },
      scene: new GameScene(difficulty, onGameOver)
    };

    const game = new Phaser.Game(config);

    // Cleanup on unmount
    return () => game.destroy(true);
  }, [difficulty, onGameOver]);

  // The canvas will be injected here by Phaser
  return <div id="phaser-root" style={{ width: '100vw', height: '100vh' }} />;
}

export default Game;
