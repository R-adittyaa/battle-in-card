export function calculateBattle(cardA, cardB) {
  let p1 = { ...cardA, currentHp: cardA.hp };
  let p2 = { ...cardB, currentHp: cardB.hp };
  
  let log = [];
  let turnCount = 0;
  let isFirstStrike = true; // Penanda serangan pertama

  let attacker = p1.spd >= p2.spd ? p1 : p2;
  let defender = attacker === p1 ? p2 : p1;

  log.push({ 
    type: 'info', 
    text: `${attacker.name} lebih cepat! (SPD ${attacker.spd})`,
    isFirst: true 
  });

  while (p1.currentHp > 0 && p2.currentHp > 0 && turnCount < 15) {
    turnCount++;

    let rawDamage = attacker.atk - defender.def;
    let finalDamage = Math.max(1, rawDamage); 
    let isBlocked = rawDamage <= 0; 

    defender.currentHp -= finalDamage;
    if (defender.currentHp < 0) defender.currentHp = 0;

    log.push({ 
      type: 'attack', 
      attacker: attacker === p1 ? 'p1' : 'p2', 
      defender: defender === p1 ? 'p1' : 'p2',
      damage: finalDamage,
      isBlocked: isBlocked,
      isFirstStrike: isFirstStrike, // Kirim data first strike
      p1Hp: p1.currentHp, 
      p2Hp: p2.currentHp
    });

    isFirstStrike = false; // Setelah serangan pertama, matikan

    if (defender.currentHp <= 0) break;

    let temp = attacker;
    attacker = defender;
    defender = temp;
  }

  let winner = null;
  if (p1.currentHp > 0 && p2.currentHp <= 0) winner = 'p1';
  else if (p2.currentHp > 0 && p1.currentHp <= 0) winner = 'p2';
  else if (p1.currentHp > 0 && p2.currentHp > 0) winner = 'draw'; 

  return { winner, log };
}