// @ts-check

/**
 * 天気パーティクル（雨・雪・霧）
 */

import * as THREE from 'https://esm.sh/three@0.172.0';

const MAX_PARTICLES = 500;

export class ParticleSystem {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.velocities = new Float32Array(MAX_PARTICLES * 3);
    this.activeCount = 0;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3),
    );

    this.material = new THREE.PointsMaterial({
      color: 0xccddff,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      depthTest: false,
    });

    this.points = new THREE.Points(geometry, this.material);
    scene.add(this.points);

    // 霧オーバーレイ
    const fogGeom = new THREE.PlaneGeometry(40, 40);
    this.fogMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    this.fog = new THREE.Mesh(fogGeom, this.fogMaterial);
    this.fog.position.set(0, 2, 0);
    this.fog.rotation.x = -Math.PI / 2;
    scene.add(this.fog);
  }

  /**
   * @param {number} deltaTime
   * @param {import('./weather.js').WeatherData} weather
   */
  update(deltaTime, weather) {
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

    // パーティクル数を降水量に応じて決定
    const targetCount = isRain
      ? Math.min(MAX_PARTICLES, Math.floor(precipitation * 50))
      : isSnow
        ? Math.min(MAX_PARTICLES, Math.floor(snowfall * 100))
        : 0;

    this.activeCount = targetCount;

    // パーティクルの色とサイズ
    if (isSnow) {
      this.material.color.setHex(0xffffff);
      this.material.size = 0.08;
    } else {
      this.material.color.setHex(0x8899cc);
      this.material.size = 0.03;
    }

    // 風の影響
    const windRad = (windDirection * Math.PI) / 180;
    const windForceX = Math.sin(windRad) * windSpeed * 0.01;
    const windForceZ = Math.cos(windRad) * windSpeed * 0.01;

    // パーティクル位置の更新
    for (let i = 0; i < this.activeCount; i++) {
      const i3 = i * 3;

      // 画面外に出たら再配置
      if (this.positions[i3 + 1] < -3 || this.positions[i3 + 1] === 0) {
        this.positions[i3] = (Math.random() - 0.5) * 20;
        this.positions[i3 + 1] = 5 + Math.random() * 5;
        this.positions[i3 + 2] = (Math.random() - 0.5) * 20;

        // 速度: 雪はゆっくり、雨は速い
        const fallSpeed = isSnow ? -1 - Math.random() : -8 - Math.random() * 4;
        this.velocities[i3] = windForceX + (Math.random() - 0.5) * 0.5;
        this.velocities[i3 + 1] = fallSpeed;
        this.velocities[i3 + 2] = windForceZ + (Math.random() - 0.5) * 0.5;
      }

      // 位置を更新
      this.positions[i3] += this.velocities[i3] * deltaTime;
      this.positions[i3 + 1] += this.velocities[i3 + 1] * deltaTime;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * deltaTime;

      // 雪のゆらぎ
      if (isSnow) {
        this.positions[i3] += Math.sin(performance.now() * 0.001 + i) * 0.01;
      }
    }

    // 非アクティブなパーティクルは画面外に配置
    for (let i = this.activeCount; i < MAX_PARTICLES; i++) {
      const i3 = i * 3;
      this.positions[i3 + 1] = -100;
    }

    this.points.geometry.attributes.position.needsUpdate = true;

    // 霧エフェクト（高湿度時）
    const fogOpacity = humidity > 80 ? (humidity - 80) * 0.015 : 0;
    this.fogMaterial.opacity = Math.min(fogOpacity, 0.3);
  }
}
