// @ts-check

/**
 * 2D 天気パーティクル（雨・雪・霧）
 */

const MAX_PARTICLES = 300;

export class Particles {
  constructor() {
    /** @type {Array<{x: number, y: number, vx: number, vy: number, size: number}>} */
    this.items = [];
    this.fogOpacity = 0;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width
   * @param {number} height
   * @param {number} deltaTime
   * @param {import('./weather.js').WeatherData} weather
   */
  draw(ctx, width, height, deltaTime, weather) {
    const {
      precipitation,
      rain,
      snowfall,
      humidity,
      windSpeed,
      windDirection,
    } = weather;
    const isSnow = snowfall > 0;
    const isRain = rain > 0 || (precipitation > 0 && !isSnow);

    // パーティクル数
    const targetCount = isRain
      ? Math.min(MAX_PARTICLES, Math.floor(precipitation * 40))
      : isSnow
        ? Math.min(MAX_PARTICLES, Math.floor(snowfall * 80))
        : 0;

    // パーティクル数を調整
    while (this.items.length < targetCount) {
      this.items.push(this.createParticle(width, height, isSnow));
    }
    if (this.items.length > targetCount) {
      this.items.length = targetCount;
    }

    // 風の影響
    const windRad = (windDirection * Math.PI) / 180;
    const windForceX = Math.sin(windRad) * windSpeed * 0.5;

    // 更新と描画
    for (const p of this.items) {
      p.x += (p.vx + windForceX) * deltaTime;
      p.y += p.vy * deltaTime;

      // 雪のゆらぎ
      if (isSnow) {
        p.x += Math.sin(performance.now() * 0.002 + p.y * 0.1) * 0.5;
      }

      // 画面外→再配置
      if (p.y > height + 10 || p.x < -10 || p.x > width + 10) {
        p.x = Math.random() * width;
        p.y = -10;
      }

      ctx.fillStyle = isSnow
        ? 'rgba(255, 255, 255, 0.8)'
        : 'rgba(150, 180, 220, 0.6)';
      ctx.fillRect(p.x, p.y, p.size, isSnow ? p.size : p.size * 3);
    }

    // 霧エフェクト
    const targetFog = humidity > 80 ? (humidity - 80) * 0.012 : 0;
    this.fogOpacity += (targetFog - this.fogOpacity) * deltaTime * 2;
    if (this.fogOpacity > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(this.fogOpacity, 0.25)})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  /**
   * @param {number} width
   * @param {number} height
   * @param {boolean} isSnow
   * @returns {{x: number, y: number, vx: number, vy: number, size: number}}
   */
  createParticle(width, height, isSnow) {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 20,
      vy: isSnow ? 30 + Math.random() * 20 : 200 + Math.random() * 100,
      size: isSnow ? 3 : 1.5,
    };
  }
}
