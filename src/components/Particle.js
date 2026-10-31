export function buatLedakan(scene, x, y, warna) {
  const partikel = scene.add.particles(x, y, 'flare', {
    speed: { min: -150, max: 150 },
    angle: { min: 0, max: 360 },
    scale: { start: 1, end: 0 },
    lifespan: 600,
    quantity: 30,
    tint: warna,
    emitting: false
  });

  // Karena kita ga punya gambar 'flare', kita pakai Graphics bawaan Phaser
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 10, 10); // Bikin kotak kecil
  g.generateTexture('flare', 10, 10);

  partikel.explode();
}