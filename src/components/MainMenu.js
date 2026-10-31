const FONT_TITLE = { fontFamily: '"Press Start 2P", cursive', fontStyle: 'bold' };
const FONT_UI = { fontFamily: '"Press Start 2P", cursive' };

export class MainMenu extends Phaser.GameObjects.Container {
  constructor(scene, highScore, onStartGame, soundManager) {
    // KUNCI UTAMA: Container ditaruh tepat di tengah layar
    super(scene, scene.scale.width / 2, scene.scale.height / 2);
    this.scene = scene;
    this.soundManager = soundManager;
    this.isMuted = false;

    // Karena titik 0,0 container sekarang di tengah, kita pakai offset
    const w = scene.scale.width;
    const h = scene.scale.height;
    const centerX = 0; // 0 = tengah layar
    const centerY = 0; 

    // ==== BACKGROUND PARTIKEL ====
    this.particles = scene.add.particles(centerX, centerY, 'flare', {
      x: { min: -w/2, max: w/2 },
      y: { min: -h/2, max: h/2 },
      scale: { start: 0.1, end: 0.5 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 4000,
      speedY: { min: -20, max: -50 },
      speedX: { min: -10, max: 10 },
      quantity: 1,
      blendMode: 'ADD',
      tint: 0x8899ff
    });
    this.add(this.particles);

    // ==== JUDUL ====
    const titleText = scene.add.text(centerX, -150, 'MONSTER\nCARD CLASH', { 
      ...FONT_TITLE, fontSize: '48px', color: '#f0c040', align: 'center',
      shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 5, fill: true }
    }).setOrigin(0.5);
    this.add(titleText);

    titleText.setY(-200);
    scene.tweens.add({ targets: titleText, y: -150, duration: 1500, ease: 'Bounce.Out' });

    // ==== HIGH SCORE ====
    const hsText = scene.add.text(centerX, -30, `REKOR KOIN TERTINGGI: ${highScore}`, { 
      ...FONT_UI, fontSize: '14px', color: '#00ffcc' 
    }).setOrigin(0.5);
    this.add(hsText);

    // ==== TOMBOL MULAI ====
    this.createButton(centerX, 60, 300, 60, 0xf0c040, 'MULAI GAME', '#1a1a2e', () => {
      this.fadeOutAndStart(onStartGame);
    });

    // ==== TOMBOL CARA MAIN ====
    this.createButton(centerX, 140, 300, 50, 0x444444, 'CARA MAIN', '#ffffff', () => {
      this.showHowToPlay();
    });

    // ==== TOMBOL MUTE ====
    this.muteBtn = this.createButton(centerX, 210, 200, 40, 0x9933ff, 'MUTE SUARA', '#ffffff', () => {
      this.toggleMute();
    });

    // ==== FOOTER ====
    const footer = scene.add.text(centerX, h/2 - 30, 'Dibuat dengan Phaser', { 
      ...FONT_UI, fontSize: '8px', color: '#666666' 
    }).setOrigin(0.5);
    this.add(footer);

    scene.add.existing(this); // Pastiin masuk ke scene
  }

  createButton(x, y, width, height, color, text, textColor, onClick) {
    const btnBg = this.scene.add.rectangle(x, y, width, height, color).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xffffff);
    const btnTxt = this.scene.add.text(x, y, text, { ...FONT_UI, fontSize: '14px', color: textColor, fontStyle: 'bold' }).setOrigin(0.5);

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(Phaser.Display.Color.ValueToColor(color).brighten(30).color);
      this.scene.tweens.add({ targets: [btnBg, btnTxt], scale: 1.05, duration: 100 });
      if (this.soundManager) this.soundManager.play('hover');
    });

    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(color);
      this.scene.tweens.add({ targets: [btnBg, btnTxt], scale: 1, duration: 100 });
    });

    btnBg.on('pointerdown', () => {
      if (this.soundManager && !this.isMuted) this.soundManager.play('click');
      this.scene.tweens.add({ 
        targets: [btnBg, btnTxt], scale: 0.95, duration: 50, yoyo: true,
        onComplete: onClick 
      });
    });

    this.add([btnBg, btnTxt]);
    return { bg: btnBg, txt: btnTxt };
  }

  fadeOutAndStart(onStartGame) {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.destroy();
        onStartGame();
      }
    });
  }

  showHowToPlay() {
    const scene = this.scene;
    
    const overlay = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0.8).setInteractive();
    const panel = scene.add.rectangle(0, 0, 600, 400, 0x1a1a2e).setStrokeStyle(4, 0xf0c040);
    const title = scene.add.text(0, -150, 'CARA MAIN', { ...FONT_TITLE, fontSize: '24px', color: '#f0c040' }).setOrigin(0.5);
    
    const rules = [
      "1. Pilih 5 kartu dari kotak misteri (❓).",
      "2. Kartu punya ATK, HP, DEF, dan SPD.",
      "3. Kartu SPD tertinggi menyerang duluan.",
      "4. DEF mengurangi damage yang masuk.",
      "5. Punya elemen sama? Dapat Buff Combo!",
      "6. Kumpulkan koin & kalahkan musuh!"
    ];

    let texts = [];
    rules.forEach((rule, i) => {
      const txt = scene.add.text(-250, -90 + (i * 30), rule, { ...FONT_UI, fontSize: '10px', color: '#ffffff' }).setOrigin(0, 0.5);
      texts.push(txt);
    });

    const closeBtn = scene.add.rectangle(0, 150, 150, 40, 0xff4444).setInteractive({ useHandCursor: true });
    const closeTxt = scene.add.text(0, 150, 'TUTUP', { ...FONT_UI, fontSize: '12px', color: '#ffffff' }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => {
      overlay.destroy(); panel.destroy(); title.destroy(); closeBtn.destroy(); closeTxt.destroy();
      texts.forEach(t => t.destroy());
    });

    this.add([overlay, panel, title, closeBtn, closeTxt, ...texts]);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.soundManager) {
      if (this.isMuted) {
        if (this.soundManager.audioCtx) this.soundManager.audioCtx.suspend();
        this.muteBtn.txt.setText('UNMUTE');
        this.muteBtn.bg.setFillStyle(0x444444);
      } else {
        if (this.soundManager.audioCtx) this.soundManager.audioCtx.resume();
        this.muteBtn.txt.setText('MUTE SUARA');
        this.muteBtn.bg.setFillStyle(0x9933ff);
        this.soundManager.play('click');
      }
    }
  }
}