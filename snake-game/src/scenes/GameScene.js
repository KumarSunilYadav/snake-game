import Phaser from 'phaser';
import { saveScore } from '../utils/storage';

export default class SnakeGame extends Phaser.Scene {
  constructor() {
    super({ key: 'SnakeGame' });
  }

  preload() {
    this.load.on('loaderror', () => {
      console.log('Audio files not found - playing without sound');
    });
    
    this.load.audio('eat', '/assets/sounds/eat.mp3');
    this.load.audio('gameOver', '/assets/sounds/game-over.mp3');
  }

  create() {
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
    
    // Game settings
    this.gridSize = 25;
    this.speed = 150;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
    this.gameIsOver = false;
    
    this.initSounds();
    
    // Snake with better starting position
    this.snake = [];
    const startX = Math.floor(this.scale.width / this.gridSize / 2);
    const startY = Math.floor(this.scale.height / this.gridSize / 2);
    
    this.snake.push({ x: startX, y: startY });
    this.snake.push({ x: startX - 1, y: startY });
    this.snake.push({ x: startX - 2, y: startY });
    
    this.direction = 'RIGHT';
    this.newDirection = 'RIGHT';
    
    this.gridWidth = Math.floor(this.scale.width / this.gridSize);
    this.gridHeight = Math.floor(this.scale.height / this.gridSize);
    
    this.graphics = this.add.graphics();
    this.graphics.setDepth(1);
    
    this.food = this.spawnFood();
    console.log('Game started - Apple at:', this.food);
    
    // Desktop controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    
    // Mobile touch controls - Swipe detection
    this.setupTouchControls();
    
    // Mobile on-screen buttons
    this.createMobileButtons();
    
    if (this.moveTimer) {
      this.moveTimer.remove();
    }
    
    this.moveTimer = this.time.addEvent({
      delay: this.speed,
      callback: this.moveSnake,
      callbackScope: this,
      loop: true
    });
    
    this.cameras.main.setBackgroundColor('#1a1a1a');
    this.createHUD();
    this.render();
  }

  setupTouchControls() {
    // Swipe detection
    this.input.on('pointerdown', (pointer) => {
      this.swipeStartX = pointer.x;
      this.swipeStartY = pointer.y;
      this.swipeTime = this.time.now;
    });

    this.input.on('pointerup', (pointer) => {
      if (this.gameIsOver) return;
      
      const swipeEndX = pointer.x;
      const swipeEndY = pointer.y;
      const swipeTime = this.time.now - this.swipeTime;
      
      // Only register swipe if it was quick (< 300ms)
      if (swipeTime > 300) return;
      
      const deltaX = swipeEndX - this.swipeStartX;
      const deltaY = swipeEndY - this.swipeStartY;
      
      const minSwipeDistance = 30;
      
      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0 && this.direction !== 'LEFT') {
            this.newDirection = 'RIGHT';
          } else if (deltaX < 0 && this.direction !== 'RIGHT') {
            this.newDirection = 'LEFT';
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0 && this.direction !== 'UP') {
            this.newDirection = 'DOWN';
          } else if (deltaY < 0 && this.direction !== 'DOWN') {
            this.newDirection = 'UP';
          }
        }
      }
    });
  }

  createMobileButtons() {
    // Only show on mobile/touch devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile && this.scale.width > 768) return; // Don't show on desktop
    
    const buttonSize = 60;
    const buttonAlpha = 0.6;
    const centerX = this.scale.width / 2;
    const bottomY = this.scale.height - 100;
    
    // Up button
    this.upButton = this.createButton(centerX, bottomY - 80, '▲', () => {
      if (this.direction !== 'DOWN') this.newDirection = 'UP';
    }, buttonSize, buttonAlpha);
    
    // Down button
    this.downButton = this.createButton(centerX, bottomY, '▼', () => {
      if (this.direction !== 'UP') this.newDirection = 'DOWN';
    }, buttonSize, buttonAlpha);
    
    // Left button
    this.leftButton = this.createButton(centerX - 80, bottomY - 40, '◄', () => {
      if (this.direction !== 'RIGHT') this.newDirection = 'LEFT';
    }, buttonSize, buttonAlpha);
    
    // Right button
    this.rightButton = this.createButton(centerX + 80, bottomY - 40, '►', () => {
      if (this.direction !== 'LEFT') this.newDirection = 'RIGHT';
    }, buttonSize, buttonAlpha);
  }

  createButton(x, y, text, callback, size, alpha) {
    const button = this.add.graphics();
    button.fillStyle(0x444444, alpha);
    button.fillRoundedRect(-size/2, -size/2, size, size, 10);
    button.lineStyle(3, 0x00ff00, 0.8);
    button.strokeRoundedRect(-size/2, -size/2, size, size, 10);
    button.setPosition(x, y);
    button.setDepth(100);
    button.setInteractive(new Phaser.Geom.Rectangle(-size/2, -size/2, size, size), Phaser.Geom.Rectangle.Contains);
    
    const buttonText = this.add.text(x, y, text, {
      fontSize: '32px',
      fill: '#00ff00',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101);
    
    button.on('pointerdown', () => {
      button.clear();
      button.fillStyle(0x00ff00, 0.8);
      button.fillRoundedRect(-size/2, -size/2, size, size, 10);
      callback();
    });
    
    button.on('pointerup', () => {
      button.clear();
      button.fillStyle(0x444444, alpha);
      button.fillRoundedRect(-size/2, -size/2, size, size, 10);
      button.lineStyle(3, 0x00ff00, 0.8);
      button.strokeRoundedRect(-size/2, -size/2, size, size, 10);
    });
    
    return button;
  }

  initSounds() {
    this.eatSound = null;
    this.gameOverSound = null;

    try {
      if (this.cache.audio.exists('eat')) {
        this.eatSound = this.sound.add('eat', { volume: 0.5 });
      }
      if (this.cache.audio.exists('gameOver')) {
        this.gameOverSound = this.sound.add('gameOver', { volume: 0.6 });
      }
    } catch (e) {
      console.log('Sounds not available');
    }
  }

  createHUD() {
    if (this.hudBg) this.hudBg.destroy();
    if (this.scoreText) this.scoreText.destroy();
    if (this.highScoreText) this.highScoreText.destroy();
    if (this.lengthText) this.lengthText.destroy();
    if (this.instructionsText) this.instructionsText.destroy();
    
    this.hudBg = this.add.graphics();
    this.hudBg.fillStyle(0x000000, 0.8);
    this.hudBg.fillRect(0, 0, this.scale.width, 80);
    
    this.scoreText = this.add.text(20, 20, '🍎 Score: 0', {
      fontSize: '32px',
      fill: '#00ff00',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    
    this.highScoreText = this.add.text(this.scale.width - 20, 20, '🏆 Best: ' + this.highScore, {
      fontSize: '28px',
      fill: '#ffff00',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(1, 0);
    
    this.lengthText = this.add.text(this.scale.width / 2, 20, '🐍 Length: 3', {
      fontSize: '28px',
      fill: '#00ffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5, 0);
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const instructions = isMobile ? '📱 Swipe or Use Buttons to Move!' : '🎮 Arrow Keys or WASD to Move!';
    
    this.instructionsText = this.add.text(this.scale.width / 2, this.scale.height - 60, 
      instructions, {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
  }

  update() {
    if (this.gameIsOver) return;
    
    // Desktop controls
    if (this.cursors.left.isDown || this.aKey.isDown) {
      if (this.direction !== 'RIGHT') this.newDirection = 'LEFT';
    } else if (this.cursors.right.isDown || this.dKey.isDown) {
      if (this.direction !== 'LEFT') this.newDirection = 'RIGHT';
    } else if (this.cursors.up.isDown || this.wKey.isDown) {
      if (this.direction !== 'DOWN') this.newDirection = 'UP';
    } else if (this.cursors.down.isDown || this.sKey.isDown) {
      if (this.direction !== 'UP') this.newDirection = 'DOWN';
    }
  }

  moveSnake() {
    if (this.gameIsOver) return;
    
    this.direction = this.newDirection;
    
    const head = { ...this.snake[0] };
    
    switch (this.direction) {
      case 'UP':
        head.y -= 1;
        break;
      case 'DOWN':
        head.y += 1;
        break;
      case 'LEFT':
        head.x -= 1;
        break;
      case 'RIGHT':
        head.x += 1;
        break;
    }
    
    if (head.x < 0 || head.x >= this.gridWidth || 
        head.y < 0 || head.y >= this.gridHeight) {
      this.gameOver();
      return;
    }
    
    for (let segment of this.snake) {
      if (head.x === segment.x && head.y === segment.y) {
        this.gameOver();
        return;
      }
    }
    
    this.snake.unshift(head);
    
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.scoreText.setText('🍎 Score: ' + this.score);
      this.lengthText.setText('🐍 Length: ' + this.snake.length);
      
      if (this.eatSound) {
        try {
          this.eatSound.play();
        } catch (e) {}
      }
      
      this.food = this.spawnFood();
      console.log('New apple at:', this.food);
      
      if (this.score % 50 === 0 && this.speed > 50) {
        this.speed = Math.max(50, this.speed - 10);
        this.moveTimer.delay = this.speed;
      }
    } else {
      this.snake.pop();
    }
    
    this.render();
  }

  spawnFood() {
    let foodPos;
    let validPosition = false;
    let attempts = 0;
    
    while (!validPosition && attempts < 100) {
      foodPos = {
        x: Phaser.Math.Between(0, this.gridWidth - 1),
        y: Phaser.Math.Between(4, this.gridHeight - 8)
      };
      
      validPosition = true;
      
      for (let segment of this.snake) {
        if (foodPos.x === segment.x && foodPos.y === segment.y) {
          validPosition = false;
          break;
        }
      }
      
      attempts++;
    }
    
    return foodPos;
  }

  render() {
    if (!this.graphics || !this.graphics.scene) {
      return;
    }
    
    this.graphics.clear();
    
    // Draw snake with gradient and improved quality
    this.snake.forEach((segment, index) => {
      const isHead = index === 0;
      const x = segment.x * this.gridSize + 2;
      const y = segment.y * this.gridSize + 2;
      const size = this.gridSize - 4;
      
      if (isHead) {
        // Head - bright green with glow
        this.graphics.fillStyle(0x00ff00, 1);
        this.graphics.lineStyle(4, 0xffffff, 0.9);
        this.graphics.fillRoundedRect(x, y, size, size, 6);
        this.graphics.strokeRoundedRect(x, y, size, size, 6);
        
        // Inner highlight
        this.graphics.fillStyle(0x66ff66, 0.5);
        this.graphics.fillRoundedRect(x + 4, y + 4, size - 8, size - 8, 4);
      } else {
        // Body - gradient effect
        const alpha = 1 - (index / this.snake.length) * 0.4;
        const color = index % 2 === 0 ? 0x00cc00 : 0x00aa00;
        this.graphics.fillStyle(color, alpha);
        this.graphics.lineStyle(2, 0x00ff00, 0.6);
        this.graphics.fillRoundedRect(x, y, size, size, 5);
        this.graphics.strokeRoundedRect(x, y, size, size, 5);
      }
      
      // Eyes on head
      if (isHead) {
        this.graphics.fillStyle(0xffffff, 1);
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        
        let eye1X, eye1Y, eye2X, eye2Y;
        
        if (this.direction === 'RIGHT') {
          eye1X = centerX + 6; eye1Y = centerY - 5;
          eye2X = centerX + 6; eye2Y = centerY + 5;
        } else if (this.direction === 'LEFT') {
          eye1X = centerX - 6; eye1Y = centerY - 5;
          eye2X = centerX - 6; eye2Y = centerY + 5;
        } else if (this.direction === 'UP') {
          eye1X = centerX - 5; eye1Y = centerY - 6;
          eye2X = centerX + 5; eye2Y = centerY - 6;
        } else {
          eye1X = centerX - 5; eye1Y = centerY + 6;
          eye2X = centerX + 5; eye2Y = centerY + 6;
        }
        
        this.graphics.fillCircle(eye1X, eye1Y, 4);
        this.graphics.fillCircle(eye2X, eye2Y, 4);
        
        this.graphics.fillStyle(0x000000, 1);
        this.graphics.fillCircle(eye1X, eye1Y, 2);
        this.graphics.fillCircle(eye2X, eye2Y, 2);
      }
    });
    
    // Draw apple with better quality
    this.graphics.fillStyle(0xff0000, 1);
    this.graphics.lineStyle(4, 0xaa0000, 1);
    
    const appleX = this.food.x * this.gridSize + this.gridSize / 2;
    const appleY = this.food.y * this.gridSize + this.gridSize / 2;
    const appleRadius = this.gridSize / 2 - 3;
    
    this.graphics.fillCircle(appleX, appleY, appleRadius);
    this.graphics.strokeCircle(appleX, appleY, appleRadius);
    
    // Highlight
    this.graphics.fillStyle(0xff6666, 0.8);
    this.graphics.fillCircle(appleX - 4, appleY - 4, 5);
    
    // Stem
    this.graphics.fillStyle(0x8b4513, 1);
    this.graphics.fillRect(appleX - 2, appleY - appleRadius - 5, 4, 7);
    
    // Leaf
    this.graphics.fillStyle(0x00aa00, 1);
    this.graphics.fillTriangle(
      appleX + 2, appleY - appleRadius - 4,
      appleX + 9, appleY - appleRadius - 7,
      appleX + 7, appleY - appleRadius
    );
  }

  gameOver() {
    if (this.gameIsOver) return;
    
    this.gameIsOver = true;
    
    if (this.moveTimer) {
      this.moveTimer.remove();
    }
    
    if (this.gameOverSound) {
      try {
        this.gameOverSound.play();
      } catch (e) {}
    }
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('snakeHighScore', this.score.toString());
    }
    
    saveScore(this.score, 'snake');
    
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    overlay.setDepth(10);
    
    const gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 80, 
      '☠️ GAME OVER ☠️', {
      fontSize: '64px',
      fill: '#ff0000',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(11);
    
    const finalScoreText = this.add.text(this.scale.width / 2, this.scale.height / 2, 
      '🍎 Final Score: ' + this.score, {
      fontSize: '36px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(11);
    
    const lengthText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 
      '🐍 Snake Length: ' + this.snake.length, {
      fontSize: '28px',
      fill: '#00ff00',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(11);
    
    const restartText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 110, 
      '🔄 Tap to Restart', {
      fontSize: '28px',
      fill: '#ffff00',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    
    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      scale: 0.95,
      duration: 700,
      yoyo: true,
      repeat: -1
    });
    
    this.input.once('pointerdown', () => {
      console.log('Restarting game...');
      this.scene.restart();
    });
  }
}
