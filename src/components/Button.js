const FONT_UI = { fontFamily: '"Press Start 2P", cursive' };

export class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, color, text, onClick, soundManager) {
    super(scene, x, y);
    
    this.bg = scene.add.rectangle(0, 0, width, height, color)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(3, 0xffffff);
      
    this.txt = scene.add.text(0, 0, text, { 
      ...FONT_UI, fontSize: '14px', color: '#ffffff', fontStyle: 'bold' 
    }).setOrigin(0.5);

    this.add([this.bg, this.txt]);
    scene.add.existing(this);

    // Events
    this.bg.on('pointerover', () => {
      this.bg.setFillStyle(Phaser.Display.Color.ValueToColor(color).brighten(20).color);
      scene.tweens.add({ targets: this, scale: 1.05, duration: 100 });
      if(soundManager) soundManager.play('hover');
    });

    this.bg.on('pointerout', () => {
      this.bg.setFillStyle(color);
      scene.tweens.add({ targets: this, scale: 1, duration: 100 });
    });

    this.bg.on('pointerdown', () => {
      if(soundManager) soundManager.play('click');
      scene.tweens.add({ 
        targets: this, scale: 0.95, duration: 50, yoyo: true,
        onComplete: () => onClick()
      });
    });
  }
}