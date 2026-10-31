import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0f0c29',
  scale: {
    mode: Phaser.Scale.RESIZE, // Otomatis nyesuaiin layar
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%'
  },
  scene: [MainScene]
};

new Phaser.Game(config);