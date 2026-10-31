const FONT_TITLE = { fontFamily: '"Press Start 2P", cursive', fontStyle: 'bold' };
const FONT_UI = { fontFamily: '"Press Start 2P", cursive' };

export class Card extends Phaser.GameObjects.Container {
  constructor(scene, x, y, cardData, isHidden, onClick, soundManager) {
    super(scene, x, y);
    
    this.cardData = cardData;
    this.isHidden = isHidden;
    this.scene = scene;
    this.soundManager = soundManager;

    // Base Kartu
    this.bg = scene.add.rectangle(0, 0, 160, 230, 0x1a1a2e);
    
    // Garis tepi
    this.border = scene.add.rectangle(0, 0, 160, 230).setStrokeStyle(4, 0xf0c040);
    
    this.add([this.bg, this.border]);

    if (this.isHidden) {
      this.tanya = scene.add.text(0, 0, '❓', { ...FONT_TITLE, fontSize: '50px', color: '#ffffff' }).setOrigin(0.5);
      this.add(this.tanya);
    } else {
      this.buildFace(cardData, onClick);
    }

    scene.add.existing(this);

    // Interaksi (Hover)
    this.bg.setInteractive({ useHandCursor: true });
    
    this.bg.on('pointerover', () => {
      this.border.setStrokeStyle(6, this.isHidden ? 0xffd966 : 0xffffff);
      scene.tweens.add({ targets: this, y: y - 20, scale: 1.05, duration: 150 });
      if(soundManager) soundManager.play('hover');
    });

    this.bg.on('pointerout', () => {
      this.border.setStrokeStyle(4, this.isHidden ? 0xf0c040 : 0x00ffcc);
      scene.tweens.add({ targets: this, y: y, scale: 1, duration: 150 });
    });

    // Klik interaksi (Cuma buat kartu tertutup di fase draft)
    if (this.isHidden) {
      this.bg.on('pointerdown', () => {
        this.bg.disableInteractive();
        if(soundManager) soundManager.play('click');
        this.flipAndReveal(onClick);
      });
    }
  }

  buildFace(data, onClick) {
    const warnaStroke = data.rarity === 'Legendary' ? 0xffaa00 : (data.rarity === 'Zonk' ? 0xff0000 : 0x00ffcc);
    this.border.setStrokeStyle(4, warnaStroke);

    // 1. Gambar Full Art
    const gambarKartu = this.scene.add.image(0, 0, data.img).setDisplaySize(160, 230);
    
    // 2. Panel Bawah
    const panelBawah = this.scene.add.rectangle(0, 70, 160, 90, 0x000000, 0.85);
    
    // 3. Ikon Elemen
    const elemenBg = this.scene.add.circle(-65, -95, 18, 0x000000, 0.8).setStrokeStyle(2, 0xffffff);
    const elemenText = this.scene.add.text(-65, -95, data.element, { fontSize: '18px' }).setOrigin(0.5);

    // 4. Nama & Stats
    const nama = this.scene.add.text(0, 35, data.name, { ...FONT_UI, fontSize: '10px', color: '#ffffff' }).setOrigin(0.5);
    
    const statsY = 75;
    const statW = 32, gap = 5;
    const startX = -((statW * 4) + (gap * 3)) / 2 + (statW / 2);
    
        // Ubah angkanya biar ada inisial di atasnya
    const stats = [
      { val: data.atk, color: '#ff6666', label: 'ATK' },
      { val: data.hp,  color: '#00ffcc', label: 'HP' },
      { val: data.def, color: '#3399ff', label: 'DEF' },
      { val: data.spd, color: '#ffcc00', label: 'SPD' }
    ];

    const statTexts = [];
    stats.forEach((s, i) => {
      const xPos = startX + i * (statW + gap);
      // Label kecil di atas
      const labelText = this.scene.add.text(xPos, statsY - 8, s.label, { ...FONT_UI, fontSize: '6px', color: '#aaaaaa' }).setOrigin(0.5);
      // Angka utama
      const valText = this.scene.add.text(xPos, statsY + 4, s.val, { ...FONT_UI, fontSize: '9px', color: s.color, fontStyle: 'bold' }).setOrigin(0.5);
      statTexts.push(labelText, valText);
    });

    this.add([gambarKartu, panelBawah, elemenBg, elemenText, nama, ...statTexts]);
    
    // 5. Tombol PILIH (Cuma muncul di fase battle)
    if (!this.isHidden && onClick) {
      this.selectBtn = this.scene.add.rectangle(0, 110, 140, 25, 0x00ffcc, 0.9).setInteractive({ useHandCursor: true });
      this.selectTxt = this.scene.add.text(0, 110, 'PILIH', { ...FONT_UI, fontSize: '10px', color: '#000000', fontStyle: 'bold' }).setOrigin(0.5);
      
      this.selectBtn.on('pointerover', () => this.selectBtn.setFillStyle(0xffffff));
      this.selectBtn.on('pointerout', () => this.selectBtn.setFillStyle(0x00ffcc));
      
      this.selectBtn.on('pointerdown', () => {
        this.selectBtn.disableInteractive();
        if(this.soundManager) this.soundManager.play('click');
        this.scene.tweens.add({
          targets: this,
          scale: 1.5, alpha: 0,
          duration: 300,
          onComplete: () => onClick(this.cardData)
        });
      });

      this.add([this.selectBtn, this.selectTxt]);
    }
  }

  flipAndReveal(onClick) {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      duration: 150,
      yoyo: true,
      onYoyo: () => {
        this.tanya.destroy();
        if(this.soundManager) this.soundManager.play('reveal');
        this.buildFace(this.cardData, null);
      },
      onComplete: () => {
        this.scene.time.delayedCall(600, () => onClick(this.cardData));
      }
    });
  }

  // ==== FUNGSI BARU BUAT EFEK HANCUR PAS KALAH ====
    hancurkan() {
    // Sembunyiin kartu asli
    this.setVisible(false);

    // Bikin 4 potongan kotak yang berhamburan
    for (let i = 0; i < 4; i++) {
      const piece = this.scene.add.rectangle(this.x, this.y, 80, 115, 0x1a1a2e).setStrokeStyle(2, 0xff4444);
      // Kasih efek meledak ke arah acak
      this.scene.tweens.add({
        targets: piece,
        x: this.x + Phaser.Math.Between(-200, 200),
        y: this.y + Phaser.Math.Between(-200, 200),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => piece.destroy()
      });
    }
    this.destroy();
  }
}