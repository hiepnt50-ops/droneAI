/**
 * Evaluator and simulator for the 3 new Challenge Types:
 * 1. Hash Grid Challenge (#): Orbit poles, Draw strokes, or Install poles
 * 2. Pinwheel Challenge: Wind-driven rotation from drone prop downwash
 * 3. Stick Push Challenge: 2D physics push toward target zone
 */

import {
  DroneState,
  FieldObstacle,
  FlightPathPoint,
  HashGridConfig,
  Vector3D,
} from '../types/drone';

export interface HashPolesLayout {
  poles: Array<{
    id: string;
    index: number; // 1, 2, 3, 4
    x: number;
    y: number;
    isInstalled: boolean;
  }>;
  lines: Array<{
    id: string;
    name: string;
    p1: { x: number; y: number };
    p2: { x: number; y: number };
  }>;
}

export const DEFAULT_HASH_CONFIG: HashGridConfig = {
  centerX: 150,
  centerY: 150,
  squareSideA: 60,
  armExtension: 30,
  mode: 'orbit_poles',
  minOrbitAngleDeg: 270,
  forbiddenRadiusCm: 15,
  strokeToleranceCm: 15,
  hoverInstallTimeSec: 3,
  hoverInstallToleranceCm: 10,
};

/**
 * Compute the 4 pole positions and 4 reference lines for the '#' grid
 */
export function computeHashLayout(config: HashGridConfig): HashPolesLayout {
  const halfA = config.squareSideA / 2;
  const ext = config.armExtension;

  // 4 poles at square vertices
  // Pole 1: Top-left (-halfA, +halfA) -> (centerX - halfA, centerY + halfA)
  // Pole 2: Top-right (+halfA, +halfA) -> (centerX + halfA, centerY + halfA)
  // Pole 3: Bottom-right (+halfA, -halfA) -> (centerX + halfA, centerY - halfA)
  // Pole 4: Bottom-left (-halfA, -halfA) -> (centerX - halfA, centerY - halfA)
  const xLeft = config.centerX - halfA;
  const xRight = config.centerX + halfA;
  const yBottom = config.centerY - halfA;
  const yTop = config.centerY + halfA;

  const poles = [
    { id: 'hash_pole_1', index: 1, x: xLeft, y: yTop, isInstalled: true },
    { id: 'hash_pole_2', index: 2, x: xRight, y: yTop, isInstalled: true },
    { id: 'hash_pole_3', index: 3, x: xRight, y: yBottom, isInstalled: true },
    { id: 'hash_pole_4', index: 4, x: xLeft, y: yBottom, isInstalled: true },
  ];

  // 4 hash lines: 2 horizontal lines, 2 vertical lines extending out by `ext` cm
  const lines = [
    // Line 1 (Horizontal Top): through yTop, from xLeft - ext to xRight + ext
    {
      id: 'stroke_1',
      name: 'Nét 1 (Ngang trên)',
      p1: { x: xLeft - ext, y: yTop },
      p2: { x: xRight + ext, y: yTop },
    },
    // Line 2 (Horizontal Bottom): through yBottom, from xLeft - ext to xRight + ext
    {
      id: 'stroke_2',
      name: 'Nét 2 (Ngang dưới)',
      p1: { x: xLeft - ext, y: yBottom },
      p2: { x: xRight + ext, y: yBottom },
    },
    // Line 3 (Vertical Left): through xLeft, from yBottom - ext to yTop + ext
    {
      id: 'stroke_3',
      name: 'Nét 3 (Dọc trái)',
      p1: { x: xLeft, y: yBottom - ext },
      p2: { x: xLeft, y: yTop + ext },
    },
    // Line 4 (Vertical Right): through xRight, from yBottom - ext to yTop + ext
    {
      id: 'stroke_4',
      name: 'Nét 4 (Dọc phải)',
      p1: { x: xRight, y: yBottom - ext },
      p2: { x: xRight, y: yTop + ext },
    },
  ];

  return { poles, lines };
}

// -------------------------------------------------------------
// EVALUATION RESULTS
// -------------------------------------------------------------

export interface HashEvalResult {
  completed: boolean;
  scorePercent: number;
  mode: HashGridConfig['mode'];
  // For orbit:
  polesAnglesDeg: number[];
  forbiddenViolated: boolean;
  // For strokes:
  strokesCompleted: boolean[];
  // For install:
  installedPoles: boolean[];
  message: string;
}

export interface PinwheelEvalResult {
  completed: boolean;
  rotationsAchieved: number;
  targetRotations: number;
  currentSpeedDegS: number;
  inDownwashCone: boolean;
  message: string;
}

export interface StickPushEvalResult {
  completed: boolean;
  stickPosition: { x: number; y: number; z: number };
  targetCenter: { x: number; y: number };
  distanceToTargetCm: number;
  inTargetZone: boolean;
  pushCount: number;
  isOffTable: boolean;
  message: string;
}

/**
 * 1. Evaluate Hash Grid Challenge (#) from flight path
 */
export function evaluateHashChallenge(
  path: FlightPathPoint[],
  config: HashGridConfig,
  currentObstacles: FieldObstacle[]
): HashEvalResult {
  const layout = computeHashLayout(config);

  if (config.mode === 'orbit_poles') {
    // Mode A: Bay quanh từng cột (1 -> 4), mỗi cột quét >= minOrbitAngleDeg (270°), không vào vùng cấm
    const polesAnglesDeg = [0, 0, 0, 0];
    let forbiddenViolated = false;

    // Check forbidden zone violation for any point
    for (const pt of path) {
      for (const p of layout.poles) {
        const d = Math.hypot(pt.actual.x - p.x, pt.actual.y - p.y);
        if (d < config.forbiddenRadiusCm && pt.actual.z < 120) {
          forbiddenViolated = true;
        }
      }
    }

    // Cumulative polar angle swept around each pole
    for (let pIdx = 0; pIdx < 4; pIdx++) {
      const p = layout.poles[pIdx];
      let prevAngle: number | null = null;
      let totalAngle = 0;

      for (const pt of path) {
        const d = Math.hypot(pt.actual.x - p.x, pt.actual.y - p.y);
        // Only count when in reasonable proximity (e.g. 15cm to 60cm)
        if (d >= config.forbiddenRadiusCm && d <= 70 && pt.actual.z > 20) {
          const a = Math.atan2(pt.actual.y - p.y, pt.actual.x - p.x);
          if (prevAngle !== null) {
            let diff = a - prevAngle;
            while (diff > Math.PI) diff -= 2 * Math.PI;
            while (diff < -Math.PI) diff += 2 * Math.PI;
            totalAngle += Math.abs(diff);
          }
          prevAngle = a;
        } else {
          prevAngle = null;
        }
      }
      polesAnglesDeg[pIdx] = Math.round((totalAngle * 180) / Math.PI);
    }

    const passedPoles = polesAnglesDeg.filter(a => a >= config.minOrbitAngleDeg).length;
    const completed = passedPoles === 4 && !forbiddenViolated;
    const scorePercent = Math.min(100, Math.round((passedPoles / 4) * 100));

    return {
      completed,
      scorePercent,
      mode: 'orbit_poles',
      polesAnglesDeg,
      forbiddenViolated,
      strokesCompleted: [false, false, false, false],
      installedPoles: [true, true, true, true],
      message: forbiddenViolated
        ? 'Phạm lỗi: Drone đi vào vùng cấm quanh cột (< 15 cm)!'
        : completed
        ? 'Xuất sắc: Đã bay quét quanh đủ 4 cột mốc dấu thăng!'
        : `Đã hoàn thành ${passedPoles}/4 cột (cần góc quét ≥ ${config.minOrbitAngleDeg}° mỗi cột).`,
    };
  } else if (config.mode === 'draw_strokes') {
    // Mode B: Bay theo 4 nét liên tiếp (sai số ± strokeToleranceCm)
    const strokesCompleted = [false, false, false, false];

    // For each stroke line, verify if drone traversed from near p1 to near p2 within tolerance
    for (let sIdx = 0; sIdx < 4; sIdx++) {
      const stroke = layout.lines[sIdx];
      const p1 = stroke.p1;
      const p2 = stroke.p2;
      const length = Math.hypot(p2.x - p1.x, p2.y - p1.y);

      let visitedStart = false;
      let visitedEnd = false;
      let minDeviation = 999;

      for (const pt of path) {
        if (pt.actual.z < 20) continue; // must be flying

        const d1 = Math.hypot(pt.actual.x - p1.x, pt.actual.y - p1.y);
        const d2 = Math.hypot(pt.actual.x - p2.x, pt.actual.y - p2.y);

        if (d1 <= config.strokeToleranceCm * 1.5) visitedStart = true;
        if (visitedStart && d2 <= config.strokeToleranceCm * 1.5) visitedEnd = true;

        // Point-line distance
        const cross = Math.abs((p2.y - p1.y) * pt.actual.x - (p2.x - p1.x) * pt.actual.y + p2.x * p1.y - p2.y * p1.x);
        const distToLine = cross / length;
        if (distToLine < minDeviation) {
          minDeviation = distToLine;
        }
      }

      strokesCompleted[sIdx] = visitedStart && visitedEnd && minDeviation <= config.strokeToleranceCm;
    }

    const passedCount = strokesCompleted.filter(Boolean).length;
    const completed = passedCount === 4;

    return {
      completed,
      scorePercent: Math.round((passedCount / 4) * 100),
      mode: 'draw_strokes',
      polesAnglesDeg: [0, 0, 0, 0],
      forbiddenViolated: false,
      strokesCompleted,
      installedPoles: [true, true, true, true],
      message: completed
        ? 'Hoàn thành tuyệt đối: Đã vẽ trọn vẹn 4 nét dấu thăng (#)!'
        : `Tiến độ nét vẽ: ${passedCount}/4 nét (sai số cho phép ±${config.strokeToleranceCm}cm).`,
    };
  } else {
    // Mode C: Chế độ "Lắp cột": Drone hover tại vị trí chân đế trống trong 3s để lắp
    const installedPoles = [false, false, false, false];

    for (let pIdx = 0; pIdx < 4; pIdx++) {
      const targetP = layout.poles[pIdx];

      // Time spent hovering within tolerance
      let hoverTime = 0;
      let lastTime: number | null = null;

      for (const pt of path) {
        const dist = Math.hypot(pt.actual.x - targetP.x, pt.actual.y - targetP.y);
        if (dist <= config.hoverInstallToleranceCm && pt.actual.z >= 20 && pt.actual.z <= 90) {
          if (lastTime !== null) {
            hoverTime += Math.max(0, pt.time - lastTime);
          }
          lastTime = pt.time;
        } else {
          lastTime = null;
        }
      }

      installedPoles[pIdx] = hoverTime >= config.hoverInstallTimeSec;
    }

    const installedCount = installedPoles.filter(Boolean).length;
    const completed = installedCount === 4;

    return {
      completed,
      scorePercent: Math.round((installedCount / 4) * 100),
      mode: 'install_poles',
      polesAnglesDeg: [0, 0, 0, 0],
      forbiddenViolated: false,
      strokesCompleted: [false, false, false, false],
      installedPoles,
      message: completed
        ? 'Thành công: Đã lắp đặt chuẩn xác cả 4 cột dấu thăng!'
        : `Đã lắp xong ${installedCount}/4 cột mốc (hover ≥ ${config.hoverInstallTimeSec}s tại mỗi chân đế).`,
    };
  }
}

/**
 * 2. Update and evaluate Pinwheel physics step
 * Drone prop downwash rotates pinwheel when hovering above in conical zone
 */
export function stepPinwheelPhysics(
  pinwheel: FieldObstacle,
  drone: DroneState,
  deltaTimeSec: number
): {
  updatedPinwheel: FieldObstacle;
  collidedWithBlades: boolean;
  inCone: boolean;
} {
  const bladeZ = pinwheel.z + (pinwheel.height || 60);
  const bladeR = pinwheel.bladeRadius || 10;
  const targetRots = pinwheel.targetRotations || 3;
  let curRotations = pinwheel.currentRotations || 0;
  let curSpeed = pinwheel.currentRotationSpeedDegS || 0;

  // Horizontal distance to center
  const distXY = Math.hypot(drone.position.x - pinwheel.x, drone.position.y - pinwheel.y);
  // Vertical elevation above blades
  const dz = drone.position.z - bladeZ;

  // Collision with blades: drone within blade radius and within 5cm elevation of blades
  const collidedWithBlades = distXY <= bladeR + 10 && Math.abs(dz) < 6 && drone.isFlying;

  // Downwash cone condition: drone is 15cm to 60cm above blades, horizontal offset <= 15cm
  const inCone = drone.isFlying && dz >= 15 && dz <= 60 && distXY <= 15;

  if (inCone) {
    // Optimal height is 25cm to 40cm above blades
    const heightFactor = Math.max(0.2, 1 - Math.abs(dz - 30) / 30);
    const xyFactor = Math.max(0.2, 1 - distXY / 15);
    const targetSpeed = 360 * heightFactor * xyFactor; // max 360 deg/s

    // Accelerate toward target speed
    curSpeed += (targetSpeed - curSpeed) * Math.min(1, deltaTimeSec * 3);
  } else {
    // Decelerate due to friction
    curSpeed = Math.max(0, curSpeed - 120 * deltaTimeSec);
  }

  // Accumulate rotations
  curRotations += (curSpeed * deltaTimeSec) / 360;

  const updatedPinwheel: FieldObstacle = {
    ...pinwheel,
    currentRotations: curRotations,
    currentRotationSpeedDegS: curSpeed,
  };

  return {
    updatedPinwheel,
    collidedWithBlades,
    inCone,
  };
}

/**
 * 3. Update and evaluate Stick Push Physics step
 * 2D sliding friction simulation with collision impulse from drone
 */
export function stepStickPhysics(
  stick: FieldObstacle,
  targetZone: FieldObstacle | undefined,
  drone: DroneState,
  deltaTimeSec: number,
  fieldW = 300,
  fieldH = 300
): {
  updatedStick: FieldObstacle;
  isPushedThisStep: boolean;
  isInTargetZone: boolean;
  isOffTable: boolean;
} {
  const stickLen = stick.length || 40;
  const stickDiam = stick.diameter || 3;
  const stickElev = stick.z || 0;
  let stickX = stick.x;
  let stickY = stick.y;
  let vx = stick.velocityX || 0;
  let vy = stick.velocityY || 0;
  let angVel = stick.angularVelocityDegS || 0;
  let angle = stick.angleDeg || 0;
  let pushCount = stick.pushCount || 0;
  const friction = stick.frictionCoeff || 0.8;

  const droneRadius = 10;
  const droneSpeed = Math.hypot(drone.velocity.x, drone.velocity.y);

  // Check 2D segment collision between drone circle and stick line
  const rad = (angle * Math.PI) / 180;
  const halfL = stickLen / 2;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  const p1 = { x: stickX - halfL * cosA, y: stickY - halfL * sinA };
  const p2 = { x: stickX + halfL * cosA, y: stickY + halfL * sinA };

  // Drone altitude lower than top of stick (e.g. z <= stickElev + stickDiam + 25)
  const isDroneAtPushHeight = drone.position.z >= stickElev && drone.position.z <= stickElev + 35;

  let isPushedThisStep = false;

  if (isDroneAtPushHeight && drone.isFlying) {
    // Distance from drone to stick line segment
    const segDx = p2.x - p1.x;
    const segDy = p2.y - p1.y;
    const segLenSq = segDx * segDx + segDy * segDy;

    let t = ((drone.position.x - p1.x) * segDx + (drone.position.y - p1.y) * segDy) / segLenSq;
    t = Math.max(0, Math.min(1, t));

    const closestX = p1.x + t * segDx;
    const closestY = p1.y + t * segDy;

    const distToStick = Math.hypot(drone.position.x - closestX, drone.position.y - closestY);

    if (distToStick < droneRadius + stickDiam / 2 + 2) {
      isPushedThisStep = true;
      pushCount += 1;

      // Impulse direction: push along drone velocity vector, or away from drone center
      let pushDirX = drone.velocity.x;
      let pushDirY = drone.velocity.y;
      if (Math.hypot(pushDirX, pushDirY) < 5) {
        pushDirX = closestX - drone.position.x;
        pushDirY = closestY - drone.position.y;
      }

      const pLen = Math.hypot(pushDirX, pushDirY) || 1;
      const speedMagnitude = Math.max(25, droneSpeed * 1.2);

      vx = (pushDirX / pLen) * speedMagnitude;
      vy = (pushDirY / pLen) * speedMagnitude;

      // Off-center torque (t around 0.5 is center)
      const offsetFromCenter = t - 0.5; // -0.5 to +0.5
      angVel = offsetFromCenter * 180;
    }
  }

  // Integrate position with friction deceleration
  stickX += vx * deltaTimeSec;
  stickY += vy * deltaTimeSec;
  angle += angVel * deltaTimeSec;

  // Apply friction damping
  const decay = Math.max(0, 1 - friction * 2.5 * deltaTimeSec);
  vx *= decay;
  vy *= decay;
  angVel *= decay;

  if (Math.hypot(vx, vy) < 0.5) {
    vx = 0;
    vy = 0;
  }
  if (Math.abs(angVel) < 0.5) {
    angVel = 0;
  }

  // Boundary checks (table dimensions)
  const isOffTable = stickX < 5 || stickX > fieldW - 5 || stickY < 5 || stickY > fieldH - 5;

  // Target zone check
  let isInTargetZone = false;
  if (targetZone) {
    const tzRadius = targetZone.radius || 25;
    const distToTz = Math.hypot(stickX - targetZone.x, stickY - targetZone.y);
    isInTargetZone = distToTz <= tzRadius;
  }

  const updatedStick: FieldObstacle = {
    ...stick,
    x: stickX,
    y: stickY,
    angleDeg: Math.round(angle) % 360,
    velocityX: vx,
    velocityY: vy,
    angularVelocityDegS: angVel,
    pushCount,
  };

  return {
    updatedStick,
    isPushedThisStep,
    isInTargetZone,
    isOffTable,
  };
}
