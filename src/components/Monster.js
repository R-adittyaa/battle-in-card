export function createMonsterShape(scene, x, y, card) {
  const g = scene.add.graphics({ x: x, y: y });
  g.fillStyle(card.color, 1);
  g.lineStyle(2, 0xffffff, 1);

  switch(card.shape) {
    case 'dragon': g.fillTriangle(0, -30, 30, 30, -30, 30); g.strokeTriangle(0, -30, 30, 30, -30, 30); break;
    case 'knight': g.fillRect(-25, -25, 50, 50); g.strokeRect(-25, -25, 50, 50); break;
    case 'slime': g.fillCircle(0, 10, 30); g.strokeCircle(0, 10, 30); break;
    case 'golem': g.fillRect(-30, -10, 60, 40); g.strokeRect(-30, -10, 60, 40); break;
    case 'ghost': g.fillTriangle(-20, 20, 20, 20, 0, -30); g.strokeTriangle(-20, 20, 20, 20, 0, -30); break;
    case 'goblin': g.fillTriangle(-25, 0, 25, 0, 0, -25); g.strokeTriangle(-25, 0, 25, 0, 0, -25); break;
    case 'bomb': g.fillCircle(0, 0, 25); g.strokeCircle(0, 0, 25); break;
    case 'chest': g.fillRect(-25, 0, 50, 30); g.strokeRect(-25, 0, 50, 30); break;
    default: g.fillCircle(0, 0, 20);
  }

  g.fillStyle(0xffffff, 1); g.fillCircle(-10, -5, 6); g.fillCircle(10, -5, 6);
  g.fillStyle(0x000000, 1); g.fillCircle(-10, -5, 3); g.fillCircle(10, -5, 3);

  return g;
}