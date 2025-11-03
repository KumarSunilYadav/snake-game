const DIFFICULTY_SETTINGS = {
  easy: { 
    enemySpeed: 3,      // Faster so you see them
    spawnRate: 0.5      // Spawn every 2 seconds
  },
  normal: { 
    enemySpeed: 4, 
    spawnRate: 1        // Spawn every second
  },
  hard: { 
    enemySpeed: 6, 
    spawnRate: 2        // Spawn 2 per second
  }
};

const GAME_CONFIG = {
  PLAYER_SPEED: 300,
  BULLET_SPEED: 500,
  FIRE_RATE: 200,
  ENEMY_SIZE: 50,      // Bigger enemies (easier to see)
  PLAYER_SIZE: 50      // Bigger player
};

export { DIFFICULTY_SETTINGS, GAME_CONFIG };
