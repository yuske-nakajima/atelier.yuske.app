// @ts-check

/**
 * 風向ベースのベクトル駆動移動システム
 */

/**
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @returns {number}
 */
function _lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * 角度を -180〜180 に正規化
 * @param {number} deg
 * @returns {number}
 */
function normalizeDeg(deg) {
  const result = ((deg + 180) % 360) - 180;
  return result < -180 ? result + 360 : result;
}

export class MovementSystem {
  constructor() {
    // 初期位置: 東京
    this.lat = 35.6762;
    this.lng = 139.6503;
    // 移動方向（度）
    this.currentAngle = Math.random() * 360;
    this.targetAngle = this.currentAngle;
    // 移動速度（度/秒）
    this.speed = 0.02;
    this.noiseOffset = Math.random() * 1000;
    this.noiseOffset2 = Math.random() * 1000;
    this.noiseOffset3 = Math.random() * 1000;
  }

  /**
   * @param {number} windDirection - 風向（度、北=0、時計回り）
   * @param {number} windSpeed - 風速（m/s）
   * @param {number} deltaTime - 経過秒数
   */
  update(windDirection, windSpeed, deltaTime) {
    // ノイズ揺らぎ: 複数波の重ね合わせで左右均等に方向転換
    this.noiseOffset += deltaTime * 0.1;
    this.noiseOffset2 += deltaTime * 0.23;
    this.noiseOffset3 += deltaTime * 0.07;
    const noise =
      Math.sin(this.noiseOffset) * 0.5 +
      Math.sin(this.noiseOffset2) * 0.3 +
      Math.sin(this.noiseOffset3) * 0.2;

    // ノイズ主導（±120度）に風向を軽く混ぜる（±20度）
    const rawTarget =
      this.currentAngle +
      noise * 120 +
      normalizeDeg(windDirection - this.currentAngle) * 0.05;
    const targetDiff = normalizeDeg(rawTarget - this.targetAngle);
    const maxTargetChange = 20 * deltaTime;
    this.targetAngle += Math.max(
      -maxTargetChange,
      Math.min(maxTargetChange, targetDiff),
    );

    // 現在角度を目標に向けてゆっくり補間（秒速1度まで）
    const angleDiff = normalizeDeg(this.targetAngle - this.currentAngle);
    const maxTurn = 5 * deltaTime;
    const turn = Math.max(-maxTurn, Math.min(maxTurn, angleDiff * 0.3));
    this.currentAngle += turn;

    // 速度: 風速で増減（基本速度を高めに設定し、ずんずん進む）
    this.speed = 0.5 * (1 + windSpeed / 10);

    // 位置を更新
    const rad = (this.currentAngle * Math.PI) / 180;
    this.lat += Math.cos(rad) * this.speed * deltaTime;
    this.lng += Math.sin(rad) * this.speed * deltaTime;

    // 緯度: 極に近づいたら目標角度を赤道方向に誘導（急旋回させない）
    if (this.lat > 80) {
      this.targetAngle = normalizeDeg(this.targetAngle + 3 * deltaTime);
    }
    if (this.lat < -80) {
      this.targetAngle = normalizeDeg(this.targetAngle + 3 * deltaTime);
    }
    this.lat = Math.max(-85, Math.min(85, this.lat));

    // 経度: ラップアラウンド
    if (this.lng > 180) this.lng -= 360;
    if (this.lng < -180) this.lng += 360;
  }
}
