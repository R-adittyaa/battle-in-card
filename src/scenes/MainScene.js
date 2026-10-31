import Phaser from 'phaser';
import { SoundManager } from '../utils/Sound.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { calculateBattle } from '../utils/BattleEngine.js';

// ==== DATA KARTU BARU (PANTHEON & BEAST) ====
// Pastiin nama file 'img' sama persis dengan nama file di folder public/cards/
const CARD_POOL = [
  // DEWA (PANTHEON)
  { id: 'zeus',     name: 'Zeus',        img: 'zeus',     element: '⚡', atk: 45, hp: 80,  def: 10, spd: 20, rarity: 'Legendary', color: 0xffd700 },
  { id: 'poseidon', name: 'Poseidon',    img: 'poseidon', element: '🌊', atk: 35, hp: 100, def: 20, spd: 10, rarity: 'Legendary', color: 0x00bfff },
  { id: 'hades',    name: 'Hades',       img: 'hades',    element: '💀', atk: 50, hp: 70,  def: 15, spd: 15, rarity: 'Legendary', color: 0x800080 },
  { id: 'amaterasu',name: 'Amaterasu',   img: 'amaterasu',element: '🌞', atk: 40, hp: 75,  def: 15, spd: 25, rarity: 'Rare',      color: 0xff4500 },
  
  // BEAST (HEWAN MITOS)
  { id: 'fenrir',   name: 'Fenrir',      img: 'fenrir',   element: '❄️', atk: 40, hp: 85,  def: 10, spd: 30, rarity: 'Legendary', color: 0x87ceeb },
  { id: 'phoenix',  name: 'Phoenix',     img: 'phoenix',  element: '🔥', atk: 35, hp: 60,  def: 5,  spd: 35, rarity: 'Rare',      color: 0xff6347 },
  { id: 'leviathan',name: 'Leviathan',   img: 'leviathan',element: '🌊', atk: 30, hp: 110, def: 25, spd: 5,  rarity: 'Rare',      color: 0x4682b4 },
  { id: 'griffin',  name: 'Griffin',     img: 'griffin',  element: '🌪️', atk: 25, hp: 70,  def: 15, spd: 25, rarity: 'Rare',      color: 0xf5deb3 },
  { id: 'cerberus', name: 'Cerberus',    img: 'cerberus', element: '💀', atk: 30, hp: 80,  def: 10, spd: 20, rarity: 'Common',    color: 0x8b0000 },
  { id: 'chimera',  name: 'Chimera',     img: 'chimera',  element: '🔥', atk: 35, hp: 75,  def: 15, spd: 15, rarity: 'Common',    color: 0xdaa520 },
  
  // ZONK (Tetep ada buat kejutan)
  { id: 'bom',      name: 'Bom Zonk',    img: 'bom',      element: '💣', atk: 0,  hp: 1,   def: 0,  spd: 1,  rarity: 'Zonk',      color: 0xff0000 }
];

const GACHA_EFFECTS = [
  { name: 'Buff ATK', desc: 'ATK +10', type: 'buff' },
  { name: 'Kutukan', desc: 'ATK -10', type: 'nerf' },
  { name: 'Zonk', desc: '-10 Koin', type: 'zonk' },
  { name: 'Keberuntungan', desc: '+15 Koin', type: 'luck' }
];

const DECK_SIZE = 5;
const CHOICES_PER_DRAFT = 4;
const FONT_TITLE = { fontFamily: '"Press Start 2P", cursive', fontStyle: 'bold' };
const FONT_UI = { fontFamily: '"Press Start 2P", cursive' };

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.state = {
      playerCoins: 100, computerCoins: 100, phase: 'idle', turn: null, 
      draftRound: 1, playerDeck: [], computerDeck: [], nextCardAtkModifier: 0,
      activeSynergies: []
    };
    this.uiObjects = []; 
  }

    // ==== PRELOAD: LOAD GAMBAR DARI FOLDER PUBLIC ====
  preload() {
    // Load semua gambar kartu (tanpa teks loading)
    CARD_POOL.forEach(card => {
      // Ubah jadi .jpg kalau file lo JPG, biarin .png kalau file lo PNG
      this.load.image(card.img, `/cards/${card.img}.jpg`); 
    });
  }

  create() {
    this.sound = new SoundManager();
    this.buildUI();
  }

  buildUI() {
    const w = this.scale.width, h = this.scale.height;
    this.add.text(w / 2, h * 0.15, 'MONSTER CARD CLASH', { ...FONT_TITLE, fontSize: '32px', color: '#f0c040' }).setOrigin(0.5);
    this.statusText = this.add.text(w / 2, h * 0.25, 'Selamat datang, Penyihir!', { ...FONT_UI, fontSize: '14px', color: '#ffffff', align: 'center' }).setOrigin(0.5);

    this.playerCoinText = this.add.text(w * 0.2, h * 0.35, 'KAMU: 100', { ...FONT_UI, fontSize: '14px', color: '#00ffcc' }).setOrigin(0.5).setVisible(false); 
    this.compCoinText = this.add.text(w * 0.8, h * 0.35, 'MUSUH: 100', { ...FONT_UI, fontSize: '14px', color: '#ff6666' }).setOrigin(0.5).setVisible(false); 

    this.deckText = this.add.text(w / 2, h - 40, '', { ...FONT_UI, fontSize: '12px', color: '#aaaaaa', align: 'center' }).setOrigin(0.5);

    const startBtn = new Button(this, w / 2, h / 2, 300, 70, 0xf0c040, 'MULAI GAME', () => {
      startBtn.destroy();
      this.mulaiAcakan();
    }, this.sound);
    this.uiObjects.push(startBtn);
  }

  // ... (Sisa kode logika di bawahnya SAMA PERSIS kayak yang terakhir, nggak ada yang berubah) ...
  // Gw potong biar ga kepanjangan, lo tinggal copy dari sini ke bawah aja.

  efekLayarKedip(warna, durasi = 300) {
    const w = this.scale.width, h = this.scale.height;
    const overlay = this.add.rectangle(w/2, h/2, w, h, warna, 0.3).setDepth(100);
    this.tweens.add({ targets: overlay, alpha: 0, duration: durasi, onComplete: () => overlay.destroy() });
  }

  mulaiAcakan() {
    this.bersihkanUI();
    this.statusText.setText('Mengacak siapa yang mulai duluan...');
    this.time.delayedCall(1000, () => {
      this.state.turn = Math.random() < 0.5 ? 'player' : 'computer';
      this.statusText.setText(this.state.turn === 'player' ? 'KAMU DULUAN!' : 'MUSUH DULUAN!');
      this.state.draftRound = 1;
      this.state.phase = 'draft';
      this.time.delayedCall(1000, () => this.jalankanGiliran());
    });
  }

  jalankanGiliran() {
    if (this.state.phase !== 'draft') return;
    if (this.cekDraftSelesai()) return;
    this.bersihkanUI();

    const pCount = this.state.playerDeck.length;
    const cCount = this.state.computerDeck.length;
    this.state.draftRound = Math.max(pCount, cCount) + 1;

    if (this.state.turn === 'player') {
      if (pCount >= 1) this.tampilkanOpsiGacha();
      else this.giliranPemainDraft(); 
    } else {
      this.giliranKomputer();
    }
  }

  cekDraftSelesai() {
    if (this.state.playerDeck.length >= DECK_SIZE && this.state.computerDeck.length >= DECK_SIZE) {
      this.state.phase = 'battle';
      this.bersihkanUI();
      this.statusText.setText('DRAFT SELESAI!\nBersiap untuk 1v1...');
      this.time.delayedCall(1500, () => this.mulaiFaseBattle());
      return true;
    }
    return false;
  }

  tampilkanOpsiGacha() {
    this.statusText.setText(`BABAK ${this.state.draftRound}\nMau gacha skill?`);
    const w = this.scale.width, h = this.scale.height;

    const gachaBtn = new Button(this, w / 2 - 130, h / 2, 220, 60, 0x9933ff, 'GACHA ❓', () => {
      this.bersihkanUI(); this.prosesGacha();
    }, this.sound);

    const skipBtn = new Button(this, w / 2 + 130, h / 2, 220, 60, 0x444444, 'LEWATI', () => {
      this.bersihkanUI(); this.giliranPemainDraft();
    }, this.sound);

    this.uiObjects.push(gachaBtn, skipBtn);
  }

  prosesGacha() {
    this.statusText.setText('Membuka kotak...');
    this.sound.play('reveal');
    this.time.delayedCall(1000, () => {
      const effect = Phaser.Utils.Array.GetRandom(GACHA_EFFECTS);
      if (effect.type === 'buff') this.state.nextCardAtkModifier = 10;
      if (effect.type === 'nerf') this.state.nextCardAtkModifier = -10;
      if (effect.type === 'zonk') this.state.playerCoins -= 10;
      if (effect.type === 'luck') this.state.playerCoins += 15;
      this.updateCoinUI();
      this.statusText.setText(`DAPAT:\n${effect.name}\n(${effect.desc})`);
      this.time.delayedCall(2000, () => this.giliranPemainDraft());
    });
  }

  giliranPemainDraft() {
    if (this.state.playerDeck.length >= DECK_SIZE) {
      this.state.turn = 'computer';
      this.time.delayedCall(800, () => this.jalankanGiliran());
      return;
    }
    this.statusText.setText(`BABAK ${this.state.draftRound}\nPilih 1 Kartu!`);
    const choices = Phaser.Utils.Array.Shuffle([...CARD_POOL]).slice(0, CHOICES_PER_DRAFT);
    const w = this.scale.width, h = this.scale.height;
    const startX = (w / 2) - ((CHOICES_PER_DRAFT - 1) * 180) / 2;
    
    choices.forEach((card, i) => {
      const cardUI = new Card(this, startX + i * 180, h / 2 + 20, card, true, (selectedCard) => {
        this.pemainPilihKartu(selectedCard);
      }, this.sound);
      this.uiObjects.push(cardUI);
    });
  }

  pemainPilihKartu(card) {
    let finalAtk = Math.max(0, card.atk + this.state.nextCardAtkModifier);
    this.state.playerDeck.push({ ...card, atk: finalAtk });
    this.state.nextCardAtkModifier = 0; 
    this.bersihkanUI();
    this.updateDeckUI();
    this.cekSynergy();
    if (this.cekDraftSelesai()) return;
    this.state.turn = 'computer';
    this.time.delayedCall(800, () => this.jalankanGiliran());
  }

  cekSynergy() {
    const elements = this.state.playerDeck.map(c => c.element);
    const counts = {};
    elements.forEach(el => counts[el] = (counts[el] || 0) + 1);

    for (let el in counts) {
      if (counts[el] >= 2 && !this.state.activeSynergies.includes(el)) {
        this.state.activeSynergies.push(el);
        this.state.playerDeck.forEach(c => { if (c.element === el) c.atk += 10; });
        this.statusText.setText(`COMBO ${el}!\nElemen ${el} dapat +10 ATK!`);
        this.sound.play('win');
        this.efekLayarKedip(0xffff00); 
      }
    }
  }

  giliranKomputer() {
    if (this.state.computerDeck.length >= DECK_SIZE) {
      this.state.turn = 'player';
      this.time.delayedCall(800, () => this.jalankanGiliran());
      return;
    }
    this.statusText.setText('Musuh memilih...');
    this.time.delayedCall(1000, () => {
      const choices = Phaser.Utils.Array.Shuffle([...CARD_POOL]).slice(0, CHOICES_PER_DRAFT);
      const card = Phaser.Utils.Array.GetRandom(choices);
      this.state.computerDeck.push({ ...card });
      this.updateDeckUI();
      if (this.cekDraftSelesai()) return;
      this.state.turn = 'player';
      this.time.delayedCall(800, () => this.jalankanGiliran());
    });
  }

  mulaiFaseBattle() {
    this.bersihkanUI();
    if (this.state.playerDeck.length === 0) {
      if (this.state.playerCoins > this.state.computerCoins) this.gameOver(true, 'KOIN KAMU LEBIH BANYAK!');
      else this.gameOver(false, 'KOIN MUSUH LEBIH BANYAK!');
      return;
    }
    this.statusText.setText('PILIH KARTU UNTUK BERTARUNG!');
    this.playerCoinText.setVisible(true);
    this.compCoinText.setVisible(true);

    const w = this.scale.width, h = this.scale.height;
    const startX = (w / 2) - ((this.state.playerDeck.length - 1) * 160) / 2;
    
    this.state.playerDeck.forEach((card, i) => {
      const cardUI = new Card(this, startX + i * 160, h / 2 + 40, card, false, (selectedCard) => {
        this.pemainBattle(selectedCard, i);
      }, this.sound);
      this.uiObjects.push(cardUI);
    });
  }

  pemainBattle(cardPemain, indexPemain) {
    this.bersihkanUI();
    const indexKomputer = Phaser.Math.Between(0, this.state.computerDeck.length - 1);
    const cardKomputer = this.state.computerDeck[indexKomputer];

    this.state.playerDeck.splice(indexPemain, 1);
    this.state.computerDeck.splice(indexKomputer, 1);
    this.updateDeckUI();

    this.statusText.setText(`ADU!\n${cardPemain.name} VS ${cardKomputer.name}`);

    const result = calculateBattle(cardPemain, cardKomputer);
    console.log(result.log);

    this.time.delayedCall(1500, () => {
      if (result.winner === 'p1') {
        this.statusText.setText('KAMU MENANG!\n(+20 Koin)');
        this.state.playerCoins += 20; this.state.computerCoins -= 20;
        this.sound.play('win'); this.efekLayarKedip(0x00ffcc); 
      } else if (result.winner === 'p2') {
        this.statusText.setText('KAMU KALAH!\n(-20 Koin)');
        this.state.playerCoins -= 20; this.state.computerCoins += 20;
        this.sound.play('lose'); this.cameras.main.shake(300, 0.01); this.efekLayarKedip(0xff4444); 
      } else { 
        this.statusText.setText('SERI!'); 
      }
      
      this.updateCoinUI();
      this.time.delayedCall(2000, () => {
        if (this.state.playerCoins <= 0) this.gameOver(false, 'KOIN HABIS!'); 
        else if (this.state.computerCoins <= 0) this.gameOver(true, 'MUSUH BANGKRUT!'); 
        else if (this.state.playerDeck.length === 0) {
          if (this.state.playerCoins > this.state.computerCoins) this.gameOver(true, 'KOIN KAMU LEBIH BANYAK!');
          else if (this.state.playerCoins < this.state.computerCoins) this.gameOver(false, 'KOIN MUSUH LEBIH BANYAK!');
          else this.gameOver(false, 'SERI! Kamu dianggap KALAH.');
        } else { this.mulaiFaseBattle(); }
      });
    });
  }

  updateCoinUI() {
    this.playerCoinText.setText(`KAMU: ${this.state.playerCoins}`);
    this.compCoinText.setText(`MUSUH: ${this.state.computerCoins}`);
  }

  updateDeckUI() {
    const compHidden = '❓'.repeat(this.state.computerDeck.length);
    this.deckText.setText(`DECK KAMU: ${this.state.playerDeck.length} | DECK MUSUH: ${compHidden}`);
  }

  bersihkanUI() {
    this.uiObjects.forEach(obj => obj.destroy());
    this.uiObjects = [];
  }

  gameOver(isWin, alasan) {
    this.bersihkanUI();
    this.playerCoinText.setVisible(false);
    this.compCoinText.setVisible(false);
    this.deckText.setVisible(false); 
    this.statusText.setText('');

    this.sound.play(isWin ? 'win' : 'lose');
    const w = this.scale.width, h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0).setDepth(10);
    this.tweens.add({ targets: overlay, fillAlpha: 0.9, duration: 500 });
    
    const warnaUtama = isWin ? '#00ffcc' : '#ff4444';
    const panel = this.add.rectangle(w / 2, h / 2, 600, 350, 0x1a1a2e, 0).setStrokeStyle(6, isWin ? 0x00ffcc : 0xff4444).setDepth(11);
    const titleText = this.add.text(w / 2, h / 2 - 70, isWin ? 'KEMENANGAN!' : 'GAME OVER', { ...FONT_TITLE, fontSize: '32px', color: warnaUtama }).setOrigin(0.5).setDepth(12).setAlpha(0);
    const reasonText = this.add.text(w / 2, h / 2 + 10, alasan, { ...FONT_UI, fontSize: '16px', color: '#eeeeee', align: 'center' }).setOrigin(0.5).setDepth(12).setAlpha(0);
    const statsText = this.add.text(w / 2, h / 2 + 60, `KAMU: ${this.state.playerCoins}  |  MUSUH: ${this.state.computerCoins}`, { ...FONT_UI, fontSize: '14px', color: '#f0c040' }).setOrigin(0.5).setDepth(12).setAlpha(0);

    const restartBtn = new Button(this, w / 2, h / 2 + 140, 240, 60, isWin ? 0x00ffcc : 0xff4444, 'MAIN LAGI', () => {
      this.scene.restart();
    }, this.sound);
    restartBtn.setDepth(12).setAlpha(0);

    this.tweens.add({ targets: panel, fillAlpha: 1, duration: 500 });
    this.tweens.add({ targets: [titleText, reasonText, statsText, restartBtn], alpha: 1, duration: 800, delay: 400 });
  }
}