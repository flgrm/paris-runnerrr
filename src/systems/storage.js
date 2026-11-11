/**
 * Sauvegarde locale du record.
 *
 * localStorage peut lever (navigation privée iOS, cookies bloqués, quota) :
 * tout est encapsulé dans un try/catch et le jeu reste jouable sans sauvegarde
 * (GAME_DESIGN.md §4).
 */

import { STORAGE } from '../config.js';

function readNumber(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return 0;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeNumber(key, value) {
  try {
    window.localStorage.setItem(key, String(Math.floor(value)));
    return true;
  } catch {
    return false;
  }
}

export function getHighScore() {
  return readNumber(STORAGE.highScoreKey);
}

/**
 * Enregistre le score s'il bat le record.
 * @returns {boolean} vrai si c'est un nouveau record.
 */
export function submitScore(score) {
  const best = getHighScore();
  if (score <= best) return false;
  writeNumber(STORAGE.highScoreKey, score);
  return true;
}

export function getTotalCoins() {
  return readNumber(STORAGE.coinsKey);
}

export function addCoins(amount) {
  if (amount <= 0) return;
  writeNumber(STORAGE.coinsKey, getTotalCoins() + amount);
}
