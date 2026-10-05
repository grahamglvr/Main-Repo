// Draws the battle. All rules live in src/game; this scene reads the battle state each
// frame and plays effects for game events (hits, deaths, loot, banners).
import Phaser from 'phaser';
import { BATTLE } from '../data/config';
import { getBase, getTier, tierIndex } from '../game/items';
import { getEnemyDef, zoneDef, type EnemyInstance } from '../game/battle';
import { battleTimeScale, bus, getBattle, useGame } from '../game/store';
import type { GameEvent } from '../game/game';
import type { Item } from '../game/types';
import { ENEMY_ART } from './art/sprites';
import { makeSpriteTextures, paintGround, paintShacks, paintSpires } from './art/textures';

export const SCENE_W = 360;
export const SCENE_H = 240;
const GROUND = 204;
const FONT = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const TEXT_RES = 4;

function hex(colour: string): number {
  return parseInt(colour.replace('#', ''), 16);
}

function hueColour(h: number): number {
  const f = (n: number) => {
    const k = (n + h * 6) % 6;
    return Math.round(255 * (1 - 0.35 * Math.max(0, Math.min(k, 4 - k, 1))));
  };
  return (f(5) << 16) | (f(3) << 8) | f(1);
}

interface EnemyView {
  art: (typeof ENEMY_ART)[string];
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  bar: Phaser.GameObjects.Graphics;
  barWidth: number;
  height: number;
  dying: boolean;
}

export class BattleScene extends Phaser.Scene {
  private layers!: { spires: Phaser.GameObjects.TileSprite; shacks: Phaser.GameObjects.TileSprite; ground: Phaser.GameObjects.TileSprite };
  private rain!: Phaser.GameObjects.Particles.ParticleEmitter;
  private nobody!: Phaser.GameObjects.Container;
  private nobodyBody!: Phaser.GameObjects.Sprite;
  private jacket!: Phaser.GameObjects.Sprite;
  private weapon!: Phaser.GameObjects.Sprite;
  private weaponGlow!: Phaser.GameObjects.Sprite;
  private weaponSparkles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private nobodyBar!: Phaser.GameObjects.Graphics;
  private enemies = new Map<number, EnemyView>();
  private weaponUid = -1;
  private bodyUid = -1;
  private celestialWeapon = false;
  private swinging = false;
  private down = false;
  private unsubscribe?: () => void;

  constructor() {
    super('battle');
  }

  create() {
    makeSpriteTextures(this);
    this.buildBackground();
    this.buildNobody();

    this.unsubscribe = bus.on((e) => this.onEvent(e));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribe?.());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.unsubscribe?.());
    this.syncGear();
  }

  // ---------------- Setup ----------------

  private buildBackground() {
    const sky = this.add.graphics();
    const bands = ['#1d1310', '#1a1311', '#171212', '#141113', '#111014', '#0e0f13'];
    bands.forEach((c, i) => {
      sky.fillStyle(hex(c), 1);
      sky.fillRect(0, (i * GROUND) / bands.length, SCENE_W, GROUND / bands.length + 1);
    });
    // Smog glow on the horizon.
    sky.fillStyle(0xff7a2f, 0.05);
    sky.fillRect(0, GROUND - 90, SCENE_W, 60);

    paintSpires(this, 'bg-spires', 240, 150);
    paintShacks(this, 'bg-shacks', 300, 70);
    paintGround(this, 'bg-ground', 200, SCENE_H - GROUND);
    this.layers = {
      spires: this.add.tileSprite(0, GROUND - 150 - 18, SCENE_W, 150, 'bg-spires').setOrigin(0, 0).setAlpha(0.9),
      shacks: this.add.tileSprite(0, GROUND - 70, SCENE_W, 70, 'bg-shacks').setOrigin(0, 0),
      ground: this.add.tileSprite(0, GROUND, SCENE_W, SCENE_H - GROUND, 'bg-ground').setOrigin(0, 0),
    };

    this.rain = this.add.particles(0, -8, 'spark', {
      x: { min: -40, max: SCENE_W + 40 },
      speedY: { min: 240, max: 300 },
      speedX: { min: -70, max: -50 },
      lifespan: 1000,
      frequency: 18,
      quantity: 1,
      scaleY: 7,
      scaleX: 1,
      alpha: { start: 0.28, end: 0.08 },
      tint: 0x7d9ab8,
    });
    this.rain.setDepth(50);
  }

  private buildNobody() {
    this.nobodyBody = this.add.sprite(0, 0, 'nobody').setOrigin(0.5, 1).setScale(2);
    this.jacket = this.add.sprite(0, 0, 'nobodyJacket').setOrigin(0.5, 1).setScale(2).setAlpha(0);
    // Hand is at pixel (11, 13) of a 16×24 sprite drawn at 2×, origin bottom-centre.
    this.weaponGlow = this.add.sprite(6, -22, 'pipe').setOrigin(0.5, 0.95).setScale(2.6).setAlpha(0);
    this.weaponGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.weapon = this.add.sprite(6, -22, 'pipe').setOrigin(0.5, 0.95).setScale(2);
    this.weapon.setAngle(25);
    this.weaponSparkles = this.add.particles(0, 0, 'spark', {
      speed: { min: 6, max: 20 },
      lifespan: 700,
      frequency: 60,
      scale: { start: 2, end: 0 },
      tint: [0xffffff, 0xffb3f0, 0xb3d4ff, 0xb3ffe0, 0xfff1b0],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    this.nobodyBar = this.add.graphics();
    this.nobody = this.add.container(BATTLE.playerX, GROUND + 2, [
      this.nobodyBody,
      this.jacket,
      this.weaponGlow,
      this.weapon,
      this.nobodyBar,
    ]);
    this.nobody.setDepth(10);
    this.weaponSparkles.setDepth(11);
    // Idle breathing.
    this.tweens.add({ targets: this.nobodyBody, scaleY: 2.06, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // ---------------- Gear on the sprite ----------------

  private syncGear() {
    const { equipped } = useGame.getState().game;
    const weapon = equipped.weapon;
    if (weapon && weapon.uid !== this.weaponUid) this.showWeapon(weapon);
    const body = equipped.body;
    const bodyUid = body?.uid ?? 0;
    if (bodyUid !== this.bodyUid) {
      this.bodyUid = bodyUid;
      if (body) {
        this.jacket.setTint(hex(getTier(body.tier).colour)).setAlpha(0.75);
      } else {
        this.jacket.setAlpha(0);
      }
    }
  }

  private showWeapon(item: Item) {
    this.weaponUid = item.uid;
    const look = getBase(item.baseId).look ?? 'pipe';
    const tier = getTier(item.tier);
    this.weapon.setTexture(look);
    this.weaponGlow.setTexture(look);
    const rank = tierIndex(item.tier);
    this.weaponGlow.setTint(hex(tier.colour)).setAlpha(rank >= 2 ? 0.25 + rank * 0.06 : 0);
    this.celestialWeapon = item.tier === 'celestial';
    this.weaponSparkles.emitting = this.celestialWeapon;
    if (!this.celestialWeapon) this.weapon.clearTint();
    // Show it off.
    this.tweens.add({ targets: this.weapon, scale: 2.8, duration: 160, yoyo: true, ease: 'Back.easeOut' });
  }

  // ---------------- Frame update ----------------

  update(_time: number, delta: number) {
    const scale = battleTimeScale();
    this.tweens.timeScale = scale;
    this.anims.globalTimeScale = scale;
    this.time.timeScale = scale;
    this.rain.timeScale = scale;

    useGame.getState().tick(delta);
    const b = getBattle();
    this.syncGear();

    // Parallax while walking between waves.
    const walking = b.phase === 'advancing';
    if (walking) {
      const speed = (delta / 1000) * 60 * scale * useGame.getState().game.debug.speed;
      this.layers.spires.tilePositionX += speed * 0.15;
      this.layers.shacks.tilePositionX += speed * 0.45;
      this.layers.ground.tilePositionX += speed;
      if (!this.down && this.nobodyBody.anims.currentAnim?.key !== 'nobody_walk') this.nobodyBody.play('nobody_walk');
    } else if (this.nobodyBody.anims.isPlaying) {
      this.nobodyBody.stop();
      this.nobodyBody.setTexture('nobody');
    }
    this.layers.spires.tilePositionX += (delta / 1000) * 1.5 * scale;

    // Celestial weapons shimmer through the spectrum.
    if (this.celestialWeapon) {
      const h = (this.time.now / 2000) % 1;
      this.weapon.setTint(hueColour(h));
      this.weaponGlow.setTint(hueColour((h + 0.5) % 1)).setAlpha(0.6);
      const m = this.weapon.getWorldTransformMatrix();
      this.weaponSparkles.setPosition(m.tx, m.ty - 14);
    }

    this.drawBar(this.nobodyBar, -16, -56, 32, b.playerHp / b.playerMaxHp, 0xb6ff3b);
    this.syncEnemies(b.enemies);
  }

  private drawBar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, frac: number, colour: number) {
    g.clear();
    g.fillStyle(0x0b0d10, 0.85);
    g.fillRect(x - 1, y - 1, w + 2, 5);
    g.fillStyle(0x2a333c, 1);
    g.fillRect(x, y, w, 3);
    g.fillStyle(colour, 1);
    g.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, 3);
  }

  private syncEnemies(list: EnemyInstance[]) {
    const alive = new Set<number>();
    for (const e of list) {
      alive.add(e.id);
      let view = this.enemies.get(e.id);
      if (!view) view = this.createEnemy(e);
      view.container.x = e.x;
      const moving = !e.engaged;
      const walk = `${view.art.sprite}_walk`;
      if (moving && !view.sprite.anims.isPlaying && this.anims.exists(walk)) {
        view.sprite.play(walk);
      } else if (!moving && view.sprite.anims.isPlaying) {
        view.sprite.stop();
        view.sprite.setTexture(view.art.sprite);
      }
      if (!e.boss) {
        this.drawBar(view.bar, -view.barWidth / 2, -view.height - 8, view.barWidth, e.hp / e.maxHp, 0xff4f8b);
      }
    }
    // Remove views whose enemies vanished without dying (zone reset, defeat).
    for (const [id, view] of this.enemies) {
      if (!alive.has(id) && !view.dying) {
        this.enemies.delete(id);
        this.tweens.add({ targets: view.container, alpha: 0, duration: 300, onComplete: () => view.container.destroy() });
      }
    }
  }

  private createEnemy(e: EnemyInstance): EnemyView {
    const art = ENEMY_ART[getEnemyDef(e.defId).art];
    const sprite = this.add.sprite(0, 0, art.sprite).setOrigin(0.5, 1).setScale(art.scale);
    if (art.tint) sprite.setTint(art.tint);
    const parts: Phaser.GameObjects.GameObject[] = [sprite];
    const height = sprite.height * art.scale;
    if (art.accessory) {
      const acc = this.add.sprite(
        (art.accessory.x - sprite.width / 2) * art.scale,
        -height + art.accessory.y * art.scale,
        art.accessory.sprite,
      ).setOrigin(0, 1).setScale(art.scale * 0.8);
      parts.push(acc);
    }
    const bar = this.add.graphics();
    parts.push(bar);
    const container = this.add.container(e.x, GROUND + 2, parts).setDepth(9 - e.id * 0.001);
    if (e.boss) {
      // Bosses loom.
      this.tweens.add({ targets: sprite, scaleY: art.scale * 1.04, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const view: EnemyView = { art, container, sprite, bar, barWidth: Math.max(20, sprite.width * art.scale * 0.6), height, dying: false };
    this.enemies.set(e.id, view);
    return view;
  }

  // ---------------- Events ----------------

  private onEvent(e: GameEvent) {
    if (!this.sys.isActive()) return;
    switch (e.t) {
      case 'attack':
        return this.swing();
      case 'hit':
        return this.onHit(e.enemyId, e.damage, e.crit);
      case 'enemyAttack':
        return this.onEnemyAttack(e.enemyId, e.damage);
      case 'enemyDied':
        return this.onEnemyDied(e.enemy);
      case 'reward':
        return this.lootArc(e.x, e.boss);
      case 'itemFound':
        if (e.source !== 'salvage') this.crateArc(e.x ?? BATTLE.playerX + 40, e.item);
        return;
      case 'waveStart':
        if (e.boss) {
          const name = getEnemyDef(zoneDef(getBattle().zone).boss).name;
          this.banner(`BOSS: ${name.toUpperCase()}`, '#ff4f8b', 1600);
          this.cameras.main.shake(300, 0.006);
        } else if (e.wave === 1) {
          const z = zoneDef(getBattle().zone);
          this.banner(`ZONE ${z.id} · ${z.name.toUpperCase()}`, '#e6edf3', 1500);
        }
        return;
      case 'playerDied':
        return this.knockOut('DOWN!');
      case 'bossTimeout':
        return this.knockOut("TIME'S UP");
      case 'bossDefeated':
        this.cameras.main.flash(250, 182, 255, 59);
        this.banner('ZONE CLEARED', '#b6ff3b', 1400);
        return;
      case 'zoneChanged':
        this.cameras.main.fadeIn(400, 11, 13, 16);
        this.standUp();
        return;
      case 'levelUp':
        this.floatText(BATTLE.playerX, GROUND - 70, `LEVEL ${e.level}`, '#b6ff3b', 12);
        return;
      default:
        return;
    }
  }

  private swing() {
    if (this.swinging || this.down) return;
    this.swinging = true;
    this.tweens.chain({
      targets: [this.weapon, this.weaponGlow],
      tweens: [
        { angle: -35, duration: 70, ease: 'Quad.easeOut' },
        { angle: 115, duration: 80, ease: 'Quad.easeIn' },
        { angle: 25, duration: 120, ease: 'Quad.easeOut' },
      ],
      onComplete: () => (this.swinging = false),
    });
    this.tweens.add({ targets: this.nobodyBody, x: 3, duration: 80, yoyo: true });
  }

  private onHit(enemyId: number, damage: number, crit: boolean) {
    const view = this.enemies.get(enemyId);
    if (!view) return;
    view.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.time.delayedCall(60, () => {
      if (!view.sprite.active) return;
      view.sprite.setTintMode(Phaser.TintModes.MULTIPLY);
      if (view.art.tint) view.sprite.setTint(view.art.tint);
      else view.sprite.clearTint();
    });
    // Knockback on the sprite only; the battle position stays put.
    this.tweens.add({ targets: view.sprite, x: crit ? 9 : 5, duration: 60, yoyo: true, ease: 'Quad.easeOut' });
    const x = view.container.x + Phaser.Math.Between(-6, 6);
    const y = GROUND - view.height - 10;
    if (crit) {
      this.floatText(x, y, `${Math.round(damage)}!`, '#ff7a2f', 15, true);
      this.cameras.main.shake(80, 0.003);
    } else {
      this.floatText(x, y, `${Math.round(damage)}`, '#e6edf3', 10);
    }
  }

  private onEnemyAttack(enemyId: number, damage: number) {
    const view = this.enemies.get(enemyId);
    if (view) {
      this.tweens.add({ targets: view.sprite, x: -8, duration: 90, yoyo: true, ease: 'Quad.easeIn' });
      if (view.art.sprite === 'hound') this.laser(view);
    }
    if (useGame.getState().game.debug.godMode) return;
    this.nobodyBody.setTint(0xff4f8b).setTintMode(Phaser.TintModes.FILL);
    this.time.delayedCall(70, () => this.nobodyBody.setTintMode(Phaser.TintModes.MULTIPLY).clearTint());
    this.floatText(BATTLE.playerX - 6 + Phaser.Math.Between(-4, 4), GROUND - 60, `-${Math.round(damage)}`, '#ff4f8b', 9);
  }

  /** The Scrapyard Hound's laser eye. */
  private laser(view: EnemyView) {
    const g = this.add.graphics().setDepth(12);
    const sx = view.container.x - (view.sprite.width * view.sprite.scaleX) / 2 + 4;
    const sy = GROUND + 2 - view.height + 10;
    g.lineStyle(3, 0xff2a2a, 1).lineBetween(sx, sy, BATTLE.playerX + 4, GROUND - 34);
    g.lineStyle(1, 0xffd0d0, 1).lineBetween(sx, sy, BATTLE.playerX + 4, GROUND - 34);
    this.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
  }

  private onEnemyDied(e: EnemyInstance) {
    const view = this.enemies.get(e.id);
    if (!view) return;
    view.dying = true;
    this.enemies.delete(e.id);
    view.bar.clear();
    view.sprite.stop();
    view.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.tweens.add({
      targets: view.container,
      x: view.container.x + 16,
      y: GROUND - 10,
      angle: 25,
      alpha: 0,
      duration: e.boss ? 900 : 420,
      ease: 'Quad.easeOut',
      onComplete: () => view.container.destroy(),
    });
    if (e.boss) this.cameras.main.shake(400, 0.01);
  }

  /** Scrap tumbles down towards the Workbench; Tokens fly up towards the top bar. */
  private lootArc(x: number, boss: boolean) {
    const bits = boss ? 10 : 3;
    for (let i = 0; i < bits; i++) {
      const isCoin = i % 2 === 1;
      const s = this.add.sprite(x, GROUND - 20, isCoin ? 'coin' : 'scrapBit').setScale(isCoin ? 1.6 : 2).setDepth(20);
      const endX = isCoin ? 12 + Math.random() * 20 : x - 30 + Math.random() * 60;
      const endY = isCoin ? -10 : SCENE_H + 10;
      const peak = GROUND - 60 - Math.random() * 40;
      const startX = s.x;
      const startY = s.y;
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 650 + Math.random() * 250,
        delay: i * 40,
        ease: 'Sine.easeIn',
        onUpdate: (tw) => {
          const t = tw.getValue() ?? 0;
          const midX = (startX + endX) / 2;
          s.x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
          s.y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * peak + t * t * endY;
          s.angle = t * 360;
        },
        onComplete: () => s.destroy(),
      });
    }
  }

  /** Boss crates and direct drops: a glowing crate pops out and drops to the Workbench. */
  private crateArc(x: number, item: Item) {
    const colour = hex(getTier(item.tier).colour);
    const glow = this.add.circle(x, GROUND - 30, 12, colour, 0.5).setDepth(20).setBlendMode(Phaser.BlendModes.ADD);
    const crate = this.add.sprite(x, GROUND - 30, 'crate').setScale(2.4).setDepth(21);
    this.tweens.add({
      targets: [crate, glow],
      y: GROUND - 90,
      duration: 450,
      ease: 'Quad.easeOut',
      yoyo: false,
      onComplete: () => {
        this.tweens.add({
          targets: [crate, glow],
          y: SCENE_H + 30,
          duration: 500,
          delay: 350,
          ease: 'Quad.easeIn',
          onComplete: () => {
            crate.destroy();
            glow.destroy();
          },
        });
      },
    });
    this.tweens.add({ targets: glow, scale: 1.8, alpha: 0.2, duration: 400, yoyo: true, repeat: 1 });
  }

  private knockOut(text: string) {
    this.down = true;
    this.banner(text, '#ff7a2f', 1800);
    this.nobodyBody.stop();
    this.tweens.add({ targets: this.nobody, angle: -80, y: GROUND + 4, alpha: 0.6, duration: 450, ease: 'Bounce.easeOut' });
    this.time.delayedCall(BATTLE.defeatDelay * 1000 - 300, () => this.standUp());
  }

  private standUp() {
    if (!this.down) return;
    this.down = false;
    this.tweens.add({ targets: this.nobody, angle: 0, y: GROUND + 2, alpha: 1, duration: 300, ease: 'Back.easeOut' });
  }

  private floatText(x: number, y: number, text: string, colour: string, size: number, pop = false) {
    const t = this.add
      .text(x, y, text, {
        fontFamily: FONT,
        fontSize: `${size}px`,
        fontStyle: 'bold',
        color: colour,
        stroke: '#0b0d10',
        strokeThickness: 3,
      })
      .setResolution(TEXT_RES)
      .setOrigin(0.5)
      .setDepth(30);
    if (pop) {
      t.setScale(0.4);
      this.tweens.add({ targets: t, scale: 1.25, duration: 120, ease: 'Back.easeOut' });
    }
    this.tweens.add({
      targets: t,
      y: y - 22,
      alpha: 0,
      duration: pop ? 900 : 650,
      delay: pop ? 150 : 0,
      ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  private banner(text: string, colour: string, ms: number) {
    const t = this.add
      .text(SCENE_W / 2, 64, text, {
        fontFamily: FONT,
        fontSize: '14px',
        fontStyle: 'bold',
        color: colour,
        stroke: '#0b0d10',
        strokeThickness: 4,
        letterSpacing: 2,
      })
      .setResolution(TEXT_RES)
      .setOrigin(0.5)
      .setDepth(40)
      .setAlpha(0)
      .setScale(0.8);
    this.tweens.add({ targets: t, alpha: 1, scale: 1, duration: 180, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, y: 56, delay: ms, duration: 300, onComplete: () => t.destroy() });
  }
}
