import Phaser from 'phaser';
import { SoundManager } from '../utils/Sound.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { calculateBattle } from '../utils/BattleEngine.js';
import { buatLedakan } from '../components/Particle.js';
import { MainMenu } from '../components/MainMenu.js';

const CARD_POOL = [
  { id: 'zeus',     name: 'Zeus',        img: 'zeus',     element: '⚡', atk: 45, hp: 80,  def: 10, spd: 20, rarity: 'Legendary', color: 0xffd700 },
  { id: 'poseidon', name: 'Poseidon',    img: 'poseidon', element: '🌊', atk: 35, hp: 100, def: 20, spd: 10, rarity: 'Legendary', color: 0x00bfff },
  { id: 'hades',    name: 'Hades',       img: 'hades',    element: '💀', atk: 50, hp: 70,  def: 15, spd: 15, rarity: 'Legendary', color: 0x800080 },
  { id: 'amaterasu',name: 'Amaterasu',   img: 'amaterasu',element: '🌞', atk: 40, hp: 75,  def: 15, spd: 25, rarity: 'Rare',      color: 0xff4500 },
  { id: 'fenrir',   name: 'Fenrir',      img: 'fenrir',   element: '❄️', atk: 40, hp: 85,  def: 10, spd: 30, rarity: 'Legendary', color: 0x87ceeb },
  { id: 'phoenix',  name: 'Phoenix',     img: 'phoenix',  element: '🔥', atk: 35, hp: 60,  def: 5,  spd: 35, rarity: 'Rare',      color: 0xff6347 },
  { id: 'leviathan',name: 'Leviathan',   img: 'leviathan',element: '🌊', atk: 30, hp: 110, def: 25, spd: 5,  rarity: 'Rare',      color: 0x4682b4 },
  { id: 'griffin',  name: 'Griffin',     img: 'griffin',  element: '🌪️', atk: 25, hp: 70,  def: 15, spd: 25, rarity: 'Rare',      color: 0xf5deb3 },
  { id: 'cerberus', name: 'Cerberus',    img: 'cerberus', element: '💀', atk: 30, hp: 80,  def: 10, spd: 20, rarity: 'Common',    color: 0x8b0000 },
  { id: 'chimera',  name: 'Chimera',     img: 'chimera',  element: '🔥', atk: 35, hp: 75,  def: 15, spd: 15, rarity: 'Common',    color: 0xdaa520 },
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
      activeSynergies: [], battleRound: 1, highScore: 0
    };
    this.uiObjects = []; 
  }

  preload() {
    CARD_POOL.forEach(card => {
      this.load.image(card.img, `/cards/${card.img}.jpg`); 
    });

    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4); 
    g.generateTexture('flare', 8, 8);
    g.destroy(); 
  }

   create() {
    console.log("Scene Create berjalan!");
    this.sound = new SoundManager();
    this.state.highScore = parseInt(localStorage.getItem('monsterHighScore')) || 100;

    console.log("Manggil MainMenu...");
    this.mainMenu = new MainMenu(this, this.state.highScore, () => {
      this.startGame();
    }, this.sound);

    console.log("MainMenu berhasil dibuat!");
    this.uiObjects.push(this.mainMenu);
  }

  startGame() {
    const w = this.scale.width, h = this.scale.height;
    
    this.statusText = this.add.text(w / 2, h * 0.15, 'Selamat datang, Penyihir!', { ...FONT_UI, fontSize: '14px', color: '#ffffff', align: 'center' }).setOrigin(0.5);

    this.playerCoinText = this.add.text(w * 0.2, h * 0.35, `KAMU: ${this.state.playerCoins}`, { ...FONT_UI, fontSize: '14px', color: '#00ffcc' }).setOrigin(0.5).setVisible(false); 
    this.compCoinText = this.add.text(w * 0.8, h * 0.35, `MUSUH: ${this.state.computerCoins}`, { ...FONT_UI, fontSize: '14px', color: '#ff6666' }).setOrigin(0.5).setVisible(false); 

    this.deckText = this.add.text(w / 2, h - 40, '', { ...FONT_UI, fontSize: '12px', color: '#aaaaaa', align: 'center' }).setOrigin(0.5);

    this.mulaiAcakan();
  }

  efekLayarKedip(warna, durasi = 300) {
    const w = this.scale.width, h = this.scale.height;
    const overlay = this.add.rectangle(w/2, h/2, w, h, warna, 0.3).setDepth(100);
    this.tweens.add({ targets: overlay, alpha: 0, duration: durasi, onComplete: () => overlay.destroy() });
  }

  tampilkanDamage(x, y, text, warna, isBlocked = false) {
    const dmgText = this.add.text(x, y, text, { ...FONT_TITLE, fontSize: isBlocked ? '14px' : '24px', color: warna }).setOrigin(0.5).setDepth(200);
    this.tweens.add({
      targets: dmgText, y: y - 80, alpha: 0, scale: 1.5, duration: 800, ease: 'Power2',
      onComplete: () => dmgText.destroy()
    });
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
      this.state.battleRound = 1;
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
    
    if (this.state.battleRound > 5) {
      if (this.state.playerCoins > this.state.computerCoins) this.gameOver(true, 'KOIN KAMU LEBIH BANYAK!');
      else this.gameOver(false, 'KOIN MUSUH LEBIH BANYAK!');
      return;
    }

    this.statusText.setText(`RONDE ${this.state.battleRound} : PILIH KARTU!`);
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
    this.statusText.setText(`PERTARUNGAN DIMULAI!`).setY(this.scale.height * 0.1);

    const indexKomputer = Phaser.Math.Between(0, this.state.computerDeck.length - 1);
    const cardKomputer = this.state.computerDeck[indexKomputer];

    this.state.playerDeck.splice(indexPemain, 1);
    this.state.computerDeck.splice(indexKomputer, 1);
    this.state.battleRound++;
    this.updateDeckUI();

    const w = this.scale.width, h = this.scale.height;
    this.playerCoinText.setVisible(false);
    this.compCoinText.setVisible(false);

    const targetP1X = w / 2 - 120;
    const targetP2X = w / 2 + 120;
    const targetY = h / 2;

    const p1UI = new Card(this, -200, targetY, cardPemain, false, null, this.sound);
    const p2UI = new Card(this, w + 200, targetY, cardKomputer, false, null, this.sound);
    this.uiObjects.push(p1UI, p2UI);

    const hpBarWidth = 140;
    
    const hpBarP1Bg = this.add.rectangle(targetP1X, targetY - 140, hpBarWidth, 10, 0x333333).setDepth(50);
    const hpBarP1 = this.add.rectangle(targetP1X - hpBarWidth/2, targetY - 140, hpBarWidth, 10, 0x00ff00).setOrigin(0, 0.5).setDepth(51);
    const infoP1 = this.add.text(targetP1X, targetY - 160, `DEF: ${cardPemain.def} | SPD: ${cardPemain.spd}`, { ...FONT_UI, fontSize: '8px', color: '#aaaaaa' }).setOrigin(0.5).setDepth(51);
    
    const hpBarP2Bg = this.add.rectangle(targetP2X, targetY - 140, hpBarWidth, 10, 0x333333).setDepth(50);
    const hpBarP2 = this.add.rectangle(targetP2X - hpBarWidth/2, targetY - 140, hpBarWidth, 10, 0x00ff00).setOrigin(0, 0.5).setDepth(51);
    const infoP2 = this.add.text(targetP2X, targetY - 160, `DEF: ${cardKomputer.def} | SPD: ${cardKomputer.spd}`, { ...FONT_UI, fontSize: '8px', color: '#aaaaaa' }).setOrigin(0.5).setDepth(51);

    this.uiObjects.push(hpBarP1Bg, hpBarP1, infoP1, hpBarP2Bg, hpBarP2, infoP2);

    this.tweens.add({ targets: p1UI, x: targetP1X, duration: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: p2UI, x: targetP2X, duration: 500, ease: 'Back.easeOut' });

    this.time.delayedCall(600, () => {
      const result = calculateBattle(cardPemain, cardKomputer);
      
      let delay = 0;
      result.log.forEach((step) => {
        if (step.type === 'info') {
          this.time.delayedCall(delay, () => this.statusText.setText(step.text));
          delay += 800;
        } else if (step.type === 'attack') {
          this.time.delayedCall(delay, () => {
            const attackerUI = step.attacker === 'p1' ? p1UI : p2UI;
            const defenderUI = step.defender === 'p1' ? p1UI : p2UI;
            
            const originalX = step.attacker === 'p1' ? targetP1X : targetP2X;
            const targetX = step.attacker === 'p1' ? originalX + 40 : originalX - 40;

            if (step.isFirstStrike && cardPemain.spd !== cardKomputer.spd) {
              const speedLine = this.add.line(0, 0, attackerUI.x, attackerUI.y, targetX, attackerUI.y, 0xffffff, 0.8).setDepth(40);
              this.tweens.add({ targets: speedLine, alpha: 0, duration: 300, onComplete: () => speedLine.destroy() });
            }

            this.tweens.add({
              targets: attackerUI, x: targetX, yoyo: true, duration: 150,
              onYoyo: () => {
                this.sound.play('click');
                this.cameras.main.shake(200, 0.02); 
                
                const dmgX = step.defender === 'p1' ? targetP1X : targetP2X;
                const dmgY = targetY - 50;
                
                if (step.isBlocked) {
                  this.tampilkanDamage(dmgX, dmgY, `BLOCK (-${step.damage})`, '#3399ff', true);
                  const shield = this.add.arc(dmgX, dmgY, 40, 0, 360, false, 0x3399ff, 0.3).setDepth(60);
                  this.tweens.add({ targets: shield, scale: 1.5, alpha: 0, duration: 500, onComplete: () => shield.destroy() });
                } else {
                  this.tampilkanDamage(dmgX, dmgY, `-${step.damage}`, '#ff4444');
                  buatLedakan(this, dmgX, dmgY, 0xff4444); 
                }

                if (step.defender === 'p1') {
                  hpBarP1.width = hpBarWidth * (step.p1Hp / cardPemain.hp);
                } else {
                  hpBarP2.width = hpBarWidth * (step.p2Hp / cardKomputer.hp);
                }
              }
            });
          });
          delay += 1200;
        }
      });

      this.time.delayedCall(delay, () => {
        if (result.winner === 'p1') {
          p2UI.hancurkan(); 
          this.statusText.setText('KAMU MENANG!\n(+20 Koin)');
          this.state.playerCoins += 20; this.state.computerCoins -= 20;
          this.sound.play('win'); this.efekLayarKedip(0x00ffcc); 
        } else if (result.winner === 'p2') {
          p1UI.hancurkan(); 
          this.statusText.setText('KAMU KALAH!\n(-20 Koin)');
          this.state.playerCoins -= 20; this.state.computerCoins += 20;
          this.sound.play('lose'); this.efekLayarKedip(0xff4444); 
        } else { 
          this.statusText.setText('SERI!'); 
          p1UI.hancurkan(); p2UI.hancurkan();
        }
        
        this.playerCoinText.setVisible(true);
        this.compCoinText.setVisible(true);
        this.updateCoinUI();

        this.time.delayedCall(2500, () => {
          this.bersihkanUI(); 
          if (this.state.playerCoins <= 0) this.gameOver(false, 'KOIN HABIS!'); 
          else if (this.state.computerCoins <= 0) this.gameOver(true, 'MUSUH BANGKRUT!'); 
          else this.mulaiFaseBattle();
        });
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

    if (this.state.playerCoins > this.state.highScore) {
      this.state.highScore = this.state.playerCoins;
      localStorage.setItem('monsterHighScore', this.state.highScore);
    }

    this.sound.play(isWin ? 'win' : 'lose');
    const w = this.scale.width, h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0).setDepth(10);
    this.tweens.add({ targets: overlay, fillAlpha: 0.9, duration: 500 });
    
    const warnaUtama = isWin ? '#00ffcc' : '#ff4444';
    const panel = this.add.rectangle(w / 2, h / 2, 600, 350, 0x1a1a2e, 0).setStrokeStyle(6, isWin ? 0x00ffcc : 0xff4444).setDepth(11);
    const titleText = this.add.text(w / 2, h / 2 - 70, isWin ? 'KEMENANGAN!' : 'GAME OVER', { ...FONT_TITLE, fontSize: '32px', color: warnaUtama }).setOrigin(0.5).setDepth(12).setAlpha(0);
    const reasonText = this.add.text(w / 2, h / 2 + 10, alasan, { ...FONT_UI, fontSize: '16px', color: '#eeeeee', align: 'center' }).setOrigin(0.5).setDepth(12).setAlpha(0);
    const statsText = this.add.text(w / 2, h / 2 + 50, `KAMU: ${this.state.playerCoins}  |  MUSUH: ${this.state.computerCoins}`, { ...FONT_UI, fontSize: '14px', color: '#f0c040' }).setOrigin(0.5).setDepth(12).setAlpha(0);
    const hsText = this.add.text(w / 2, h / 2 + 80, `REKOR: ${this.state.highScore}`, { ...FONT_UI, fontSize: '12px', color: '#00ffcc' }).setOrigin(0.5).setDepth(12).setAlpha(0);

    const restartBtn = new Button(this, w / 2, h / 2 + 150, 240, 60, isWin ? 0x00ffcc : 0xff4444, 'MAIN LAGI', () => {
      this.scene.restart();
    }, this.sound);
    restartBtn.setDepth(12).setAlpha(0);

    this.tweens.add({ targets: panel, fillAlpha: 1, duration: 500 });
    this.tweens.add({ targets: [titleText, reasonText, statsText, hsText, restartBtn], alpha: 1, duration: 800, delay: 400 });
  }
}