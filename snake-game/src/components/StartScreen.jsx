import React from 'react';
import './components.css';

function StartScreen({ onStart }) {
  return (
    <div className="start-screen">
      <h1>🐍 SNAKE GAME</h1>
      <p>Eat the apples and grow longer!</p>
      <div className="difficulty-buttons">
        <button onClick={() => onStart('easy')}>PLAY NOW</button>
      </div>
      <div className="game-rules">
        <h3>How to Play:</h3>
        <p>🎮 Use Arrow Keys or WASD to control the snake</p>
        <p>🍎 Eat red apples to grow longer</p>
        <p>⚠️ Don't hit walls or yourself!</p>
        <p>🏆 Beat your high score!</p>
      </div>
    </div>
  );
}

export default StartScreen;
