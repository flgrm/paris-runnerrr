/**
 * Comportements des obstacles (GAME_DESIGN.md §5).
 *
 * Chaque comportement est une fonction pure appelée par Obstacle.update :
 * elle reçoit l'obstacle, sa définition, la vitesse de course et le delta,
 * et renvoie la vitesse horizontale à appliquer (en px/s, négative = vers la
 * gauche). La variété des comportements compte plus que le nombre d'obstacles.
 */

/** Décor fixe : avance exactement à la vitesse du décor. */
function staticBehaviour(obstacle, def, speed) {
  return -speed;
}

/** Trajectoire droite, vitesse propre constante (vélo, rat). */
function straight(obstacle, def, speed) {
  return -speed * def.speedMul;
}

/** Voiture : plus rapide que le décor, avec un freinage brusque possible. */
function car(obstacle, def, speed, delta) {
  if (obstacle.state.brakeTimer > 0) {
    obstacle.state.brakeTimer -= delta;
    return -speed * def.speedMul * def.brakeSpeedMul;
  }
  return -speed * def.speedMul;
}

/** Trottinette : accélérations irrégulières. */
function scooter(obstacle, def, speed, delta) {
  obstacle.state.phase += delta;
  const wave = Math.sin((obstacle.state.phase / def.surgePeriod) * Math.PI * 2);
  // Onde redressée : des poussées franches plutôt qu'un va-et-vient régulier.
  const surge = 1 + def.surgeAmplitude * Math.sign(wave) * wave * wave;
  return -speed * def.speedMul * surge;
}

/** Piéton : marche erratique, peut s'arrêter ou changer de sens. */
function pedestrian(obstacle, def, speed, delta) {
  const state = obstacle.state;
  state.decisionTimer -= delta;

  if (state.decisionTimer <= 0) {
    state.decisionTimer = def.stopDuration;
    const roll = Math.random();
    if (roll < def.stopChance) state.wander = 0;
    else if (roll < def.stopChance + def.turnChance) state.wander = -state.direction;
    else state.wander = state.direction;
  }

  if (state.stopTimer > 0) {
    state.stopTimer -= delta;
    return -speed;
  }

  return -speed + state.wander * def.wanderSpeed;
}

/**
 * Pigeon : oscille en vol, puis s'envole quand le coureur approche.
 * La verticale est gérée par l'obstacle (offsetY), pas par la vitesse rendue.
 */
function pigeon(obstacle, def, speed, delta, playerX) {
  const state = obstacle.state;
  state.phase += delta / 1000;

  if (!state.flying && obstacle.x - playerX < def.flyAwayDistance) {
    state.flying = true;
  }

  if (state.flying) {
    state.liftVelocity += def.flyAwaySpeed * (delta / 1000);
    obstacle.offsetY += state.liftVelocity * (delta / 1000);
  } else {
    obstacle.offsetY = Math.sin(state.phase * def.bobSpeed) * def.bobAmplitude;
  }

  return -speed * def.speedMul;
}

const BEHAVIOURS = {
  static: staticBehaviour,
  straight,
  car,
  scooter,
  pedestrian,
  pigeon,
};

export function getBehaviour(name) {
  return BEHAVIOURS[name] ?? staticBehaviour;
}

/** Prépare l'état interne d'un obstacle au moment du spawn. */
export function initBehaviourState(def) {
  return {
    phase: Math.random() * 1000,
    // Voiture : le freinage est tiré une fois pour toute la traversée.
    brakeTimer: def.behaviour === 'car' && Math.random() < (def.brakeChance ?? 0)
      ? def.brakeDuration
      : 0,
    // Piéton
    direction: Math.random() < 0.5 ? -1 : 1,
    wander: 0,
    decisionTimer: (def.stopDuration ?? 600) * Math.random(),
    stopTimer: 0,
    // Pigeon
    flying: false,
    liftVelocity: 0,
  };
}
