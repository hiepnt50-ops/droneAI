/**
 * Physics and Sensor Simulation Engine for WhalesBot Eagle 1003
 */

import {
  CalibrationConfig,
  DroneState,
  FieldObstacle,
  SensorPortsMap,
  TagGridConfig,
  Vector3D,
} from '../types/drone';

// Seeded PRNG
export class PRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  // Mulberry32
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Gaussian standard normal distribution (Box-Muller)
  gaussian(mean = 0, stdDev = 1): number {
    const u1 = Math.max(1e-7, this.next());
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }
}

export const DEFAULT_CALIBRATION: CalibrationConfig = {
  defaultSpeed: 50, // cm/s
  maxSpeed: 100, // cm/s
  takeoffSpeed: 40, // cm/s
  landingSpeed: 30, // cm/s
  turnSpeed: 90, // deg/s
  distanceFactor: 1.0,
  distanceStdDevCm: 2.0,
  yawErrorDeg: 2.0,
  hoverDriftRate: 1.5, // cm / sqrt(s)
  tagTrackingErrorCm: 2.0,
  fieldWidthCm: 300,
  fieldHeightCm: 300,
  axisConvention: 'forward_left_up',
  windEnabled: false,
  windDirectionDeg: 90, // East
  windSpeedCmS: 15,
  seed: 42,
  useSeed: false,
};

export const DEFAULT_TAG_GRID: TagGridConfig = {
  tagsPerRow: 20,
  spacingCm: 30,
  offsetFromEdgeCm: 30,
};

export const DEFAULT_SENSOR_PORTS: SensorPortsMap = {
  P1: { type: 'ir_ranging', direction: 'front' },
  P2: { type: 'ultrasonic', direction: 'front' },
  P3: { type: 'ir_obstacle', direction: 'left' },
  P4: { type: 'human_ir', direction: 'front' },
};

// Initial Start Pad position: bottom-left corner 30x30 cm
// Start center is at (15, 15, 0)
export const START_PAD_SIZE = 30; // cm
export const START_POSITION: Vector3D = { x: 15, y: 15, z: 0 };

export function createInitialDroneState(): DroneState {
  return {
    isUnlocked: false,
    isFlying: false,
    isHovering: false,
    isEmergencyStopped: false,
    position: { ...START_POSITION },
    yaw: 0, // facing +Y (forward)
    pitch: 0,
    roll: 0,
    speed: DEFAULT_CALIBRATION.defaultSpeed,
    velocity: { x: 0, y: 0, z: 0 },
    angularSpeed: 0,
    acceleration: { x: 0, y: 0, z: 1.0 },
    rcChannels: {
      pitch: 50,
      roll: 50,
      throttle: 50,
      yaw: 50,
    },
    continuousMotion: null,
    batteryVoltage: 4.2,
    batteryPercent: 100,
    boardTemp: 34.5,
    flightTimeSeconds: 0,
    headlightOn: false,
    headlightBrightness: 100,
    rgbColor: { r: 0, g: 255, b: 120 },
    dotMatrix: Array(8).fill(null).map(() => Array(8).fill(false)),
    dotMatrixSymbol: 'off',
    nixieTubeValue: '0000',
    electromagnet: 'off',
    servoPort: 'P2',
    servoSpeed: 40,
    servoAngle: 90,
    cameraExposure: 1000,
    lastPhotoTakenAt: null,
    detectedTagId: -1,
    tagConfidence: 0,
    tagLossCount: 0,
    laserAltitudeCm: 0,
    laserExternalMm: 0,
    ultrasonicCm: 0,
    irDistanceCm: 80,
    irObstacleDetected: false,
    irHumanDetected: false,
    flameDetected: false,
    ambientTemp: 26.0,
    humidity: 62.0,
    lightLevelLux: 350,
    gestureCode: 0,
    rcButton: 'none',
    opticalFlow: { dx: 0, dy: 0 },
    laserAltitudeEnabled: true,
    portReadings: {
      P1: { analogVal: 512, distanceCm: 80, obstacle: false, human: false },
      P2: { analogVal: 512, distanceCm: 80, obstacle: false, human: false },
      P3: { analogVal: 512, distanceCm: 80, obstacle: false, human: false },
      P4: { analogVal: 512, distanceCm: 80, obstacle: false, human: false },
    },
    debugLogs: [],
  };
}

export function computeTagCoordinates(id: number, config: TagGridConfig): { x: number; y: number } {
  const col = id % config.tagsPerRow;
  const row = Math.floor(id / config.tagsPerRow);
  return {
    x: config.offsetFromEdgeCm + col * config.spacingCm,
    y: config.offsetFromEdgeCm + row * config.spacingCm,
  };
}

export function getAllTags(
  config: TagGridConfig,
  fieldW = 300,
  fieldH = 300
): Array<{ id: number; x: number; y: number }> {
  const totalTags = config.tagsPerRow * config.tagsPerRow;
  const tags = [];
  for (let i = 0; i < totalTags; i++) {
    const coords = computeTagCoordinates(i, config);
    // Only include tags strictly within the field boundary
    if (coords.x >= 0 && coords.x <= fieldW && coords.y >= 0 && coords.y <= fieldH) {
      tags.push({ id: i, ...coords });
    }
  }
  return tags;
}

/**
 * Check if camera detects an AprilTag directly beneath drone.
 * Camera rule:
 * 1. Altitude must be between 50 cm and 150 cm.
 * 2. Drone XY must be within tag reach radius (~25 cm).
 */
export function checkTagDetection(
  dronePos: Vector3D,
  tagConfig: TagGridConfig,
  targetTagId?: number,
  fieldW = 300,
  fieldH = 300
): { detected: boolean; tagId: number; distanceCm: number } {
  if (dronePos.z < 50 || dronePos.z > 150) {
    return { detected: false, tagId: -1, distanceCm: 999 };
  }

  const tags = getAllTags(tagConfig, fieldW, fieldH);
  let closestTag: { id: number; x: number; y: number } | null = null;
  let minDistance = Infinity;

  for (const tag of tags) {
    if (targetTagId !== undefined && tag.id !== targetTagId) continue;
    const dist = Math.hypot(dronePos.x - tag.x, dronePos.y - tag.y);
    if (dist < minDistance) {
      minDistance = dist;
      closestTag = tag;
    }
  }

  if (closestTag && minDistance <= 25) {
    return { detected: true, tagId: closestTag.id, distanceCm: minDistance };
  }

  return { detected: false, tagId: -1, distanceCm: minDistance };
}

/**
 * Smooth ease-in-out cubic interpolation
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Check boundary and obstacle collisions
 */
export function checkCollision(
  pos: Vector3D,
  obstacles: FieldObstacle[],
  fieldW = 300,
  fieldH = 300
): { collided: boolean; reason?: string } {
  const droneRadius = 8; // cm
  if (pos.x < droneRadius || pos.x > fieldW - droneRadius) {
    return { collided: true, reason: `Drone va chạm ranh giới sân theo trục X (${pos.x.toFixed(1)} cm)` };
  }
  if (pos.y < droneRadius || pos.y > fieldH - droneRadius) {
    return { collided: true, reason: `Drone va chạm ranh giới sân theo trục Y (${pos.y.toFixed(1)} cm)` };
  }
  if (pos.z > 250) {
    return { collided: true, reason: `Drone vượt quá trần bay cho phép (${pos.z.toFixed(1)} cm / 250 cm)` };
  }

  for (const obs of obstacles) {
    if (obs.type === 'pole') {
      const radius = obs.radius || 6;
      const dist = Math.hypot(pos.x - obs.x, pos.y - obs.y);
      if (dist < radius + droneRadius && pos.z >= obs.z && pos.z <= obs.z + obs.height) {
        return { collided: true, reason: `Va chạm với cột '${obs.name}'` };
      }
    } else if (obs.type === 'hoop') {
      const outerR = obs.radius || 22;
      const innerR = obs.innerRadius || 16;
      const centerZ = obs.centerZ || obs.z + outerR;
      const distXY = Math.hypot(pos.x - obs.x, pos.y - obs.y);
      const distZ = Math.abs(pos.z - centerZ);
      const distCenter = Math.hypot(distXY, distZ);

      if (distCenter >= innerR - droneRadius && distCenter <= outerR + droneRadius) {
        return { collided: true, reason: `Va chạm vành vòng bay '${obs.name}'` };
      }
    } else if (obs.type === 'barrier' || obs.type === 'cube' || obs.type === 'human') {
      const halfW = (obs.width || 20) / 2 + droneRadius;
      const halfD = (obs.depth || 20) / 2 + droneRadius;
      const minZ = obs.z;
      const maxZ = obs.z + obs.height;

      if (
        Math.abs(pos.x - obs.x) <= halfW &&
        Math.abs(pos.y - obs.y) <= halfD &&
        pos.z >= minZ &&
        pos.z <= maxZ
      ) {
        return { collided: true, reason: `Va chạm với vật cản '${obs.name}'` };
      }
    } else if (obs.type === 'pinwheel') {
      // Pinwheel stand & blades collision
      const bladeZ = obs.z + (obs.height || 60);
      const bladeR = obs.bladeRadius || 10;
      const distXY = Math.hypot(pos.x - obs.x, pos.y - obs.y);
      // Stand collision
      if (distXY < 5 + droneRadius && pos.z >= obs.z && pos.z < bladeZ) {
        return { collided: true, reason: `Va chạm với giá đỡ chong chóng '${obs.name}'` };
      }
      // Blades collision: touching spinning blades
      if (distXY <= bladeR + droneRadius && Math.abs(pos.z - bladeZ) <= 5) {
        return { collided: true, reason: `Va chạm cánh chong chóng '${obs.name}'!` };
      }
    } else if (obs.type === 'stick' || obs.type === 'target_zone') {
      // In stick push challenge, touching the stick is intentional physics interaction, NOT an error
      continue;
    }
  }

  return { collided: false };
}

/**
 * Update sensor readings based on drone location, environment, and port configs
 */
export function updateSensors(
  drone: DroneState,
  obstacles: FieldObstacle[],
  portsConfig: SensorPortsMap,
  prng: PRNG,
  tagConfig?: TagGridConfig,
  fieldW = 300,
  fieldH = 300
): void {
  // Laser altitude
  // Battery voltage drops from 4.2V down to 3.3V over 10 minutes (600s)
  const flightRatio = Math.min(1, Math.max(0, drone.flightTimeSeconds / 600));
  drone.batteryPercent = Math.max(0, Math.round((1 - flightRatio) * 100));
  drone.batteryVoltage = Math.round((4.2 - flightRatio * (4.2 - 3.3)) * 100) / 100;

  // Laser altitude inside fuselage (ToF downward)
  drone.laserAltitudeCm = Math.max(0, drone.position.z + prng.gaussian(0, 0.2));
  drone.ultrasonicCm = Math.min(300, Math.max(5, drone.position.z + prng.gaussian(0, 0.4)));
  drone.laserExternalMm = Math.round(drone.laserAltitudeCm * 10);

  // Optical flow
  drone.opticalFlow = {
    dx: drone.velocity.x + prng.gaussian(0, 0.2),
    dy: drone.velocity.y + prng.gaussian(0, 0.2),
  };

  // Acceleration (1g on Z, plus dynamic motion components)
  drone.acceleration = {
    x: Math.round(((drone.velocity.x / 50) * 0.15 + prng.gaussian(0, 0.02)) * 100) / 100,
    y: Math.round(((drone.velocity.y / 50) * 0.15 + prng.gaussian(0, 0.02)) * 100) / 100,
    z: Math.round((1.0 + (drone.velocity.z / 40) * 0.2 + prng.gaussian(0, 0.03)) * 100) / 100,
  };

  // Real-time AprilTag recognition update if tag grid is provided
  if (tagConfig) {
    const tagCheck = checkTagDetection(drone.position, tagConfig, undefined, fieldW, fieldH);
    if (tagCheck.detected) {
      drone.detectedTagId = tagCheck.tagId;
      drone.tagConfidence = 96;
    } else {
      drone.detectedTagId = -1;
      drone.tagConfidence = 0;
    }
  }

  // Heading ray for internal front IR sensor
  const forwardRad = (drone.yaw * Math.PI) / 180;
  const forwardDir = { x: Math.sin(forwardRad), y: Math.cos(forwardRad) };

  let minObsDistance = 80;
  let humanDetected = false;
  let flameDetected = false;

  for (const obs of obstacles) {
    const dx = obs.x - drone.position.x;
    const dy = obs.y - drone.position.y;
    const dist = Math.hypot(dx, dy);

    const dot = (dx * forwardDir.x + dy * forwardDir.y) / (dist || 1);

    if (dist <= 80 && dot > 0.6 && Math.abs(drone.position.z - (obs.z + obs.height / 2)) < obs.height / 2 + 15) {
      if (dist < minObsDistance) {
        minObsDistance = dist;
      }
    }

    if (obs.type === 'human' && dist <= 120) {
      humanDetected = true;
    }

    if (obs.type === 'flame' && dist <= 80) {
      flameDetected = true;
    }
  }

  drone.irDistanceCm = Math.max(8, Math.min(80, Math.round(minObsDistance)));
  drone.irObstacleDetected = minObsDistance < 40;
  drone.irHumanDetected = humanDetected;
  drone.flameDetected = flameDetected;

  // Temperature and light
  drone.ambientTemp = flameDetected ? 38.5 : 26.0 + prng.gaussian(0, 0.2);
  drone.boardTemp = 34.0 + drone.flightTimeSeconds * 0.02 + (flameDetected ? 6.0 : 0);
  drone.lightLevelLux = flameDetected ? 850 : 350 + prng.gaussian(0, 5);

  // Update Port readings (P1 - P4) based on sensor type and direction
  const portIds: Array<'P1' | 'P2' | 'P3' | 'P4'> = ['P1', 'P2', 'P3', 'P4'];
  portIds.forEach(port => {
    const pCfg = portsConfig[port];
    let detectedDist = Infinity;
    let hasObs = false;
    let hasHuman = false;

    if (pCfg.direction === 'down') {
      detectedDist = drone.position.z;
      if (detectedDist < 40) hasObs = true;
    } else {
      let portAngleOffset = 0;
      if (pCfg.direction === 'back') portAngleOffset = 180;
      else if (pCfg.direction === 'left') portAngleOffset = -90;
      else if (pCfg.direction === 'right') portAngleOffset = 90;

      const sensorRad = ((drone.yaw + portAngleOffset) * Math.PI) / 180;
      const sDir = { x: Math.sin(sensorRad), y: Math.cos(sensorRad) };

      for (const obs of obstacles) {
        const dx = obs.x - drone.position.x;
        const dy = obs.y - drone.position.y;
        const d = Math.hypot(dx, dy);
        const dot = (dx * sDir.x + dy * sDir.y) / (d || 1);

        const obsZMin = obs.z;
        const obsZMax = obs.z + obs.height;
        const heightMatch = drone.position.z >= obsZMin - 10 && drone.position.z <= obsZMax + 10;

        if (dot > 0.65 && heightMatch) {
          if (d < detectedDist) detectedDist = d;
          if (d <= 40) hasObs = true;
          if (obs.type === 'human' && d <= 120) hasHuman = true;
        }
      }
    }

    // Format reading according to assigned sensor type
    let finalDist = 80;
    if (pCfg.type === 'ultrasonic') {
      finalDist = detectedDist === Infinity ? 300 : Math.max(5, Math.min(300, Math.round(detectedDist)));
    } else {
      // IR ranging: 8 - 80 cm
      finalDist = detectedDist === Infinity ? 80 : Math.max(8, Math.min(80, Math.round(detectedDist)));
    }

    const analogRaw = pCfg.type === 'analog'
      ? Math.round(Math.min(1023, Math.max(0, (finalDist / 150) * 1023)))
      : Math.round(512 + (finalDist / 150) * 511);

    drone.portReadings[port] = {
      analogVal: analogRaw,
      distanceCm: finalDist,
      obstacle: hasObs,
      human: hasHuman,
    };
  });
}
