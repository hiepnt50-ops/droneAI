/**
 * Drone Simulation Interpreter and Execution Engine
 * WhalesBot Eagle 1003
 */

import * as Blockly from 'blockly';
import {
  CalibrationConfig,
  DroneState,
  FieldObstacle,
  FlightPathPoint,
  RunSummary,
  SensorPortsMap,
  TagGridConfig,
  Vector3D,
} from '../types/drone';
import {
  checkCollision,
  checkTagDetection,
  computeTagCoordinates,
  createInitialDroneState,
  DEFAULT_CALIBRATION,
  DEFAULT_SENSOR_PORTS,
  DEFAULT_TAG_GRID,
  easeInOutCubic,
  PRNG,
  updateSensors,
} from './physics';
import { stepPinwheelPhysics, stepStickPhysics } from './challengeEngine';

export type SimulationListener = (drone: DroneState, currentBlockId: string | null) => void;
export type RunFinishedListener = (summary: RunSummary) => void;
export type ErrorListener = (blockId: string | null, message: string) => void;
export type TagConfigListener = (config: TagGridConfig) => void;
export type ObstaclesUpdateListener = (obstacles: FieldObstacle[]) => void;

interface ExecutionContext {
  variables: Record<string, any>;
  loopBreak: boolean;
  returnValue?: any;
}

export class DroneInterpreter {
  private drone: DroneState;
  private calibration: CalibrationConfig;
  private tagConfig: TagGridConfig;
  private obstacles: FieldObstacle[];
  private portsConfig: SensorPortsMap;
  private prng: PRNG;

  private isRunning = false;
  private isPaused = false;
  private speedMultiplier = 1.0;
  private currentBlockId: string | null = null;
  private stepMode = false;
  private stepResolve: (() => void) | null = null;
  private cancelExecution = false;

  private flightPath: FlightPathPoint[] = [];
  private idealPosition: Vector3D = { x: 15, y: 15, z: 0 };
  private idealYaw = 0;
  private tagLossCount = 0;

  // Listeners
  private onStateChange: SimulationListener | null = null;
  private onRunFinished: RunFinishedListener | null = null;
  private onError: ErrorListener | null = null;
  private onTagGridConfigChange: TagConfigListener | null = null;
  private onObstaclesUpdate: ObstaclesUpdateListener | null = null;

  constructor(
    calibration: CalibrationConfig = DEFAULT_CALIBRATION,
    tagConfig: TagGridConfig = DEFAULT_TAG_GRID,
    obstacles: FieldObstacle[] = [],
    portsConfig: SensorPortsMap = DEFAULT_SENSOR_PORTS
  ) {
    this.calibration = { ...calibration };
    this.tagConfig = { ...tagConfig };
    this.obstacles = [...obstacles];
    this.portsConfig = { ...portsConfig };
    this.prng = new PRNG(calibration.useSeed ? calibration.seed : Math.floor(Math.random() * 1000000));
    this.drone = createInitialDroneState();
  }

  public setCalibration(config: CalibrationConfig): void {
    this.calibration = { ...config };
    this.prng = new PRNG(config.useSeed ? config.seed : Math.floor(Math.random() * 1000000));
  }

  public setTagConfig(config: TagGridConfig): void {
    this.tagConfig = { ...config };
  }

  public setObstacles(obstacles: FieldObstacle[]): void {
    this.obstacles = [...obstacles];
  }

  public setPortsConfig(ports: SensorPortsMap): void {
    this.portsConfig = { ...ports };
  }

  public setSpeedMultiplier(mult: number): void {
    this.speedMultiplier = mult;
  }

  public setListeners(
    onStateChange: SimulationListener,
    onRunFinished: RunFinishedListener,
    onError: ErrorListener,
    onTagGridConfigChange?: TagConfigListener,
    onObstaclesUpdate?: ObstaclesUpdateListener
  ): void {
    this.onStateChange = onStateChange;
    this.onRunFinished = onRunFinished;
    this.onError = onError;
    this.onTagGridConfigChange = onTagGridConfigChange || null;
    this.onObstaclesUpdate = onObstaclesUpdate || null;
  }

  private updateChallengePhysics(dt: number): void {
    let changed = false;
    const targetZone = this.obstacles.find(o => o.type === 'target_zone');

    const updated = this.obstacles.map(obs => {
      if (obs.type === 'pinwheel') {
        const res = stepPinwheelPhysics(obs, this.drone, dt);
        if (res.collidedWithBlades) {
          throw new Error(`VA CHẠM: Drone chạm vào cánh chong chóng '${obs.name}'! Dừng động cơ.`);
        }
        changed = true;
        return res.updatedPinwheel;
      } else if (obs.type === 'stick') {
        const res = stepStickPhysics(
          obs,
          targetZone,
          this.drone,
          dt,
          this.calibration.fieldWidthCm,
          this.calibration.fieldHeightCm
        );
        changed = true;
        return res.updatedStick;
      }
      return obs;
    });

    if (changed) {
      this.obstacles = updated;
      if (this.onObstaclesUpdate) {
        this.onObstaclesUpdate(updated);
      }
    }
  }

  public getState(): DroneState {
    return this.drone;
  }

  public getFlightPath(): FlightPathPoint[] {
    return this.flightPath;
  }

  public reset(): void {
    this.stop();
    this.drone = createInitialDroneState();
    this.idealPosition = { ...this.drone.position };
    this.idealYaw = 0;
    this.flightPath = [];
    this.tagLossCount = 0;
    this.currentBlockId = null;
    this.notify();
  }

  public emergencyStop(): void {
    this.drone.isEmergencyStopped = true;
    this.drone.isFlying = false;
    this.drone.velocity = { x: 0, y: 0, z: 0 };
    this.logDebug('DỪNG KHẨN CẤP: Động cơ đã bị ngắt!', 'error');
    this.cancelExecution = true;
    this.isRunning = false;
    this.notify();
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public stop(): void {
    this.cancelExecution = true;
    this.isRunning = false;
    this.isPaused = false;
    if (this.stepResolve) {
      this.stepResolve();
      this.stepResolve = null;
    }
  }

  public async step(workspace: Blockly.Workspace): Promise<void> {
    if (!this.isRunning) {
      this.stepMode = true;
      this.start(workspace);
    } else {
      if (this.stepResolve) {
        const resolve = this.stepResolve;
        this.stepResolve = null;
        resolve();
      }
    }
  }

  public async start(workspace: Blockly.Workspace): Promise<void> {
    if (this.isRunning) return;

    this.cancelExecution = false;
    this.isRunning = true;
    this.isPaused = false;
    this.flightPath = [];
    this.tagLossCount = 0;
    this.idealPosition = { ...this.drone.position };
    this.idealYaw = this.drone.yaw;

    this.recordPathPoint();

    const topBlocks = workspace.getTopBlocks(true);
    // Filter out procedure definition blocks from main execution
    const startBlocks = topBlocks.filter(b => b.isEnabled() && b.type !== 'procedures_defnoreturn');

    const context: ExecutionContext = {
      variables: {},
      loopBreak: false,
    };

    try {
      for (const block of startBlocks) {
        if (this.cancelExecution) break;
        await this.executeBlockChain(block, context, workspace);
      }

      if (!this.cancelExecution) {
        this.finishRun(false);
      }
    } catch (err: any) {
      this.drone.isFlying = false;
      this.drone.isHovering = false;
      this.drone.velocity = { x: 0, y: 0, z: 0 };
      this.drone.angularSpeed = 0;
      const msg = err?.message || 'Lỗi không xác định khi thực thi';
      this.logDebug(msg, 'error');
      if (this.onError) {
        this.onError(this.currentBlockId, msg);
      }
      this.finishRun(true, msg);
    } finally {
      this.isRunning = false;
      this.currentBlockId = null;
      this.stepMode = false;
      this.notify();
    }
  }

  private finishRun(collisionOrError: boolean, errorDetail?: string): void {
    const totalTime = this.drone.flightTimeSeconds;
    let totalDist = 0;
    let maxError = 0;
    for (let i = 1; i < this.flightPath.length; i++) {
      const p1 = this.flightPath[i - 1].actual;
      const p2 = this.flightPath[i].actual;
      totalDist += Math.hypot(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
      if (this.flightPath[i].errorCm > maxError) {
        maxError = this.flightPath[i].errorCm;
      }
    }

    const lastPoint = this.flightPath[this.flightPath.length - 1];
    const finalError = lastPoint ? lastPoint.errorCm : 0;

    const summary: RunSummary = {
      runId: 'run_' + Date.now(),
      timestamp: Date.now(),
      totalTimeSeconds: Math.round(totalTime * 10) / 10,
      totalDistanceCm: Math.round(totalDist * 10) / 10,
      maxErrorCm: Math.round(maxError * 10) / 10,
      finalErrorCm: Math.round(finalError * 10) / 10,
      tagLossCount: this.tagLossCount,
      collisionOccurred: collisionOrError,
      collisionDetails: errorDetail,
      path: [...this.flightPath],
      cCode: '',
    };

    if (this.onRunFinished) {
      this.onRunFinished(summary);
    }
  }

  private async executeBlockChain(
    block: Blockly.Block | null,
    context: ExecutionContext,
    workspace: Blockly.Workspace
  ): Promise<void> {
    let current: Blockly.Block | null = block;

    while (current && !this.cancelExecution) {
      if (!current.isEnabled()) {
        current = current.getNextBlock();
        continue;
      }

      this.currentBlockId = current.id;
      this.notify();

      if (this.stepMode) {
        await new Promise<void>(resolve => {
          this.stepResolve = resolve;
        });
        if (this.cancelExecution) break;
      }

      await this.executeSingleBlock(current, context, workspace);

      if (context.loopBreak) {
        break;
      }

      current = current.getNextBlock();
    }
  }

  private async executeSingleBlock(
    block: Blockly.Block,
    context: ExecutionContext,
    workspace: Blockly.Workspace
  ): Promise<void> {
    const type = block.type;

    while (this.isPaused && !this.cancelExecution) {
      await this.sleep(100);
    }
    if (this.cancelExecution) return;

    // Hang protection check (> 600s)
    if (this.drone.flightTimeSeconds >= 600) {
      throw new Error('Chống treo: Thời gian mô phỏng vượt quá 600 giây! Dừng chương trình.');
    }

    // Battery check
    if (this.drone.batteryPercent <= 0) {
      throw new Error('Hết pin! Drone buộc phải hạ cánh khẩn cấp.');
    }

    switch (type) {
      // ================= 1. MOTION =================
      case 'wb_enter_pitch_mode': {
        this.drone.isUnlocked = true;
        this.logDebug('Đã vào chế độ bay (mở khóa thành công).', 'info');
        await this.sleep(200);
        break;
      }

      case 'wb_exit_pitch_mode': {
        if (this.drone.isFlying) {
          throw new Error('Không thể thoát chế độ bay khi drone đang ở trên không!');
        }
        this.drone.isUnlocked = false;
        this.logDebug('Đã thoát chế độ bay.', 'info');
        await this.sleep(200);
        break;
      }

      case 'wb_takeoff_height': {
        if (!this.drone.isUnlocked) {
          throw new Error('Lỗi: Drone chưa được mở khóa! Cần dùng khối "Entering pitch mode (vào chế độ bay)" trước khi cất cánh.');
        }
        if (this.drone.isFlying) {
          this.logDebug('Drone đã ở trên không rồi.', 'warn');
          break;
        }

        const targetHeight = Number(block.getFieldValue('HEIGHT')) || 100;
        await this.simulateVerticalMove(targetHeight, this.calibration.takeoffSpeed);
        this.drone.isFlying = true;
        this.drone.isHovering = true;
        this.logDebug(`Cất cánh thành công lên độ cao ${targetHeight} cm.`, 'info');
        break;
      }

      case 'wb_takeoff_full': {
        if (!this.drone.isUnlocked) {
          throw new Error('Lỗi: Drone chưa được mở khóa! Cần dùng khối "Entering pitch mode (vào chế độ bay)" trước khi cất cánh.');
        }
        const h = Number(block.getFieldValue('HEIGHT')) || 100;
        const spd = Number(block.getFieldValue('SPEED')) || this.calibration.takeoffSpeed;
        await this.simulateVerticalMove(h, spd);
        this.drone.isFlying = true;
        this.drone.isHovering = true;
        break;
      }

      case 'wb_land': {
        if (!this.drone.isFlying) {
          this.logDebug('Drone đang ở trên mặt đất.', 'warn');
          break;
        }
        await this.simulateVerticalMove(0, this.calibration.landingSpeed);
        this.drone.isFlying = false;
        this.drone.isHovering = false;
        this.logDebug('Đã hạ cánh an toàn xuống mặt sàn.', 'info');
        break;
      }

      case 'wb_land_full': {
        if (!this.drone.isFlying) break;
        const spd = Number(block.getFieldValue('SPEED')) || this.calibration.landingSpeed;
        await this.simulateVerticalMove(0, spd);
        this.drone.isFlying = false;
        this.drone.isHovering = false;
        break;
      }

      case 'wb_set_speed': {
        const speed = Math.max(10, Math.min(this.calibration.maxSpeed, Number(block.getFieldValue('SPEED')) || 50));
        this.drone.speed = speed;
        this.logDebug(`Cài đặt tốc độ bay: ${speed} cm/s`, 'info');
        break;
      }

      case 'wb_rise': {
        this.checkAirborne();
        const dist = Number(block.getFieldValue('DISTANCE')) || 50;
        await this.simulateVerticalMove(this.drone.position.z + dist, this.drone.speed);
        break;
      }

      case 'wb_down': {
        this.checkAirborne();
        const dist = Number(block.getFieldValue('DISTANCE')) || 50;
        await this.simulateVerticalMove(Math.max(0, this.drone.position.z - dist), this.drone.speed);
        break;
      }

      case 'wb_forward': {
        this.checkAirborne();
        const dist = Number(block.getFieldValue('DISTANCE')) || 50;
        const rad = (this.drone.yaw * Math.PI) / 180;
        const dx = dist * Math.sin(rad);
        const dy = dist * Math.cos(rad);
        await this.simulateRelativeMove(dx, dy, 0, this.drone.speed);
        break;
      }

      case 'wb_backward': {
        this.checkAirborne();
        const dist = Number(block.getFieldValue('DISTANCE')) || 50;
        const rad = (this.drone.yaw * Math.PI) / 180;
        const dx = -dist * Math.sin(rad);
        const dy = -dist * Math.cos(rad);
        await this.simulateRelativeMove(dx, dy, 0, this.drone.speed);
        break;
      }

      case 'wb_left': {
        this.checkAirborne();
        const dist = Number(block.getFieldValue('DISTANCE')) || 50;
        const rad = (this.drone.yaw * Math.PI) / 180;
        const dx = -dist * Math.cos(rad);
        const dy = dist * Math.sin(rad);
        await this.simulateRelativeMove(dx, dy, 0, this.drone.speed);
        break;
      }

      case 'wb_right': {
        this.checkAirborne();
        const dist = Number(block.getFieldValue('DISTANCE')) || 50;
        const rad = (this.drone.yaw * Math.PI) / 180;
        const dx = dist * Math.cos(rad);
        const dy = -dist * Math.sin(rad);
        await this.simulateRelativeMove(dx, dy, 0, this.drone.speed);
        break;
      }

      case 'wb_turn_left': {
        this.checkAirborne();
        const angle = Number(block.getFieldValue('ANGLE')) || 90;
        await this.simulateTurn(-angle, this.calibration.turnSpeed);
        break;
      }

      case 'wb_turn_right': {
        this.checkAirborne();
        const angle = Number(block.getFieldValue('ANGLE')) || 90;
        await this.simulateTurn(angle, this.calibration.turnSpeed);
        break;
      }

      case 'wb_fly_dir_speed': {
        this.checkAirborne();
        const spd = Number(block.getFieldValue('SPEED')) || 30;
        const dir = Number(block.getFieldValue('DIRECTION')) || 0;
        this.drone.continuousMotion = {
          active: true,
          speed: spd,
          directionDeg: dir,
        };
        // Perform 1 second burst in this direction
        const totalRad = ((this.drone.yaw + dir) * Math.PI) / 180;
        const dx = spd * Math.sin(totalRad);
        const dy = spd * Math.cos(totalRad);
        await this.simulateRelativeMove(dx, dy, 0, spd);
        break;
      }

      case 'wb_fly_3axis': {
        this.checkAirborne();
        const inputX = Number(block.getFieldValue('DX')) || 50;
        const inputY = Number(block.getFieldValue('DY')) || 50;
        const inputZ = Number(block.getFieldValue('DZ')) || 50;
        const spd = Number(block.getFieldValue('SPEED')) || 30;

        let forward = 0;
        let left = 0;
        let up = inputZ;

        if (this.calibration.axisConvention === 'forward_left_up') {
          forward = inputX;
          left = inputY;
        } else {
          // right_forward_up
          left = -inputX;
          forward = inputY;
        }

        const rad = (this.drone.yaw * Math.PI) / 180;
        const dx = forward * Math.sin(rad) - left * Math.cos(rad);
        const dy = forward * Math.cos(rad) + left * Math.sin(rad);

        await this.simulateRelativeMove(dx, dy, up, spd);
        break;
      }

      case 'wb_joystick': {
        this.checkAirborne();
        const pitch = Number(block.getFieldValue('PITCH')) || 50;
        const roll = Number(block.getFieldValue('ROLL')) || 50;
        const thr = Number(block.getFieldValue('THROTTLE')) || 50;
        const yaw = Number(block.getFieldValue('YAW')) || 50;

        this.drone.rcChannels = { pitch, roll, throttle: thr, yaw };

        const vy = ((pitch - 50) / 50) * this.drone.speed;
        const vx = ((roll - 50) / 50) * this.drone.speed;
        const vz = ((thr - 50) / 50) * (this.drone.speed * 0.7);
        const vyaw = ((yaw - 50) / 50) * 90;

        await this.simulateRelativeMove(vx, vy, vz, this.drone.speed);
        if (Math.abs(vyaw) > 1) {
          await this.simulateTurn(vyaw, 90);
        }
        break;
      }

      case 'wb_hover': {
        this.checkAirborne();
        this.drone.continuousMotion = null;
        await this.simulateHover(2);
        break;
      }

      case 'wb_hover_altitude': {
        this.checkAirborne();
        const h = Number(block.getFieldValue('HEIGHT')) || 20;
        const dz = h - this.drone.position.z;
        if (Math.abs(dz) > 0.5) {
          await this.simulateVerticalMove(h, this.drone.speed);
        }
        await this.simulateHover(2);
        break;
      }

      case 'wb_emergency_stop': {
        this.emergencyStop();
        break;
      }

      case 'wb_set_servo': {
        const port = block.getFieldValue('PORT') || 'P2';
        const spd = Number(block.getFieldValue('SPEED')) || 40;
        const angle = Number(block.getFieldValue('ANGLE')) || 90;
        this.drone.servoPort = port;
        this.drone.servoSpeed = spd;
        this.drone.servoAngle = angle;
        this.logDebug(`Servo ${port}: góc ${angle}°, tốc độ ${spd}`, 'info');
        await this.sleep(150);
        break;
      }

      // ================= 2. LOOPS =================
      case 'wb_loop_forever': {
        const doBlock = block.getInputTargetBlock('DO');
        let iterations = 0;
        while (!this.cancelExecution && !context.loopBreak && iterations < 1000) {
          iterations++;
          if (doBlock) {
            await this.executeBlockChain(doBlock, context, workspace);
          }
          await this.sleep(20);
        }
        context.loopBreak = false;
        break;
      }

      case 'wb_loop_repeat_times': {
        const times = Math.max(0, Math.min(1000, Number(block.getFieldValue('TIMES')) || 10));
        const doBlock = block.getInputTargetBlock('DO');
        for (let i = 0; i < times && !this.cancelExecution; i++) {
          if (context.loopBreak) break;
          if (doBlock) {
            await this.executeBlockChain(doBlock, context, workspace);
          }
        }
        context.loopBreak = false;
        break;
      }

      case 'wb_loop_if_repeat': {
        const condBlock = block.getInputTargetBlock('CONDITION');
        const doBlock = block.getInputTargetBlock('DO');
        let iters = 0;
        while (!this.cancelExecution && !context.loopBreak && iters < 1000) {
          const cond = condBlock ? Boolean(this.evaluateValue(condBlock, context)) : true;
          if (!cond) break;
          iters++;
          if (doBlock) {
            await this.executeBlockChain(doBlock, context, workspace);
          }
          await this.sleep(20);
        }
        context.loopBreak = false;
        break;
      }

      case 'wb_loop_repeat_until': {
        const condBlock = block.getInputTargetBlock('CONDITION');
        const doBlock = block.getInputTargetBlock('DO');
        let iters = 0;
        while (!this.cancelExecution && !context.loopBreak && iters < 1000) {
          const cond = condBlock ? Boolean(this.evaluateValue(condBlock, context)) : false;
          if (cond) break;
          iters++;
          if (doBlock) {
            await this.executeBlockChain(doBlock, context, workspace);
          }
          await this.sleep(20);
        }
        context.loopBreak = false;
        break;
      }

      case 'wb_loop_break': {
        context.loopBreak = true;
        break;
      }

      case 'wb_loop_return': {
        const valBlock = block.getInputTargetBlock('VALUE');
        context.returnValue = valBlock ? this.evaluateValue(valBlock, context) : undefined;
        context.loopBreak = true;
        break;
      }

      case 'wb_loop_wait_seconds': {
        const s = Number(block.getFieldValue('SECONDS')) || 2;
        await this.simulateWait(s);
        break;
      }

      case 'wb_loop_wait_until': {
        const condBlock = block.getInputTargetBlock('CONDITION');
        let waited = 0;
        while (!this.cancelExecution && waited < 60) {
          const cond = condBlock ? Boolean(this.evaluateValue(condBlock, context)) : true;
          if (cond) break;
          await this.simulateWait(0.1);
          waited += 0.1;
        }
        break;
      }

      // ================= 3. LOGIC =================
      case 'wb_logic_if': {
        const condBlock = block.getInputTargetBlock('IF0');
        const cond = condBlock ? Boolean(this.evaluateValue(condBlock, context)) : false;
        if (cond) {
          const doBlock = block.getInputTargetBlock('DO0');
          if (doBlock) {
            await this.executeBlockChain(doBlock, context, workspace);
          }
        }
        break;
      }

      case 'wb_logic_if_else': {
        const condBlock = block.getInputTargetBlock('IF0');
        const cond = condBlock ? Boolean(this.evaluateValue(condBlock, context)) : false;
        if (cond) {
          const doBlock = block.getInputTargetBlock('DO0');
          if (doBlock) {
            await this.executeBlockChain(doBlock, context, workspace);
          }
        } else {
          const elseBlock = block.getInputTargetBlock('ELSE');
          if (elseBlock) {
            await this.executeBlockChain(elseBlock, context, workspace);
          }
        }
        break;
      }

      // ================= 4. VARIABLES =================
      case 'wb_var_set': {
        const varName = block.getField('VAR')?.getText() || 'item';
        const valBlock = block.getInputTargetBlock('VALUE');
        const val = valBlock ? this.evaluateValue(valBlock, context) : 0;
        context.variables[varName] = val;
        break;
      }

      case 'wb_var_change': {
        const varName = block.getField('VAR')?.getText() || 'item';
        const deltaBlock = block.getInputTargetBlock('DELTA');
        const delta = Number(deltaBlock ? this.evaluateValue(deltaBlock, context) : 1) || 1;
        context.variables[varName] = (Number(context.variables[varName]) || 0) + delta;
        break;
      }

      // ================= 5. AI =================
      case 'wb_ai_qr_map_mode': {
        const count = Number(block.getFieldValue('TAGS_PER_ROW')) || 20;
        const spacing = Number(block.getFieldValue('SPACING')) || 30;
        this.tagConfig = {
          ...this.tagConfig,
          tagsPerRow: count,
          spacingCm: spacing,
        };
        if (this.onTagGridConfigChange) {
          this.onTagGridConfigChange({ ...this.tagConfig });
        }
        this.logDebug(`Khởi tạo bản đồ QR: ${count} tags/hàng, khoảng cách ${spacing}cm`, 'info');
        break;
      }

      case 'wb_ai_fly_to_id': {
        this.checkAirborne();
        const tagId = Number(block.getFieldValue('TAG_ID')) || 10;
        const ox = Number(block.getFieldValue('OFFSET_X')) || 0;
        const oy = Number(block.getFieldValue('OFFSET_Y')) || 0;
        const h = Number(block.getFieldValue('HEIGHT')) || 100;
        await this.navigateToTag(tagId, h, ox, oy);
        break;
      }

      case 'wb_ai_hover_on_id': {
        this.checkAirborne();
        const tagId = Number(block.getFieldValue('TAG_ID')) || 10;
        const dur = Number(block.getFieldValue('DURATION')) || 5;
        const ox = Number(block.getFieldValue('OFFSET_X')) || 0;
        const oy = Number(block.getFieldValue('OFFSET_Y')) || 0;
        const angle = Number(block.getFieldValue('ANGLE')) || 0;

        await this.navigateToTag(tagId, this.drone.position.z, ox, oy);
        const yawDiff = angle - this.drone.yaw;
        if (Math.abs(yawDiff) > 1) {
          await this.simulateTurn(yawDiff, this.calibration.turnSpeed);
        }
        await this.simulateHover(dur);
        break;
      }

      case 'wb_ai_landing_at_id': {
        this.checkAirborne();
        const tagId = Number(block.getFieldValue('TAG_ID')) || 10;
        const ox = Number(block.getFieldValue('OFFSET_X')) || 0;
        const oy = Number(block.getFieldValue('OFFSET_Y')) || 0;

        await this.navigateToTag(tagId, 60, ox, oy);
        await this.simulateVerticalMove(0, this.calibration.landingSpeed);
        this.drone.isFlying = false;
        this.drone.isHovering = false;
        this.logDebug(`Hạ cánh thành công tại AprilTag ID ${tagId}.`, 'info');
        break;
      }

      case 'wb_ai_set_exposure': {
        const exp = Number(block.getFieldValue('EXPOSURE')) || 1000;
        this.drone.cameraExposure = exp;
        this.logDebug(`Đã đặt độ phơi sáng camera: ${exp}`, 'info');
        break;
      }

      // ================= 6. PROCEDURES (MY BLOCKS) =================
      case 'procedures_callnoreturn': {
        const procName = block.getFieldValue('NAME');
        // Find definition block in workspace
        const allBlocks = workspace.getAllBlocks(false);
        const defBlock = allBlocks.find(
          b => b.type === 'procedures_defnoreturn' && b.getFieldValue('NAME') === procName
        );
        if (defBlock) {
          const stack = defBlock.getInputTargetBlock('STACK');
          if (stack) {
            await this.executeBlockChain(stack, context, workspace);
          }
        }
        break;
      }

      default:
        this.logDebug(`Khối ${type} chưa hỗ trợ mô phỏng ở giai đoạn này.`, 'warn');
        break;
    }
  }

  // ================= Navigation & Tag AI =================
  private async navigateToTag(tagId: number, heightCm: number, ox: number, oy: number): Promise<void> {
    const coords = computeTagCoordinates(tagId, this.tagConfig);

    // Check if tag is inside field
    if (
      coords.x < 0 ||
      coords.x > this.calibration.fieldWidthCm ||
      coords.y < 0 ||
      coords.y > this.calibration.fieldHeightCm
    ) {
      throw new Error(`AprilTag ID ${tagId} nằm ngoài ranh giới sân (${coords.x}cm, ${coords.y}cm)!`);
    }

    // Camera height constraint check: Must be 50-150 cm to read tag
    if (heightCm < 50 || heightCm > 150) {
      this.tagLossCount++;
      this.logDebug(
        `Không thấy tag: Độ cao ${heightCm}cm nằm ngoài khoảng camera nhận diện (50-150 cm)! Drone giữ nguyên vị trí.`,
        'warn'
      );
      return;
    }

    const targetX = coords.x + ox;
    const targetY = coords.y + oy;
    const targetZ = heightCm;

    const dx = targetX - this.drone.position.x;
    const dy = targetY - this.drone.position.y;
    const dz = targetZ - this.drone.position.z;

    const speed = this.drone.speed || this.calibration.defaultSpeed;
    await this.simulateRelativeMove(dx, dy, dz, speed, true);

    // On arrival, position is corrected to tag center with small error ±2cm
    const tagCheck = checkTagDetection(
      this.drone.position,
      this.tagConfig,
      tagId,
      this.calibration.fieldWidthCm,
      this.calibration.fieldHeightCm
    );
    if (tagCheck.detected) {
      this.drone.detectedTagId = tagId;
      this.drone.tagConfidence = 98;
      // Snapping to exact tag position with offset and calibration error
      this.drone.position.x = coords.x + ox + this.prng.gaussian(0, this.calibration.tagTrackingErrorCm);
      this.drone.position.y = coords.y + oy + this.prng.gaussian(0, this.calibration.tagTrackingErrorCm);
      this.idealPosition.x = coords.x + ox;
      this.idealPosition.y = coords.y + oy;
      this.logDebug(`Đã khóa định vị thành công trên AprilTag ID ${tagId}.`, 'info');
    } else {
      this.tagLossCount++;
      this.drone.detectedTagId = -1;
      this.drone.tagConfidence = 0;
      this.logDebug(`Không tìm thấy AprilTag ID ${tagId} tại vị trí này.`, 'warn');
    }
  }

  // ================= Motion Physics Simulation =================
  private async simulateRelativeMove(
    dx: number,
    dy: number,
    dz: number,
    speed: number,
    isTagGuided = false
  ): Promise<void> {
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 0.01) return;

    const startIdeal = { ...this.idealPosition };
    const targetIdeal = {
      x: startIdeal.x + dx,
      y: startIdeal.y + dy,
      z: Math.max(0, startIdeal.z + dz),
    };

    const distMultiplier = isTagGuided ? 1.0 : this.calibration.distanceFactor;
    const noiseFactor = isTagGuided ? this.calibration.tagTrackingErrorCm : this.calibration.distanceStdDevCm;

    const noiseX = this.prng.gaussian(0, noiseFactor);
    const noiseY = this.prng.gaussian(0, noiseFactor);
    const noiseZ = this.prng.gaussian(0, noiseFactor * 0.4);

    const actualDx = dx * distMultiplier + noiseX;
    const actualDy = dy * distMultiplier + noiseY;
    const actualDz = dz * distMultiplier + noiseZ;

    const startActual = { ...this.drone.position };
    const targetActual = {
      x: startActual.x + actualDx,
      y: startActual.y + actualDy,
      z: Math.max(0, startActual.z + actualDz),
    };

    const durationSeconds = dist / Math.max(10, speed);
    const steps = Math.max(10, Math.round(durationSeconds * 30));
    const dt = durationSeconds / steps;

    let windVx = 0;
    let windVy = 0;
    if (this.calibration.windEnabled && !isTagGuided) {
      const windRad = (this.calibration.windDirectionDeg * Math.PI) / 180;
      windVx = this.calibration.windSpeedCmS * Math.sin(windRad);
      windVy = this.calibration.windSpeedCmS * Math.cos(windRad);
    }

    this.drone.isHovering = false;
    this.drone.velocity = {
      x: (targetActual.x - startActual.x) / durationSeconds,
      y: (targetActual.y - startActual.y) / durationSeconds,
      z: (targetActual.z - startActual.z) / durationSeconds,
    };

    for (let step = 1; step <= steps && !this.cancelExecution; step++) {
      const t = step / steps;
      const easedT = easeInOutCubic(t);

      const windDisplacementX = windVx * (t * durationSeconds);
      const windDisplacementY = windVy * (t * durationSeconds);

      this.drone.position.x = startActual.x + (targetActual.x - startActual.x) * easedT + windDisplacementX;
      this.drone.position.y = startActual.y + (targetActual.y - startActual.y) * easedT + windDisplacementY;
      this.drone.position.z = Math.max(0, startActual.z + (targetActual.z - startActual.z) * easedT);

      this.idealPosition.x = startIdeal.x + (targetIdeal.x - startIdeal.x) * easedT;
      this.idealPosition.y = startIdeal.y + (targetIdeal.y - startIdeal.y) * easedT;
      this.idealPosition.z = Math.max(0, startIdeal.z + (targetIdeal.z - startIdeal.z) * easedT);

      this.drone.flightTimeSeconds += dt;
      this.drone.batteryPercent = Math.max(0, 100 - (this.drone.flightTimeSeconds / 600) * 100);
      this.drone.batteryVoltage = 3.3 + (this.drone.batteryPercent / 100) * 0.9;

      this.drone.pitch = -((this.drone.velocity.y / 50) * 8);
      this.drone.roll = (this.drone.velocity.x / 50) * 8;

      this.updateChallengePhysics(dt);

      updateSensors(
        this.drone,
        this.obstacles,
        this.portsConfig,
        this.prng,
        this.tagConfig,
        this.calibration.fieldWidthCm,
        this.calibration.fieldHeightCm
      );
      this.recordPathPoint();

      const colCheck = checkCollision(
        this.drone.position,
        this.obstacles,
        this.calibration.fieldWidthCm,
        this.calibration.fieldHeightCm
      );
      if (colCheck.collided) {
        this.drone.isFlying = false;
        this.drone.isHovering = false;
        this.drone.velocity = { x: 0, y: 0, z: 0 };
        this.drone.angularSpeed = 0;
        throw new Error(`VA CHẠM: ${colCheck.reason}! Dừng động cơ.`);
      }

      this.notify();
      await this.sleep((dt * 1000) / this.speedMultiplier);
    }

    this.drone.pitch = 0;
    this.drone.roll = 0;
    this.drone.velocity = { x: 0, y: 0, z: 0 };
    this.drone.isHovering = true;
    this.notify();
  }

  private async simulateVerticalMove(targetZ: number, speed: number): Promise<void> {
    const dz = targetZ - this.drone.position.z;
    await this.simulateRelativeMove(0, 0, dz, speed);
  }

  private async simulateTurn(deltaAngle: number, turnSpeed: number): Promise<void> {
    const yawNoise = this.prng.gaussian(0, this.calibration.yawErrorDeg);
    const actualDelta = deltaAngle + yawNoise;

    const startIdealYaw = this.idealYaw;
    const targetIdealYaw = (startIdealYaw + deltaAngle + 360) % 360;

    const startActualYaw = this.drone.yaw;
    const targetActualYaw = (startActualYaw + actualDelta + 360) % 360;

    const durationSeconds = Math.abs(deltaAngle) / Math.max(20, turnSpeed);
    const steps = Math.max(8, Math.round(durationSeconds * 25));
    const dt = durationSeconds / steps;

    this.drone.angularSpeed = actualDelta / durationSeconds;

    for (let step = 1; step <= steps && !this.cancelExecution; step++) {
      const t = step / steps;
      const easedT = easeInOutCubic(t);

      this.drone.yaw = (startActualYaw + actualDelta * easedT + 360) % 360;
      this.idealYaw = (startIdealYaw + deltaAngle * easedT + 360) % 360;

      this.drone.flightTimeSeconds += dt;
      this.recordPathPoint();
      this.notify();
      await this.sleep((dt * 1000) / this.speedMultiplier);
    }

    this.drone.angularSpeed = 0;
    this.notify();
  }

  private async simulateHover(durationSeconds: number): Promise<void> {
    const steps = Math.max(5, Math.round(durationSeconds * 20));
    const dt = durationSeconds / steps;

    for (let step = 1; step <= steps && !this.cancelExecution; step++) {
      const driftDist = this.calibration.hoverDriftRate * Math.sqrt(dt);
      const driftAngle = this.prng.next() * Math.PI * 2;
      this.drone.position.x += Math.cos(driftAngle) * driftDist;
      this.drone.position.y += Math.sin(driftAngle) * driftDist;

      if (this.calibration.windEnabled) {
        const windRad = (this.calibration.windDirectionDeg * Math.PI) / 180;
        this.drone.position.x += this.calibration.windSpeedCmS * Math.sin(windRad) * dt;
        this.drone.position.y += this.calibration.windSpeedCmS * Math.cos(windRad) * dt;
      }

      this.drone.flightTimeSeconds += dt;
      this.drone.batteryPercent = Math.max(0, 100 - (this.drone.flightTimeSeconds / 600) * 100);
      this.drone.batteryVoltage = 3.3 + (this.drone.batteryPercent / 100) * 0.9;

      this.updateChallengePhysics(dt);

      updateSensors(
        this.drone,
        this.obstacles,
        this.portsConfig,
        this.prng,
        this.tagConfig,
        this.calibration.fieldWidthCm,
        this.calibration.fieldHeightCm
      );
      this.recordPathPoint();

      const colCheck = checkCollision(
        this.drone.position,
        this.obstacles,
        this.calibration.fieldWidthCm,
        this.calibration.fieldHeightCm
      );
      if (colCheck.collided) {
        this.drone.isFlying = false;
        this.drone.isHovering = false;
        this.drone.velocity = { x: 0, y: 0, z: 0 };
        this.drone.angularSpeed = 0;
        throw new Error(`VA CHẠM TRONG KHI LƠ LỬNG: ${colCheck.reason}! Dừng động cơ.`);
      }

      this.notify();
      await this.sleep((dt * 1000) / this.speedMultiplier);
    }
  }

  private async simulateWait(seconds: number): Promise<void> {
    if (this.drone.isFlying) {
      await this.simulateHover(seconds);
    } else {
      const steps = Math.max(2, Math.round(seconds * 10));
      const dt = seconds / steps;
      for (let i = 0; i < steps && !this.cancelExecution; i++) {
        await this.sleep((dt * 1000) / this.speedMultiplier);
      }
    }
  }

  private checkAirborne(): void {
    if (!this.drone.isFlying) {
      throw new Error('Lỗi: Drone chưa cất cánh! Không thể thực hiện lệnh bay khi đang ở trên mặt đất.');
    }
  }

  private recordPathPoint(): void {
    const errorCm = Math.hypot(
      this.drone.position.x - this.idealPosition.x,
      this.drone.position.y - this.idealPosition.y,
      this.drone.position.z - this.idealPosition.z
    );

    const tagCheck = checkTagDetection(
      this.drone.position,
      this.tagConfig,
      undefined,
      this.calibration.fieldWidthCm,
      this.calibration.fieldHeightCm
    );

    this.flightPath.push({
      time: Math.round(this.drone.flightTimeSeconds * 100) / 100,
      actual: { ...this.drone.position },
      ideal: { ...this.idealPosition },
      yaw: this.drone.yaw,
      errorCm: Math.round(errorCm * 100) / 100,
      altitude: Math.round(this.drone.position.z * 10) / 10,
      speed: Math.round(this.drone.speed),
      tagDetected: tagCheck.detected,
    });
  }

  private evaluateValue(block: Blockly.Block, context: ExecutionContext): any {
    const type = block.type;

    switch (type) {
      case 'math_number':
        return Number(block.getFieldValue('NUM')) || 0;

      case 'variables_get': {
        const varName = block.getField('VAR')?.getText() || 'item';
        return context.variables[varName] ?? 0;
      }

      case 'wb_get_speed':
        return this.drone.speed;

      case 'wb_sensor_altitude':
        return Math.round(this.drone.position.z * 10) / 10;

      case 'wb_sensor_laser_fuselage':
        return Math.round(this.drone.laserAltitudeCm * 10) / 10;

      case 'wb_sensor_battery_voltage':
        return Math.round(this.drone.batteryVoltage * 100) / 100;

      case 'wb_sensor_mainboard_temp':
        return Math.round(this.drone.boardTemp * 10) / 10;

      case 'wb_sensor_attitude_angle': {
        const ax = block.getFieldValue('AXIS');
        if (ax === 'yaw') return Math.round(this.drone.yaw);
        if (ax === 'pitch') return Math.round(this.drone.pitch);
        return Math.round(this.drone.roll);
      }

      case 'wb_sensor_angular_velocity':
        return Math.round(this.drone.angularSpeed);

      case 'wb_sensor_acceleration': {
        const ax = block.getFieldValue('AXIS') || 'Z';
        if (ax === 'X') return this.drone.acceleration.x;
        if (ax === 'Y') return this.drone.acceleration.y;
        return this.drone.acceleration.z;
      }

      case 'wb_sensor_optical_flow': {
        const ax = block.getFieldValue('AXIS');
        return ax === 'X'
          ? Math.round(this.drone.opticalFlow.dx * 10) / 10
          : Math.round(this.drone.opticalFlow.dy * 10) / 10;
      }

      case 'wb_sensor_ir_ranging_port': {
        const port = block.getFieldValue('PORT') as 'P1' | 'P2' | 'P3' | 'P4';
        return this.drone.portReadings[port]?.distanceCm ?? 80;
      }

      case 'wb_sensor_ir_obstacles_detected': {
        const port = block.getFieldValue('PORT') as 'P1' | 'P2' | 'P3' | 'P4';
        return this.drone.portReadings[port]?.obstacle ?? false;
      }

      case 'wb_sensor_human_ir_detected': {
        const port = block.getFieldValue('PORT') as 'P1' | 'P2' | 'P3' | 'P4';
        return this.drone.portReadings[port]?.human ?? false;
      }

      case 'wb_sensor_analog_port_val': {
        const port = block.getFieldValue('PORT') as 'P1' | 'P2' | 'P3' | 'P4';
        return this.drone.portReadings[port]?.analogVal ?? 512;
      }

      case 'wb_sensor_ultrasonic_distance': {
        const port = block.getFieldValue('PORT') as 'P1' | 'P2' | 'P3' | 'P4';
        return this.drone.portReadings[port]?.distanceCm ?? 80;
      }

      case 'wb_ai_qr_recognition': {
        const prop = block.getFieldValue('PROP');
        const check = checkTagDetection(
          this.drone.position,
          this.tagConfig,
          undefined,
          this.calibration.fieldWidthCm,
          this.calibration.fieldHeightCm
        );
        if (prop === 'ID') return check.detected ? check.tagId : -1;
        if (prop === 'X') return Math.round(this.drone.position.x);
        if (prop === 'Y') return Math.round(this.drone.position.y);
        return Math.round(this.drone.yaw);
      }

      // Logic
      case 'wb_logic_compare_lt': {
        const a = this.evaluateValue(block.getInputTargetBlock('A')!, context);
        const b = this.evaluateValue(block.getInputTargetBlock('B')!, context);
        return Number(a) < Number(b);
      }

      case 'wb_logic_compare_gt': {
        const a = this.evaluateValue(block.getInputTargetBlock('A')!, context);
        const b = this.evaluateValue(block.getInputTargetBlock('B')!, context);
        return Number(a) > Number(b);
      }

      case 'wb_logic_compare_eq': {
        const a = this.evaluateValue(block.getInputTargetBlock('A')!, context);
        const b = this.evaluateValue(block.getInputTargetBlock('B')!, context);
        return a == b;
      }

      case 'wb_logic_compare_neq': {
        const a = this.evaluateValue(block.getInputTargetBlock('A')!, context);
        const b = this.evaluateValue(block.getInputTargetBlock('B')!, context);
        return a != b;
      }

      case 'wb_logic_and': {
        const a = Boolean(this.evaluateValue(block.getInputTargetBlock('A')!, context));
        const b = Boolean(this.evaluateValue(block.getInputTargetBlock('B')!, context));
        return a && b;
      }

      case 'wb_logic_or': {
        const a = Boolean(this.evaluateValue(block.getInputTargetBlock('A')!, context));
        const b = Boolean(this.evaluateValue(block.getInputTargetBlock('B')!, context));
        return a || b;
      }

      case 'wb_logic_not': {
        const val = Boolean(this.evaluateValue(block.getInputTargetBlock('BOOL')!, context));
        return !val;
      }

      // Math
      case 'wb_math_add': {
        const a = Number(this.evaluateValue(block.getInputTargetBlock('A')!, context)) || 0;
        const b = Number(this.evaluateValue(block.getInputTargetBlock('B')!, context)) || 0;
        return a + b;
      }

      case 'wb_math_sub': {
        const a = Number(this.evaluateValue(block.getInputTargetBlock('A')!, context)) || 0;
        const b = Number(this.evaluateValue(block.getInputTargetBlock('B')!, context)) || 0;
        return a - b;
      }

      case 'wb_math_mul': {
        const a = Number(this.evaluateValue(block.getInputTargetBlock('A')!, context)) || 0;
        const b = Number(this.evaluateValue(block.getInputTargetBlock('B')!, context)) || 0;
        return a * b;
      }

      case 'wb_math_div': {
        const a = Number(this.evaluateValue(block.getInputTargetBlock('A')!, context)) || 0;
        const b = Number(this.evaluateValue(block.getInputTargetBlock('B')!, context)) || 0;
        return b !== 0 ? a / b : 0;
      }

      case 'wb_math_random': {
        const from = Number(block.getFieldValue('FROM')) || 0;
        const to = Number(block.getFieldValue('TO')) || 10;
        return Math.floor(this.prng.next() * (to - from + 1)) + from;
      }

      case 'wb_math_remainder': {
        const a = Number(this.evaluateValue(block.getInputTargetBlock('DIVIDEND')!, context)) || 0;
        const b = Number(this.evaluateValue(block.getInputTargetBlock('DIVISOR')!, context)) || 1;
        return a % b;
      }

      case 'wb_math_round': {
        const num = Number(this.evaluateValue(block.getInputTargetBlock('NUM')!, context)) || 0;
        return Math.round(num);
      }

      case 'wb_math_single': {
        const op = block.getFieldValue('OP');
        const num = Number(this.evaluateValue(block.getInputTargetBlock('NUM')!, context)) || 0;
        if (op === 'ABS') return Math.abs(num);
        if (op === 'ROOT') return Math.sqrt(num);
        if (op === 'FLOOR') return Math.floor(num);
        if (op === 'CEIL') return Math.ceil(num);
        if (op === 'SIN') return Math.sin((num * Math.PI) / 180);
        if (op === 'COS') return Math.cos((num * Math.PI) / 180);
        if (op === 'TAN') return Math.tan((num * Math.PI) / 180);
        if (op === 'ASIN') return (Math.asin(num) * 180) / Math.PI;
        if (op === 'ACOS') return (Math.acos(num) * 180) / Math.PI;
        if (op === 'ATAN') return (Math.atan(num) * 180) / Math.PI;
        if (op === 'LN') return Math.log(num);
        if (op === 'LOG10') return Math.log10(num);
        if (op === 'EXP') return Math.exp(num);
        if (op === 'POW10') return Math.pow(10, num);
        return num;
      }

      default:
        return 0;
    }
  }

  private logDebug(message: string, type: 'info' | 'warn' | 'error' = 'info'): void {
    this.drone.debugLogs.unshift({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      time: Math.round(this.drone.flightTimeSeconds * 10) / 10,
      message,
      type,
    });
    if (this.drone.debugLogs.length > 50) {
      this.drone.debugLogs.pop();
    }
  }

  private notify(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.drone }, this.currentBlockId);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, Math.max(1, ms)));
  }
}
