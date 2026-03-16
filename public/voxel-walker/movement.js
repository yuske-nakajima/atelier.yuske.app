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
function lerp(a, b, t) {
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
    this.currentAngle = 0;
    this.targetAngle = 0;
    // 移動速度（度/秒）
    this.speed = 0.02;
    this.noiseOffset = Math.random() * 1000;
  }

  /**
   * @param {number} windDirection - 風向（度、北=0、時計回り）
   * @param {number} windSpeed - 風速（m/s）
   * @param {number} deltaTime - 経過秒数
   */
  update(windDirection, windSpeed, deltaTime) {
    // ノイズ揺らぎ: ゆっくり変化（1分程度で方向転換）
    this.noiseOffset += deltaTime * 0.02;
    const noiseAmount = 10 / (1 + windSpeed * 0.3);
    const noise = Math.sin(this.noiseOffset) * noiseAmount;

    // 風向をベースに揺らぎを加えた目標角度
    this.targetAngle = windDirection + noise;

    // 現在角度を目標に向けてゆっくり補間
    // 1フレームあたり最大2度まで（急旋回を防止）
    const angleDiff = normalizeDeg(this.targetAngle - this.currentAngle);
    const maxTurnPerSec = 2;
    const maxTurn = maxTurnPerSec * deltaTime;
    const turn = Math.max(-maxTurn, Math.min(maxTurn, angleDiff * 0.02));
    this.currentAngle += turn;

    // 速度: 風速で増減（基本速度を高めに設定し、ずんずん進む）
    this.speed = 0.75 * (1 + windSpeed / 10);

    // 位置を更新
    const rad = (this.currentAngle * Math.PI) / 180;
    this.lat += Math.cos(rad) * this.speed * deltaTime;
    this.lng += Math.sin(rad) * this.speed * deltaTime;

    // 緯度: クランプ（極で折り返し）
    if (this.lat > 85) {
      this.lat = 85 - (this.lat - 85);
      this.currentAngle = normalizeDeg(this.currentAngle + 180);
    }
    if (this.lat < -85) {
      this.lat = -85 - (this.lat + 85);
      this.currentAngle = normalizeDeg(this.currentAngle + 180);
    }

    // 経度: ラップアラウンド
    if (this.lng > 180) this.lng -= 360;
    if (this.lng < -180) this.lng += 360;
  }
}
