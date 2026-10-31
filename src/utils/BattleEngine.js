export function calculateBattle(cardA, cardB) {
  // Clone data biar stat asli nggak berubah
  let p1 = { ...cardA, currentHp: cardA.hp, currentAtk: cardA.atk };
  let p2 = { ...cardB, currentHp: cardB.hp, currentAtk: cardB.atk };
  
  let log = [];
  let turnCount = 0;

  // Siapa yang nyerang duluan? Yang SPD-nya lebih tinggi.
  let attacker = p1.spd >= p2.spd ? p1 : p2;
  let defender = attacker === p1 ? p2 : p1;

  log.push(`${attacker.name} (SPD ${attacker.spd}) menyerang duluan!`);

  // Loop pertarungan maksimal 10 ronde biar ga infinite
  while (p1.currentHp > 0 && p2.currentHp > 0 && turnCount < 10) {
    turnCount++;

    // Hitung Damage: ATK - DEF (Minimal 1 damage)
    let damage = Math.max(1, attacker.currentAtk - defender.def);
    defender.currentHp -= damage;
    log.push(`${attacker.name} menyerang ${defender.name} (-${damage} HP)`);

    // Kalau defender mati, stop
    if (defender.currentHp <= 0) break;

    // Gantian yang nyerang
    let temp = attacker;
    attacker = defender;
    defender = temp;
  }

  let winner = null;
  if (p1.currentHp > 0 && p2.currentHp <= 0) winner = 'p1';
  else if (p2.currentHp > 0 && p1.currentHp <= 0) winner = 'p2';
  else if (p1.currentHp > 0 && p2.currentHp > 0) winner = 'draw'; // Kalau kehabisan turn

  return { winner, log, p1Hp: p1.currentHp, p2Hp: p2.currentHp };
}