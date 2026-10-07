/**
 * C Code Generator for WhalesBot Eagle 1003 SDK
 */

import * as Blockly from 'blockly';

export function generateCCode(workspace: Blockly.Workspace): string {
  const topBlocks = workspace.getTopBlocks(true);
  const codeLines: string[] = [];

  for (const block of topBlocks) {
    if (block.type === 'procedures_defnoreturn') {
      generateProcedureC(block, codeLines);
    }
  }

  const mainLines: string[] = [];
  for (const block of topBlocks) {
    if (block.type !== 'procedures_defnoreturn') {
      generateBlockC(block, mainLines, 1);
    }
  }

  const mainBody = mainLines.length > 0
    ? mainLines.join('\n')
    : '    // Chương trình trống\n    wait(1);';

  const proceduresBody = codeLines.length > 0 ? codeLines.join('\n\n') + '\n\n' : '';

  return `/**
 * =======================================================
 * WhalesBot Eagle 1003 - Mã nguồn điều khiển C tự động
 * Tự động sinh từ môi trường lập trình khối trực quan
 * =======================================================
 */

#include "Eagle1003_SDK.h"

${proceduresBody}void user_main(void) {
    // Khởi tạo hệ thống
    system_init();

${mainBody}

    // Thoát an toàn
    fly_lock();
}
`;
}

function indent(depth: number): string {
  return '    '.repeat(depth);
}

function generateProcedureC(block: Blockly.Block, lines: string[]): void {
  const name = block.getFieldValue('NAME') || 'my_procedure';
  const procLines: string[] = [];
  const branch = block.getInputTargetBlock('STACK');
  if (branch) {
    generateBlockC(branch, procLines, 1);
  }
  lines.push(`void ${name}(void) {\n${procLines.join('\n')}\n}`);
}

function generateBlockC(block: Blockly.Block | null, lines: string[], depth: number): void {
  let current: Blockly.Block | null = block;

  while (current) {
    if (!current.isEnabled()) {
      current = current.getNextBlock();
      continue;
    }

    const type = current.type;

    switch (type) {
      // 1. Motion
      case 'wb_enter_pitch_mode':
        lines.push(`${indent(depth)}fly_unlock(); // Vào chế độ bay`);
        break;

      case 'wb_exit_pitch_mode':
        lines.push(`${indent(depth)}fly_lock(); // Thoát chế độ bay`);
        break;

      case 'wb_takeoff_height': {
        const h = current.getFieldValue('HEIGHT') ?? 100;
        lines.push(`${indent(depth)}fly_start(${h}); // Tự động cất cánh độ cao ${h} cm`);
        break;
      }

      case 'wb_takeoff_full': {
        const h = current.getFieldValue('HEIGHT') ?? 100;
        const spd = current.getFieldValue('SPEED') ?? 100;
        const ox = current.getFieldValue('OFFSET_X') ?? 0;
        const oy = current.getFieldValue('OFFSET_Y') ?? 0;
        lines.push(`${indent(depth)}fly_takeoff_config(${h}, ${spd}, ${ox}, ${oy});`);
        break;
      }

      case 'wb_land':
        lines.push(`${indent(depth)}fly_land(); // Tự động hạ cánh`);
        break;

      case 'wb_land_full': {
        const spd = current.getFieldValue('SPEED') ?? 50;
        const ox = current.getFieldValue('OFFSET_X') ?? 0;
        const oy = current.getFieldValue('OFFSET_Y') ?? 0;
        lines.push(`${indent(depth)}fly_land_config(${spd}, ${ox}, ${oy});`);
        break;
      }

      case 'wb_set_speed': {
        const spd = current.getFieldValue('SPEED') ?? 50;
        lines.push(`${indent(depth)}fly_setspeed(${spd}); // Đặt tốc độ bay ${spd} cm/s`);
        break;
      }

      case 'wb_rise': {
        const dist = current.getFieldValue('DISTANCE') ?? 50;
        lines.push(`${indent(depth)}fly_moveto(UP, ${dist}); // Bay lên ${dist} cm`);
        break;
      }

      case 'wb_down': {
        const dist = current.getFieldValue('DISTANCE') ?? 50;
        lines.push(`${indent(depth)}fly_moveto(DOWN, ${dist}); // Bay xuống ${dist} cm`);
        break;
      }

      case 'wb_forward': {
        const dist = current.getFieldValue('DISTANCE') ?? 50;
        lines.push(`${indent(depth)}fly_moveto(FRONT, ${dist}); // Bay tiến ${dist} cm`);
        break;
      }

      case 'wb_backward': {
        const dist = current.getFieldValue('DISTANCE') ?? 50;
        lines.push(`${indent(depth)}fly_moveto(BACK, ${dist}); // Bay lùi ${dist} cm`);
        break;
      }

      case 'wb_left': {
        const dist = current.getFieldValue('DISTANCE') ?? 50;
        lines.push(`${indent(depth)}fly_moveto(LEFT, ${dist}); // Bay sang trái ${dist} cm`);
        break;
      }

      case 'wb_right': {
        const dist = current.getFieldValue('DISTANCE') ?? 50;
        lines.push(`${indent(depth)}fly_moveto(RIGHT, ${dist}); // Bay sang phải ${dist} cm`);
        break;
      }

      case 'wb_turn_left': {
        const ang = current.getFieldValue('ANGLE') ?? 90;
        lines.push(`${indent(depth)}fly_turn(LEFT, ${ang}); // Quay trái ${ang}°`);
        break;
      }

      case 'wb_turn_right': {
        const ang = current.getFieldValue('ANGLE') ?? 90;
        lines.push(`${indent(depth)}fly_turn(RIGHT, ${ang}); // Quay phải ${ang}°`);
        break;
      }

      case 'wb_fly_dir_speed': {
        const spd = current.getFieldValue('SPEED') ?? 30;
        const dir = current.getFieldValue('DIRECTION') ?? 0;
        lines.push(`${indent(depth)}fly_velocity_direction(${dir}, ${spd});`);
        break;
      }

      case 'wb_fly_3axis': {
        const dx = current.getFieldValue('DX') ?? 50;
        const dy = current.getFieldValue('DY') ?? 50;
        const dz = current.getFieldValue('DZ') ?? 50;
        const spd = current.getFieldValue('SPEED') ?? 30;
        lines.push(`${indent(depth)}fly_move_3axis(${dx}, ${dy}, ${dz}, ${spd});`);
        break;
      }

      case 'wb_joystick': {
        const pitch = current.getFieldValue('PITCH') ?? 50;
        const roll = current.getFieldValue('ROLL') ?? 50;
        const thr = current.getFieldValue('THROTTLE') ?? 50;
        const yaw = current.getFieldValue('YAW') ?? 50;
        lines.push(`${indent(depth)}fly_set_joystick(${pitch}, ${roll}, ${thr}, ${yaw});`);
        break;
      }

      case 'wb_hover':
        lines.push(`${indent(depth)}fly_hover(); // Dừng di chuyển và lơ lửng`);
        break;

      case 'wb_hover_altitude': {
        const h = current.getFieldValue('HEIGHT') ?? 20;
        lines.push(`${indent(depth)}fly_hover_altitude(${h});`);
        break;
      }

      case 'wb_emergency_stop':
        lines.push(`${indent(depth)}fly_emergency_stop(); // DỪNG KHẨN CẤP`);
        break;

      case 'wb_set_servo': {
        const port = current.getFieldValue('PORT') ?? 'P2';
        const spd = current.getFieldValue('SPEED') ?? 40;
        const ang = current.getFieldValue('ANGLE') ?? 90;
        lines.push(`${indent(depth)}servo_set_angle(${port}, ${spd}, ${ang});`);
        break;
      }

      // 2. Loops & Timing
      case 'wb_loop_forever': {
        lines.push(`${indent(depth)}while (1) {`);
        const doBlock = current.getInputTargetBlock('DO');
        if (doBlock) generateBlockC(doBlock, lines, depth + 1);
        lines.push(`${indent(depth)}}`);
        break;
      }

      case 'wb_loop_repeat_times': {
        const times = current.getFieldValue('TIMES') ?? 10;
        lines.push(`${indent(depth)}for (int i = 0; i < ${times}; i++) {`);
        const doBlock = current.getInputTargetBlock('DO');
        if (doBlock) generateBlockC(doBlock, lines, depth + 1);
        lines.push(`${indent(depth)}}`);
        break;
      }

      case 'wb_loop_if_repeat': {
        const condBlock = current.getInputTargetBlock('CONDITION');
        const cond = condBlock ? getBlockValueExpression(condBlock) : '1';
        lines.push(`${indent(depth)}while (${cond}) {`);
        const doBlock = current.getInputTargetBlock('DO');
        if (doBlock) generateBlockC(doBlock, lines, depth + 1);
        lines.push(`${indent(depth)}}`);
        break;
      }

      case 'wb_loop_repeat_until': {
        const condBlock = current.getInputTargetBlock('CONDITION');
        const cond = condBlock ? getBlockValueExpression(condBlock) : '0';
        lines.push(`${indent(depth)}while (!(${cond})) {`);
        const doBlock = current.getInputTargetBlock('DO');
        if (doBlock) generateBlockC(doBlock, lines, depth + 1);
        lines.push(`${indent(depth)}}`);
        break;
      }

      case 'wb_loop_break':
        lines.push(`${indent(depth)}break;`);
        break;

      case 'wb_loop_return': {
        const valBlock = current.getInputTargetBlock('VALUE');
        const val = valBlock ? getBlockValueExpression(valBlock) : '';
        lines.push(`${indent(depth)}return ${val};`);
        break;
      }

      case 'wb_loop_wait_seconds': {
        const s = current.getFieldValue('SECONDS') ?? 2;
        lines.push(`${indent(depth)}wait(${s}); // Chờ ${s} giây`);
        break;
      }

      case 'wb_loop_wait_until': {
        const condBlock = current.getInputTargetBlock('CONDITION');
        const cond = condBlock ? getBlockValueExpression(condBlock) : '1';
        lines.push(`${indent(depth)}while (!(${cond})) { wait(0.05); }`);
        break;
      }

      // 3. Logic
      case 'wb_logic_if': {
        const condBlock = current.getInputTargetBlock('IF0');
        const cond = condBlock ? getBlockValueExpression(condBlock) : '1';
        lines.push(`${indent(depth)}if (${cond}) {`);
        const doBlock = current.getInputTargetBlock('DO0');
        if (doBlock) generateBlockC(doBlock, lines, depth + 1);
        lines.push(`${indent(depth)}}`);
        break;
      }

      case 'wb_logic_if_else': {
        const condBlock = current.getInputTargetBlock('IF0');
        const cond = condBlock ? getBlockValueExpression(condBlock) : '1';
        lines.push(`${indent(depth)}if (${cond}) {`);
        const doBlock = current.getInputTargetBlock('DO0');
        if (doBlock) generateBlockC(doBlock, lines, depth + 1);
        lines.push(`${indent(depth)}} else {`);
        const elseBlock = current.getInputTargetBlock('ELSE');
        if (elseBlock) generateBlockC(elseBlock, lines, depth + 1);
        lines.push(`${indent(depth)}}`);
        break;
      }

      // 4. Variables
      case 'wb_var_set': {
        const varName = current.getField('VAR')?.getText() || 'item';
        const valBlock = current.getInputTargetBlock('VALUE');
        const val = valBlock ? getBlockValueExpression(valBlock) : '0';
        lines.push(`${indent(depth)}${varName} = ${val};`);
        break;
      }

      case 'wb_var_change': {
        const varName = current.getField('VAR')?.getText() || 'item';
        const valBlock = current.getInputTargetBlock('DELTA');
        const val = valBlock ? getBlockValueExpression(valBlock) : '1';
        lines.push(`${indent(depth)}${varName} += ${val};`);
        break;
      }

      // 5. AI
      case 'wb_ai_qr_map_mode': {
        const tags = current.getFieldValue('TAGS_PER_ROW') ?? 20;
        const spacing = current.getFieldValue('SPACING') ?? 30;
        lines.push(`${indent(depth)}AI_TagMapInit(PBOARD, ${tags}, ${spacing}); // Khởi tạo bản đồ QR`);
        break;
      }

      case 'wb_ai_fly_to_id': {
        const tag = current.getFieldValue('TAG_ID') ?? 10;
        const power = current.getFieldValue('POWER') ?? 30;
        const ox = current.getFieldValue('OFFSET_X') ?? 0;
        const oy = current.getFieldValue('OFFSET_Y') ?? 0;
        const h = current.getFieldValue('HEIGHT') ?? 100;
        lines.push(`${indent(depth)}AI_GoToTag_v2(${tag}, ${ox}, ${oy}, ${power}, ${h}); // Bay đến Tag ${tag}`);
        break;
      }

      case 'wb_ai_hover_on_id': {
        const tag = current.getFieldValue('TAG_ID') ?? 10;
        const dur = current.getFieldValue('DURATION') ?? 5;
        const ox = current.getFieldValue('OFFSET_X') ?? 0;
        const oy = current.getFieldValue('OFFSET_Y') ?? 0;
        const ang = current.getFieldValue('ANGLE') ?? 0;
        lines.push(`${indent(depth)}AI_LockTag_v2(${tag}, ${dur}, ${ox}, ${oy}, ${ang}); // Khóa trên Tag ${tag}`);
        break;
      }

      case 'wb_ai_landing_at_id': {
        const tag = current.getFieldValue('TAG_ID') ?? 10;
        const power = current.getFieldValue('POWER') ?? 30;
        const ox = current.getFieldValue('OFFSET_X') ?? 0;
        const oy = current.getFieldValue('OFFSET_Y') ?? 0;
        const ang = current.getFieldValue('ANGLE') ?? 0;
        lines.push(`${indent(depth)}AI_LandTag_v2(${tag}, ${power}, ${ang}, ${ox}, ${oy}); // Hạ cánh tại Tag ${tag}`);
        break;
      }

      case 'wb_ai_set_exposure': {
        const exp = current.getFieldValue('EXPOSURE') ?? 1000;
        lines.push(`${indent(depth)}camera_set_exposure(${exp});`);
        break;
      }

      case 'procedures_callnoreturn': {
        const name = current.getFieldValue('NAME') || 'my_procedure';
        lines.push(`${indent(depth)}${name}();`);
        break;
      }

      default:
        lines.push(`${indent(depth)}// chưa có hàm tương ứng cho khối: ${type}`);
        break;
    }

    current = current.getNextBlock();
  }
}

function getBlockValueExpression(block: Blockly.Block): string {
  const type = block.type;

  switch (type) {
    case 'math_number':
      return String(block.getFieldValue('NUM') ?? 0);

    case 'variables_get':
      return block.getField('VAR')?.getText() || 'item';

    case 'wb_get_speed':
      return 'fly_getspeed()';

    case 'wb_sensor_altitude':
      return 'flight_altitude_cm()';

    case 'wb_sensor_laser_fuselage':
      return 'laser_ranging_fuselage_cm()';

    case 'wb_sensor_battery_voltage':
      return 'battery_voltage_v()';

    case 'wb_sensor_mainboard_temp':
      return 'mainboard_temperature()';

    case 'wb_sensor_attitude_angle': {
      const ax = block.getFieldValue('AXIS');
      return `attitude_angle_${ax}()`;
    }

    case 'wb_sensor_angular_velocity': {
      const ax = block.getFieldValue('AXIS');
      return `angular_velocity_${ax.toLowerCase()}()`;
    }

    case 'wb_sensor_acceleration': {
      const ax = block.getFieldValue('AXIS');
      return `acceleration_${ax.toLowerCase()}()`;
    }

    case 'wb_sensor_optical_flow': {
      const ax = block.getFieldValue('AXIS');
      return `optical_flow_${ax.toLowerCase()}()`;
    }

    case 'wb_sensor_ir_ranging_port': {
      const port = block.getFieldValue('PORT');
      return `infrared_ranging_port(${port})`;
    }

    case 'wb_sensor_ir_obstacles_detected': {
      const port = block.getFieldValue('PORT');
      return `infrared_obstacle_detected(${port})`;
    }

    case 'wb_sensor_human_ir_detected': {
      const port = block.getFieldValue('PORT');
      return `human_infrared_detected(${port})`;
    }

    case 'wb_sensor_analog_port_val': {
      const port = block.getFieldValue('PORT');
      return `analog_port_value(${port})`;
    }

    case 'wb_sensor_ultrasonic_distance': {
      const port = block.getFieldValue('PORT');
      return `ultrasonic_distance_cm(${port})`;
    }

    case 'wb_ai_qr_recognition': {
      const prop = block.getFieldValue('PROP');
      return `AI_QR_Recognize_${prop}()`;
    }

    // Logic
    case 'wb_logic_compare_lt': {
      const a = block.getInputTargetBlock('A');
      const b = block.getInputTargetBlock('B');
      return `(${a ? getBlockValueExpression(a) : '0'} < ${b ? getBlockValueExpression(b) : '0'})`;
    }

    case 'wb_logic_compare_gt': {
      const a = block.getInputTargetBlock('A');
      const b = block.getInputTargetBlock('B');
      return `(${a ? getBlockValueExpression(a) : '0'} > ${b ? getBlockValueExpression(b) : '0'})`;
    }

    case 'wb_logic_compare_eq': {
      const a = block.getInputTargetBlock('A');
      const b = block.getInputTargetBlock('B');
      return `(${a ? getBlockValueExpression(a) : '0'} == ${b ? getBlockValueExpression(b) : '0'})`;
    }

    case 'wb_logic_compare_neq': {
      const a = block.getInputTargetBlock('A');
      const b = block.getInputTargetBlock('B');
      return `(${a ? getBlockValueExpression(a) : '0'} != ${b ? getBlockValueExpression(b) : '0'})`;
    }

    case 'wb_logic_and': {
      const a = block.getInputTargetBlock('A');
      const b = block.getInputTargetBlock('B');
      return `(${a ? getBlockValueExpression(a) : '1'} && ${b ? getBlockValueExpression(b) : '1'})`;
    }

    case 'wb_logic_or': {
      const a = block.getInputTargetBlock('A');
      const b = block.getInputTargetBlock('B');
      return `(${a ? getBlockValueExpression(a) : '0'} || ${b ? getBlockValueExpression(b) : '0'})`;
    }

    case 'wb_logic_not': {
      const a = block.getInputTargetBlock('BOOL');
      return `!(${a ? getBlockValueExpression(a) : '0'})`;
    }

    // Math
    case 'wb_math_add': {
      const a = block.getInputTargetBlock('A');
      const b = block.getInputTargetBlock('B');
      return `(${a ? getBlockValueExpression(a) : '0'} + ${b ? getBlockValueExpression(b) : '0'})`;
    }

    case 'wb_math_sub': {
      const a = block.getInputTargetBlock('A');
      const b = block.getInputTargetBlock('B');
      return `(${a ? getBlockValueExpression(a) : '0'} - ${b ? getBlockValueExpression(b) : '0'})`;
    }

    case 'wb_math_mul': {
      const a = block.getInputTargetBlock('A');
      const b = block.getInputTargetBlock('B');
      return `(${a ? getBlockValueExpression(a) : '0'} * ${b ? getBlockValueExpression(b) : '0'})`;
    }

    case 'wb_math_div': {
      const a = block.getInputTargetBlock('A');
      const b = block.getInputTargetBlock('B');
      return `(${a ? getBlockValueExpression(a) : '0'} / ${b ? getBlockValueExpression(b) : '1'})`;
    }

    case 'wb_math_random': {
      const from = block.getFieldValue('FROM') ?? 0;
      const to = block.getFieldValue('TO') ?? 10;
      return `random_range(${from}, ${to})`;
    }

    case 'wb_math_remainder': {
      const a = block.getInputTargetBlock('DIVIDEND');
      const b = block.getInputTargetBlock('DIVISOR');
      return `(${a ? getBlockValueExpression(a) : '0'} % ${b ? getBlockValueExpression(b) : '1'})`;
    }

    case 'wb_math_round': {
      const num = block.getInputTargetBlock('NUM');
      return `round(${num ? getBlockValueExpression(num) : '0'})`;
    }

    case 'wb_math_single': {
      const op = block.getFieldValue('OP');
      const num = block.getInputTargetBlock('NUM');
      const numStr = num ? getBlockValueExpression(num) : '0';
      if (op === 'ABS') return `fabs(${numStr})`;
      if (op === 'ROOT') return `sqrt(${numStr})`;
      if (op === 'FLOOR') return `floor(${numStr})`;
      if (op === 'CEIL') return `ceil(${numStr})`;
      if (op === 'SIN') return `sin(${numStr})`;
      if (op === 'COS') return `cos(${numStr})`;
      if (op === 'TAN') return `tan(${numStr})`;
      if (op === 'ASIN') return `asin(${numStr})`;
      if (op === 'ACOS') return `acos(${numStr})`;
      if (op === 'ATAN') return `atan(${numStr})`;
      if (op === 'LN') return `log(${numStr})`;
      if (op === 'LOG10') return `log10(${numStr})`;
      if (op === 'EXP') return `exp(${numStr})`;
      if (op === 'POW10') return `pow(10, ${numStr})`;
      return numStr;
    }

    default:
      return '0';
  }
}
