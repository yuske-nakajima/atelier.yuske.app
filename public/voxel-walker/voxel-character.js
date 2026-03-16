// @ts-check

/**
 * プロシージャル Voxel キャラクター生成・アニメーション
 */

import * as THREE from 'https://esm.sh/three@0.172.0';

const GRID_SIZE = 10;
const VOXEL_SIZE = 0.4;

/**
 * シルエットマスク: 各Y層(0=足, 9=頭頂)で有効なXZ範囲を定義
 * 左右対称のため、右半分のみ定義（中心=5）
 * @type {Array<{minX: number, maxX: number, minZ: number, maxZ: number}>}
 */
const SILHOUETTE = [
  // 層0 (足): 2ブロック幅の足 x2
  { minX: 2, maxX: 4, minZ: 3, maxZ: 7 },
  // 層1 (足上): 同上
  { minX: 2, maxX: 4, minZ: 3, maxZ: 7 },
  // 層2 (脚): やや太い
  { minX: 2, maxX: 5, minZ: 3, maxZ: 7 },
  // 層3 (脚上)
  { minX: 2, maxX: 5, minZ: 3, maxZ: 7 },
  // 層4 (胴体下)
  { minX: 1, maxX: 6, minZ: 2, maxZ: 8 },
  // 層5 (胴体中)
  { minX: 1, maxX: 6, minZ: 2, maxZ: 8 },
  // 層6 (胴体上)
  { minX: 1, maxX: 6, minZ: 2, maxZ: 8 },
  // 層7 (頭下)
  { minX: 2, maxX: 6, minZ: 3, maxZ: 7 },
  // 層8 (頭中)
  { minX: 2, maxX: 6, minZ: 3, maxZ: 7 },
  // 層9 (頭頂)
  { minX: 3, maxX: 5, minZ: 4, maxZ: 6 },
];

/**
 * シード値から疑似乱数生成器を作成
 * @param {number} seed
 * @returns {() => number}
 */
function createRng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

/**
 * ボクセルデータを生成（左右対称）
 * @param {number} seed
 * @returns {{ positions: Array<{x: number, y: number, z: number}>, baseColor: THREE.Color, accentColor: THREE.Color }}
 */
function generateVoxelData(seed) {
  const rng = createRng(seed);
  const positions = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    const mask = SILHOUETTE[y];
    for (let z = mask.minZ; z < mask.maxZ; z++) {
      // 右半分を生成
      for (let x = 5; x < mask.maxX; x++) {
        if (rng() > 0.35) {
          positions.push({ x, y, z });
          // 左右対称: ミラー
          const mirrorX = GRID_SIZE - 1 - x;
          if (mirrorX !== x) {
            positions.push({ x: mirrorX, y, z });
          }
        }
      }
      // 中心列は常に埋める（胴体の連結保証）
      if (y >= 2 && y <= 8) {
        positions.push({ x: 5, y, z });
        positions.push({ x: 4, y, z });
      }
    }
  }

  // 色の生成
  const hue = rng();
  const baseColor = new THREE.Color().setHSL(hue, 0.6, 0.5);
  const accentHue = (hue + 0.3 + rng() * 0.2) % 1;
  const accentColor = new THREE.Color().setHSL(accentHue, 0.7, 0.6);

  return { positions, baseColor, accentColor };
}

/**
 * 歩行アニメーション用のオフセットを計算
 * @param {number} frame - フレーム番号 (0-3)
 * @param {{x: number, y: number, z: number}} pos - 元の位置
 * @returns {{x: number, y: number, z: number}}
 */
function walkOffset(frame, pos) {
  const isLeftLeg = pos.x < 5 && pos.y < 3;
  const isRightLeg = pos.x >= 5 && pos.y < 3;
  const isLeftArm = pos.x < 3 && pos.y >= 4 && pos.y <= 6;
  const isRightArm = pos.x > 6 && pos.y >= 4 && pos.y <= 6;

  const offsets = [
    { legL: 1, legR: -1, armL: -1, armR: 1 },
    { legL: 0, legR: 0, armL: 0, armR: 0 },
    { legL: -1, legR: 1, armL: 1, armR: -1 },
    { legL: 0, legR: 0, armL: 0, armR: 0 },
  ];

  const o = offsets[frame];
  let dz = 0;

  if (isLeftLeg) dz = o.legL * 0.3;
  if (isRightLeg) dz = o.legR * 0.3;
  if (isLeftArm) dz = o.armL * 0.3;
  if (isRightArm) dz = o.armR * 0.3;

  return { x: pos.x, y: pos.y, z: pos.z + dz };
}

/**
 * 呼吸アニメーション用のオフセットを計算
 * @param {number} frame - フレーム番号 (0-2)
 * @param {{x: number, y: number, z: number}} pos
 * @returns {{x: number, y: number, z: number}}
 */
function breatheOffset(frame, pos) {
  const isChest = pos.y >= 4 && pos.y <= 6;
  const isShoulder = pos.y === 7;

  if (frame === 1) {
    // 吸う: 胸膨らむ、肩上がる
    const dx = isChest ? (pos.x < 5 ? -0.1 : 0.1) : 0;
    const dy = isShoulder ? 0.1 : 0;
    return { x: pos.x + dx, y: pos.y + dy, z: pos.z };
  }
  if (frame === 2) {
    // 吐く: 胸がわずかに縮む
    const dx = isChest ? (pos.x < 5 ? 0.05 : -0.05) : 0;
    return { x: pos.x + dx, y: pos.y, z: pos.z };
  }
  return pos;
}

/**
 * 天気に応じた追加オフセット
 * @param {number} weatherCode
 * @param {number} windSpeed
 * @param {number} time
 * @param {{x: number, y: number, z: number}} pos
 * @returns {{x: number, y: number, z: number}}
 */
function weatherOffset(weatherCode, windSpeed, time, pos) {
  let dx = 0;
  let dy = 0;

  // 雨: 全体が左右にガタガタ
  if (weatherCode >= 51 && weatherCode <= 67) {
    dx = Math.sin(time * 20) * 0.05;
  }

  // 雷雨: しゃがみ（上半分が下がる）
  if (weatherCode >= 95) {
    if (pos.y >= 5) dy = -0.3;
  }

  // 晴れ: ときどきジャンプ
  if (weatherCode <= 3) {
    const jumpCycle = Math.sin(time * 1.5);
    if (jumpCycle > 0.9) dy = 0.3;
  }

  // 強風: 傾き
  if (windSpeed > 10) {
    dy = (pos.y / GRID_SIZE) * 0.2;
    dx = (pos.y / GRID_SIZE) * 0.3;
  }

  return { x: pos.x + dx, y: pos.y + dy, z: pos.z };
}

export class VoxelCharacter {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.seed = Math.floor(Math.random() * 2147483647);
    this.data = generateVoxelData(this.seed);
    this.group = new THREE.Group();

    const geometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);

    // InstancedMesh で全ボクセルを描画
    const maxCount = this.data.positions.length;
    const material = new THREE.MeshLambertMaterial();
    this.mesh = new THREE.InstancedMesh(geometry, material, maxCount);
    this.mesh.castShadow = true;

    // 色を設定
    const rng = createRng(this.seed + 1);
    for (let i = 0; i < maxCount; i++) {
      const color = rng() > 0.7 ? this.data.accentColor : this.data.baseColor;
      this.mesh.setColorAt(i, color);
    }

    this.group.add(this.mesh);
    // キャラを中心に配置（ボクセルグリッドの中心をオフセット）
    this.group.position.set(0, 0, 0);
    scene.add(this.group);

    this.walkFrame = 0;
    this.breatheFrame = 0;
    this.walkTimer = 0;
    this.breatheTimer = 0;
    this.dummy = new THREE.Object3D();
  }

  /**
   * @param {number} deltaTime
   * @param {number} time - 累計時間
   * @param {number} weatherCode
   * @param {number} windSpeed
   * @param {number} headingDeg - 進行方向（度、北=0、時計回り）
   */
  update(deltaTime, time, weatherCode, windSpeed, headingDeg) {
    // 進行方向にキャラの広い面（Z軸正面）を向ける
    const targetRotation = ((headingDeg - 90) * Math.PI) / 180;
    this.group.rotation.y +=
      (targetRotation - this.group.rotation.y) * Math.min(deltaTime * 2, 1);
    // 歩きフレーム更新（風速で速度変化）
    const walkSpeed = 0.3 + windSpeed * 0.02;
    this.walkTimer += deltaTime;
    if (this.walkTimer > walkSpeed) {
      this.walkTimer = 0;
      this.walkFrame = (this.walkFrame + 1) % 4;
    }

    // 呼吸フレーム更新
    this.breatheTimer += deltaTime;
    if (this.breatheTimer > 0.8) {
      this.breatheTimer = 0;
      this.breatheFrame = (this.breatheFrame + 1) % 3;
    }

    // 全ボクセルの位置を更新
    const centerOffset = (GRID_SIZE * VOXEL_SIZE) / 2;
    for (let i = 0; i < this.data.positions.length; i++) {
      let pos = this.data.positions[i];
      pos = walkOffset(this.walkFrame, pos);
      pos = breatheOffset(this.breatheFrame, pos);
      pos = weatherOffset(weatherCode, windSpeed, time, pos);

      this.dummy.position.set(
        pos.x * VOXEL_SIZE - centerOffset,
        pos.y * VOXEL_SIZE - centerOffset * 0.5,
        pos.z * VOXEL_SIZE - centerOffset,
      );
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
