/**
 * Types for WhalesBot Eagle 1003 Drone Simulator
 */

export interface Vector3D {
  x: number; // cm
  y: number; // cm
  z: number; // cm - altitude
}

export type SensorPortId = 'P1' | 'P2' | 'P3' | 'P4';
export type SensorPortType = 'none' | 'ir_ranging' | 'ir_obstacle' | 'human_ir' | 'ultrasonic' | 'analog';
export type SensorDirection = 'front' | 'back' | 'left' | 'right' | 'down';

export interface SensorPortConfig {
  type: SensorPortType;
  direction: SensorDirection;
}

export type SensorPortsMap = Record<SensorPortId, SensorPortConfig>;

export interface DroneState {
  // Flight state
  isUnlocked: boolean; // Entering pitch mode (vào chế độ bay)
  isFlying: boolean; // Đang trên không
  isHovering: boolean;
  isEmergencyStopped: boolean;
  
  // Spatial
  position: Vector3D; // cm
  yaw: number; // degrees: 0 = +Y (forward), 90 = +X (right), 180 = -Y (backward), 270 = -X (left)
  pitch: number; // degrees
  roll: number; // degrees
  
  // Motion
  speed: number; // cm/s (mặc định 50 cm/s)
  velocity: Vector3D; // cm/s
  angularSpeed: number; // deg/s
  acceleration: Vector3D; // X, Y, Z in 1g
  
  // Four-channel RC state (0-100, 50 neutral)
  rcChannels: {
    pitch: number;
    roll: number;
    throttle: number;
    yaw: number;
  };

  // Continuous flight mode
  continuousMotion: {
    active: boolean;
    speed: number;
    directionDeg: number;
  } | null;
  
  // Battery & Health
  batteryVoltage: number; // V (max 4.2V, min 3.3V)
  batteryPercent: number; // 0 - 100%
  boardTemp: number; // °C
  flightTimeSeconds: number;
  
  // Peripherals
  headlightOn: boolean;
  headlightBrightness: number; // 0 - 100
  rgbColor: { r: number; g: number; b: number };
  dotMatrix: boolean[][]; // 8x8 matrix
  dotMatrixSymbol: string;
  nixieTubeValue: string;
  electromagnet: 'off' | 'pull' | 'push';
  
  // Servo gear
  servoPort: string; // e.g. 'P2'
  servoSpeed: number;
  servoAngle: number;
  
  // Camera & AI
  cameraExposure: number; // default 1000
  lastPhotoTakenAt: number | null;
  detectedTagId: number | null; // -1 if not detected
  tagConfidence: number;
  tagLossCount: number;
  
  // Sensors
  laserAltitudeCm: number;
  laserExternalMm: number;
  ultrasonicCm: number;
  irDistanceCm: number;
  irObstacleDetected: boolean;
  irHumanDetected: boolean;
  flameDetected: boolean;
  ambientTemp: number; // °C
  humidity: number; // %
  lightLevelLux: number;
  gestureCode: number;
  rcButton: string;
  opticalFlow: { dx: number; dy: number };
  laserAltitudeEnabled: boolean;

  // Port sensors readings (P1 - P4)
  portReadings: Record<SensorPortId, {
    analogVal: number;
    distanceCm: number;
    obstacle: boolean;
    human: boolean;
  }>;
  
  // Debug output
  debugLogs: Array<{ id: string; time: number; message: string; type: 'info' | 'warn' | 'error' }>;
}

export type AxisConvention = 'forward_left_up' | 'right_forward_up';

export interface CalibrationConfig {
  defaultSpeed: number; // cm/s (mặc định 50)
  maxSpeed: number; // cm/s (mặc định 100)
  takeoffSpeed: number; // cm/s (mặc định 40)
  landingSpeed: number; // cm/s (mặc định 30)
  turnSpeed: number; // deg/s (mặc định 90)
  distanceFactor: number; // thật/lệnh (mặc định 1.00)
  distanceStdDevCm: number; // sai số quãng đường (mặc định 2 cm)
  yawErrorDeg: number; // sai số góc quay (mặc định 2 độ)
  hoverDriftRate: number; // cm / sqrt(s) (mặc định 1.5)
  tagTrackingErrorCm: number; // sai số theo tag ± 2 cm
  
  // Field dimension
  fieldWidthCm: number; // mặc định 300, chỉnh tới 600
  fieldHeightCm: number; // mặc định 300, chỉnh tới 600
  
  // Axis convention for 3-axis flight
  axisConvention: AxisConvention; // default 'forward_left_up': x=tiến, y=trái, z=lên
  
  // Gió
  windEnabled: boolean;
  windDirectionDeg: number; // 0 = Bắc (+Y), 90 = Đông (+X)...
  windSpeedCmS: number; // cm/s
  
  // Hạt ngẫu nhiên
  seed: number;
  useSeed: boolean;
}

export interface TagGridConfig {
  tagsPerRow: number; // mặc định 20
  spacingCm: number; // mặc định 30 cm
  offsetFromEdgeCm: number; // mặc định 30 cm
}

export interface AprilTagData {
  id: number;
  x: number; // cm
  y: number; // cm
  sizeCm: number; // 15 cm
}

export type ObstacleType =
  | 'hoop'
  | 'pole'
  | 'barrier'
  | 'human'
  | 'flame'
  | 'cube'
  | 'pinwheel'
  | 'stick'
  | 'target_zone';

export interface FieldObstacle {
  id: string;
  type: ObstacleType;
  name: string;
  x: number; // cm
  y: number; // cm
  z: number; // cm (bottom elevation)
  width: number; // cm
  depth: number; // cm
  height: number; // cm
  radius?: number; // for pole / hoop / target_zone
  innerRadius?: number; // for hoop opening
  centerZ?: number; // for hoop center

  // 1. Cột dấu thăng & chế độ lắp cột
  isInstalled?: boolean; // Cột đã được dựng/lắp hay chưa (chân đế trống)
  poleIndex?: number; // 1, 2, 3, 4 theo thứ tự các góc dấu thăng

  // 2. Chong chóng (Pinwheel)
  bladeRadius?: number; // bán kính cánh (cm, mặc định 10)
  targetRotations?: number; // số vòng quay cần đạt (mặc định 3 vòng)
  currentRotations?: number; // số vòng quay tích lũy hiện tại
  currentRotationSpeedDegS?: number; // tốc độ quay tức thời (độ/giây, max 360)
  maxTimeSec?: number; // thời gian tối đa

  // 3. Gậy & Vùng đích (Stick & Target zone)
  length?: number; // chiều dài gậy (cm, mặc định 40)
  diameter?: number; // đường kính gậy (cm, mặc định 3)
  angleDeg?: number; // góc xoay gậy (độ, mặc định 0)
  massKg?: number; // khối lượng gậy (kg, mặc định 0.2)
  frictionCoeff?: number; // hệ số ma sát trượt (mặc định 0.8)
  velocityX?: number; // vận tốc trượt X (cm/s)
  velocityY?: number; // vận tốc trượt Y (cm/s)
  angularVelocityDegS?: number; // vận tốc xoay (deg/s)
  pushCount?: number; // số lần drone chạm/đẩy gậy
  isTargetZone?: boolean; // cho vùng đích
  shape?: 'rect' | 'circle'; // cho vùng đích (chữ nhật hoặc tròn)
  allowOffTable?: boolean; // có cho phép đẩy rơi khỏi bệ không
}

export type HashChallengeMode = 'orbit_poles' | 'draw_strokes' | 'install_poles';

export interface HashGridConfig {
  centerX: number; // mặc định 150 cm
  centerY: number; // mặc định 150 cm
  squareSideA: number; // cạnh hình vuông nối 4 cột (mặc định 60 cm)
  armExtension: number; // chiều dài vươn ra ngoài mỗi đầu (mặc định 30 cm)
  mode: HashChallengeMode;
  minOrbitAngleDeg: number; // mặc định 270 độ
  forbiddenRadiusCm: number; // vùng cấm quanh cột (mặc định 15 cm)
  strokeToleranceCm: number; // sai số cho phép ±15 cm
  hoverInstallTimeSec: number; // thời gian hover lắp cột (mặc định 3s)
  hoverInstallToleranceCm: number; // sai số vị trí lắp cột (mặc định ±10 cm)
}

export interface FlightPathPoint {
  time: number; // seconds
  actual: Vector3D;
  ideal: Vector3D;
  yaw: number;
  errorCm: number; // distance between actual and ideal
  altitude: number;
  speed: number;
  tagDetected: boolean;
}

export interface RunSummary {
  runId: string;
  timestamp: number;
  totalTimeSeconds: number;
  totalDistanceCm: number;
  maxErrorCm: number;
  finalErrorCm: number;
  tagLossCount: number;
  collisionOccurred: boolean;
  collisionDetails?: string;
  path: FlightPathPoint[];
  cCode: string;
}

export interface CustomProcedureDef {
  name: string;
  params: string[];
}
