/**
 * Blockly Toolbox Configuration for WhalesBot Eagle 1003
 * Scratch-style categories with 8 exact colors
 */

import { CATEGORY_COLORS } from './definitions';

export function getDroneToolbox(lang: 'vi' | 'en' = 'vi') {
  const isVi = lang === 'vi';

  return {
    kind: 'categoryToolbox',
    contents: [
      // 1. Chuyển động / Motion (#FF5A6E)
      {
        kind: 'category',
        name: isVi ? 'Chuyển động' : 'Motion',
        colour: CATEGORY_COLORS.motion,
        contents: [
          { kind: 'block', type: 'wb_enter_pitch_mode' },
          { kind: 'block', type: 'wb_exit_pitch_mode' },
          { kind: 'block', type: 'wb_takeoff_height' },
          { kind: 'block', type: 'wb_takeoff_full' },
          { kind: 'block', type: 'wb_land' },
          { kind: 'block', type: 'wb_land_full' },
          { kind: 'block', type: 'wb_set_speed' },
          { kind: 'block', type: 'wb_get_speed' },
          { kind: 'block', type: 'wb_rise' },
          { kind: 'block', type: 'wb_down' },
          { kind: 'block', type: 'wb_forward' },
          { kind: 'block', type: 'wb_backward' },
          { kind: 'block', type: 'wb_left' },
          { kind: 'block', type: 'wb_right' },
          { kind: 'block', type: 'wb_turn_left' },
          { kind: 'block', type: 'wb_turn_right' },
          { kind: 'block', type: 'wb_fly_dir_speed' },
          { kind: 'block', type: 'wb_fly_3axis' },
          { kind: 'block', type: 'wb_joystick' },
          { kind: 'block', type: 'wb_hover' },
          { kind: 'block', type: 'wb_hover_altitude' },
          { kind: 'block', type: 'wb_emergency_stop' },
          { kind: 'block', type: 'wb_set_servo' },
        ],
      },

      // 2. Cảm biến / Sensors (#6A5FE0)
      {
        kind: 'category',
        name: isVi ? 'Cảm biến' : 'Sensors',
        colour: CATEGORY_COLORS.sensors,
        contents: [
          { kind: 'block', type: 'wb_sensor_altitude' },
          { kind: 'block', type: 'wb_sensor_laser_fuselage' },
          { kind: 'block', type: 'wb_sensor_battery_voltage' },
          { kind: 'block', type: 'wb_sensor_mainboard_temp' },
          { kind: 'block', type: 'wb_sensor_attitude_angle' },
          { kind: 'block', type: 'wb_sensor_angular_velocity' },
          { kind: 'block', type: 'wb_sensor_acceleration' },
          { kind: 'block', type: 'wb_sensor_optical_flow' },
          { kind: 'block', type: 'wb_sensor_ir_ranging_port' },
          { kind: 'block', type: 'wb_sensor_ir_obstacles_detected' },
          { kind: 'block', type: 'wb_sensor_human_ir_detected' },
          { kind: 'block', type: 'wb_sensor_analog_port_val' },
          { kind: 'block', type: 'wb_sensor_ultrasonic_distance' },
        ],
      },

      // 3. Vòng lặp / Loops (#FFAB19)
      {
        kind: 'category',
        name: isVi ? 'Vòng lặp' : 'Control',
        colour: CATEGORY_COLORS.loops,
        contents: [
          { kind: 'block', type: 'wb_loop_forever' },
          { kind: 'block', type: 'wb_loop_repeat_times' },
          { kind: 'block', type: 'wb_loop_if_repeat' },
          { kind: 'block', type: 'wb_loop_repeat_until' },
          { kind: 'block', type: 'wb_loop_break' },
          { kind: 'block', type: 'wb_loop_return' },
          { kind: 'block', type: 'wb_loop_wait_seconds' },
          { kind: 'block', type: 'wb_loop_wait_until' },
        ],
      },

      // 4. Logic (#2DB8F0)
      {
        kind: 'category',
        name: isVi ? 'Logic' : 'Logic',
        colour: CATEGORY_COLORS.logic,
        contents: [
          { kind: 'block', type: 'wb_logic_if' },
          { kind: 'block', type: 'wb_logic_if_else' },
          { kind: 'block', type: 'wb_logic_compare_lt' },
          { kind: 'block', type: 'wb_logic_compare_gt' },
          { kind: 'block', type: 'wb_logic_compare_eq' },
          { kind: 'block', type: 'wb_logic_compare_neq' },
          { kind: 'block', type: 'wb_logic_and' },
          { kind: 'block', type: 'wb_logic_or' },
          { kind: 'block', type: 'wb_logic_not' },
        ],
      },

      // 5. Toán / Math (#55CC55)
      {
        kind: 'category',
        name: isVi ? 'Toán' : 'Operators',
        colour: CATEGORY_COLORS.math,
        contents: [
          { kind: 'block', type: 'math_number' },
          { kind: 'block', type: 'wb_math_add' },
          { kind: 'block', type: 'wb_math_sub' },
          { kind: 'block', type: 'wb_math_mul' },
          { kind: 'block', type: 'wb_math_div' },
          { kind: 'block', type: 'wb_math_random' },
          { kind: 'block', type: 'wb_math_remainder' },
          { kind: 'block', type: 'wb_math_round' },
          { kind: 'block', type: 'wb_math_single' },
        ],
      },

      // 6. Biến / Variables (#F2C21B)
      {
        kind: 'category',
        name: isVi ? 'Biến' : 'Variables',
        colour: CATEGORY_COLORS.variables,
        custom: 'VARIABLE',
      },

      // 7. AI (#4C6FE6)
      {
        kind: 'category',
        name: isVi ? 'AI' : 'AI',
        colour: CATEGORY_COLORS.ai,
        contents: [
          { kind: 'block', type: 'wb_ai_qr_recognition' },
          { kind: 'block', type: 'wb_ai_qr_map_mode' },
          { kind: 'block', type: 'wb_ai_fly_to_id' },
          { kind: 'block', type: 'wb_ai_hover_on_id' },
          { kind: 'block', type: 'wb_ai_landing_at_id' },
          { kind: 'block', type: 'wb_ai_set_exposure' },
        ],
      },

      // 8. Khối của tôi / My Blocks (#9966FF)
      {
        kind: 'category',
        name: isVi ? 'Khối của tôi' : 'My Blocks',
        colour: CATEGORY_COLORS.myblocks,
        custom: 'PROCEDURE',
      },
    ],
  };
}
