import React, { useState } from 'react';
import Game from './components/Game';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';
import './App.css';

function App() {
  const [gameState, setGameState] = useState('start');
  const [difficulty, setDifficulty] = useState('normal');
  const [finalScore, setFinalScore] = useState(0);

  const handleStartGame = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setGameState('playing');
  };

  const handleGameOver = (score) => {
    setFinalScore(score);
    setGameState('gameover');
  };

  const handleRestart = () => {
    setGameState('start');
  };

  return (
    <div className="app">
      {gameState === 'start' && <StartScreen onStart={handleStartGame} />}
      {gameState === 'playing' && <Game difficulty={difficulty} onGameOver={handleGameOver} />}
      {gameState === 'gameover' && <GameOverScreen score={finalScore} onRestart={handleRestart} />}
    </div>
  );
}

export default App;
