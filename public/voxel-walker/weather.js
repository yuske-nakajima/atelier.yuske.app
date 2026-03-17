// @ts-check

/**
 * Open-Meteo API からの天気データ取得・状態管理
 */

/** @typedef {{ temperature: number, humidity: number, precipitation: number, rain: number, snowfall: number, weatherCode: number, cloudCover: number, windSpeed: number, windDirection: number, pressure: number }} WeatherData */

const API_BASE = 'https://api.open-meteo.com/v1/forecast';

const FETCH_PARAMS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation',
  'rain',
  'snowfall',
  'weather_code',
  'cloud_cover',
  'wind_speed_10m',
  'wind_direction_10m',
  'surface_pressure',
].join(',');

/** @returns {WeatherData} */
function createDefaultWeather() {
  return {
    temperature: 20,
    humidity: 50,
    precipitation: 0,
    rain: 0,
    snowfall: 0,
    weatherCode: 0,
    cloudCover: 30,
    windSpeed: 5,
    windDirection: 180,
    pressure: 1013,
  };
}

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
 * @param {WeatherData} a
 * @param {WeatherData} b
 * @param {number} t
 * @returns {WeatherData}
 */
function lerpWeather(a, b, t) {
  return {
    temperature: lerp(a.temperature, b.temperature, t),
    humidity: lerp(a.humidity, b.humidity, t),
    precipitation: lerp(a.precipitation, b.precipitation, t),
    rain: lerp(a.rain, b.rain, t),
    snowfall: lerp(a.snowfall, b.snowfall, t),
    weatherCode: t < 0.5 ? a.weatherCode : b.weatherCode,
    cloudCover: lerp(a.cloudCover, b.cloudCover, t),
    windSpeed: lerp(a.windSpeed, b.windSpeed, t),
    windDirection: lerp(a.windDirection, b.windDirection, t),
    pressure: lerp(a.pressure, b.pressure, t),
  };
}

/**
 * @param {object} current - API レスポンスの current オブジェクト
 * @returns {WeatherData}
 */
function parseApiResponse(current) {
  return {
    temperature: current.temperature_2m ?? 20,
    humidity: current.relative_humidity_2m ?? 50,
    precipitation: current.precipitation ?? 0,
    rain: current.rain ?? 0,
    snowfall: current.snowfall ?? 0,
    weatherCode: current.weather_code ?? 0,
    cloudCover: current.cloud_cover ?? 30,
    windSpeed: current.wind_speed_10m ?? 5,
    windDirection: current.wind_direction_10m ?? 180,
    pressure: current.surface_pressure ?? 1013,
  };
}

export class WeatherManager {
  constructor() {
    /** @type {WeatherData} */
    this.previous = createDefaultWeather();
    /** @type {WeatherData} */
    this.target = createDefaultWeather();
    /** @type {WeatherData} */
    this.current = createDefaultWeather();
    this.transitionStart = 0;
    this.transitionDuration = 12000;
    this.lastFetchTime = 0;
    this.fetchInterval = 60000;
  }

  /**
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<void>}
   */
  async fetch(lat, lng) {
    try {
      const url = `${API_BASE}?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=${FETCH_PARAMS}&forecast_days=1`;
      const res = await globalThis.fetch(url);
      if (!res.ok) return;

      const json = await res.json();
      if (!json.current) return;

      this.previous = { ...this.current };
      this.target = parseApiResponse(json.current);
      this.transitionStart = performance.now();
    } catch {
      // フェッチ失敗時は前回データを保持
    }
  }

  /**
   * @param {number} now - performance.now()
   * @param {number} lat
   * @param {number} lng
   * @returns {WeatherData}
   */
  update(now, lat, lng) {
    // 定期フェッチ
    if (now - this.lastFetchTime > this.fetchInterval) {
      this.lastFetchTime = now;
      this.fetch(lat, lng);
    }

    // lerp 補間
    const elapsed = now - this.transitionStart;
    const t = Math.min(elapsed / this.transitionDuration, 1);
    this.current = lerpWeather(this.previous, this.target, t);

    return this.current;
  }
}
