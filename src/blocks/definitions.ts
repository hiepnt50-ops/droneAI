/**
 * Blockly Block Definitions for WhalesBot Eagle 1003 Drone
 * Scratch / Zelos style rounded blocks with bilingual VI/EN support
 */

import * as Blockly from 'blockly';

export type AppLanguage = 'vi' | 'en';

export const CATEGORY_COLORS = {
  motion: '#FF5A6E', // Đỏ hồng
  sensors: '#6A5FE0', // Xanh tím
  loops: '#FFAB19', // Cam
  logic: '#2DB8F0', // Xanh dương nhạt
  math: '#55CC55', // Xanh lá
  variables: '#F2C21B', // Vàng
  ai: '#4C6FE6', // Xanh dương
  myblocks: '#9966FF', // Tím
};

let currentLanguage: AppLanguage = 'vi';

export function getAppLanguage(): AppLanguage {
  return currentLanguage;
}

export function setAppLanguage(lang: AppLanguage): void {
  currentLanguage = lang;
  updateBlocklyMessages();
}

export function updateBlocklyMessages(): void {
  const isVi = currentLanguage === 'vi';

  // 1. Motion messages
  Blockly.Msg['WB_ENTER_PITCH_MODE'] = isVi ? 'vào chế độ bay' : 'Entering pitch mode';
  Blockly.Msg['WB_EXIT_PITCH_MODE'] = isVi ? 'thoát chế độ bay' : 'Exit pitch mode';
  Blockly.Msg['WB_TAKEOFF_HEIGHT'] = isVi ? 'tự động cất cánh Độ cao %1 cm' : 'automatic takeoff Height %1 cm';
  Blockly.Msg['WB_TAKEOFF_ALT_FULL'] = isVi
    ? 'cất cánh tự động độ cao %1 cm, tốc độ %2 lệch X %3 độ lệch Y %4 độ'
    : 'Automatic takeoff altitude %1 cm, speed %2 X offset %3 degree Y offset %4 degree';
  Blockly.Msg['WB_LAND'] = isVi ? 'tự động hạ cánh' : 'automatic landing';
  Blockly.Msg['WB_LAND_FULL'] = isVi
    ? 'hạ cánh tự động tốc độ %1 lệch X %2 độ lệch Y %3 độ'
    : 'Automatic descent speed %1 X offset %2 degrees Y offset %3 degrees';
  Blockly.Msg['WB_SET_SPEED'] = isVi ? 'đặt tốc độ bay thành %1 cm/s' : 'set the flight speed to %1 cm/s';
  Blockly.Msg['WB_GET_SPEED'] = isVi ? 'lấy tốc độ đã đặt' : 'get setting speed';
  Blockly.Msg['WB_RISE'] = isVi ? 'bay lên %1 cm' : 'rise %1 cm';
  Blockly.Msg['WB_DOWN'] = isVi ? 'bay xuống %1 cm' : 'down %1 cm';
  Blockly.Msg['WB_FORWARD'] = isVi ? 'bay tiến %1 cm' : 'fly forward %1 cm';
  Blockly.Msg['WB_BACKWARD'] = isVi ? 'bay lùi %1 cm' : 'fly backward %1 cm';
  Blockly.Msg['WB_LEFT'] = isVi ? 'bay sang trái %1 cm' : 'fly left %1 cm';
  Blockly.Msg['WB_RIGHT'] = isVi ? 'bay sang phải %1 cm' : 'fly right %1 cm';
  Blockly.Msg['WB_TURN_LEFT'] = isVi ? 'quay trái %1' : 'turn left %1';
  Blockly.Msg['WB_TURN_RIGHT'] = isVi ? 'quay phải %1' : 'turn right %1';
  Blockly.Msg['WB_FLY_DIR_SPEED'] = isVi
    ? 'bay hướng tốc độ chỉ định %1 cm/s hướng %2 °'
    : 'Flight direction specified speed %1 cm/s direction %2 °';
  Blockly.Msg['WB_FLY_3AXIS'] = isVi
    ? 'bay cự ly chỉ định x %1 cm y %2 cm z %3 cm tốc độ %4 cm/s'
    : 'flight designated distance x %1 cm y %2 cm z %3 cm speed %4 cm/s';
  Blockly.Msg['WB_JOYSTICK'] = isVi
    ? 'đặt 4 cần gạt tay cầm điều khiển pitch %1 roll %2 throttle %3 yaw %4'
    : 'set the four channel lever quantities of the remote control pitch %1 roll %2 throttle %3 yaw %4';
  Blockly.Msg['WB_HOVER'] = isVi ? 'dừng di chuyển và lơ lửng' : 'stop moving and hover';
  Blockly.Msg['WB_HOVER_ALT'] = isVi ? 'lơ lửng ở độ cao chỉ định %1 cm' : 'hover at a specified altitude %1 cm';
  Blockly.Msg['WB_EMERGENCY_STOP'] = isVi ? 'dừng khẩn cấp' : 'emergency stop';
  Blockly.Msg['WB_SET_SERVO'] = isVi
    ? 'đặt servo cổng %1 tốc độ %2 góc %3'
    : 'set the steering gear port %1 speed %2 angle %3';

  // 2. Sensors messages
  Blockly.Msg['WB_SENSOR_ALTITUDE'] = isVi ? 'độ cao bay cm' : 'flight altitude cm';
  Blockly.Msg['WB_SENSOR_LASER_FUSELAGE'] = isVi ? 'đo laser trong thân máy cm' : 'laser ranging inside the fuselage cm';
  Blockly.Msg['WB_SENSOR_BATTERY_VOLT'] = isVi ? 'điện áp pin (V)' : 'Battery voltage (V)';
  Blockly.Msg['WB_SENSOR_MAINBOARD_TEMP'] = isVi ? 'nhiệt độ bo mạch chính (°)' : 'main board temperature (°)';
  Blockly.Msg['WB_SENSOR_ATTITUDE_ANGLE'] = isVi ? 'góc tư thế %1 (°)' : 'attitude angle %1 (°)';
  Blockly.Msg['WB_SENSOR_ANGULAR_VELOCITY'] = isVi ? 'tốc độ góc bay %1 cm/s' : 'flight angular velocity %1 cm/s';
  Blockly.Msg['WB_SENSOR_ACCELERATION'] = isVi ? 'gia tốc bay %1 (1g)' : 'flight acceleration %1 (1g)';
  Blockly.Msg['WB_SENSOR_OPTICAL_FLOW'] = isVi ? 'quang lưu %1 (cm)' : 'optical flow %1 (cm)';
  Blockly.Msg['WB_SENSOR_IR_RANGING'] = isVi
    ? 'cảm biến đo hồng ngoại cổng %1 giá trị'
    : 'infrared ranging sensor port %1 value';
  Blockly.Msg['WB_SENSOR_IR_OBSTACLE'] = isVi
    ? 'cổng hồng ngoại %1 phát hiện vật cản'
    : 'infrared port %1 obstacles detected';
  Blockly.Msg['WB_SENSOR_HUMAN_IR'] = isVi
    ? 'hồng ngoại thân nhiệt cổng %1 phát hiện người'
    : 'human infrared sensor port %1 detects a person';
  Blockly.Msg['WB_SENSOR_ANALOG_PORT'] = isVi
    ? 'giá trị ngõ vào tương tự cổng %1'
    : 'analog input port %1 value';
  Blockly.Msg['WB_SENSOR_ULTRASONIC'] = isVi
    ? 'cảm biến siêu âm cổng %1 khoảng cách cm'
    : 'ultrasonic sensor port %1 detect distance cm';

  // 3. Loops messages
  Blockly.Msg['WB_LOOP_FOREVER'] = isVi ? 'lặp mãi mãi' : 'repeat forever';
  Blockly.Msg['WB_LOOP_REPEAT_N'] = isVi ? 'lặp lại %1 lần' : 'repeat %1 times';
  Blockly.Msg['WB_LOOP_IF_REPEAT'] = isVi ? 'nếu %1 thì lặp' : 'if %1 repeat';
  Blockly.Msg['WB_LOOP_REPEAT_UNTIL'] = isVi ? 'lặp cho đến khi %1' : 'repeat until %1';
  Blockly.Msg['WB_LOOP_BREAK'] = isVi ? 'thoát vòng lặp' : 'break';
  Blockly.Msg['WB_LOOP_RETURN'] = isVi ? 'trả về %1' : 'Return %1';
  Blockly.Msg['WB_LOOP_WAIT_SECS'] = isVi ? 'chờ %1 giây' : 'wait %1 secs.';
  Blockly.Msg['WB_LOOP_WAIT_UNTIL'] = isVi ? 'chờ cho đến khi %1' : 'wait until %1';

  // 4. Logic messages
  Blockly.Msg['WB_LOGIC_IF'] = isVi ? 'nếu %1 thì' : 'if %1 then';
  Blockly.Msg['WB_LOGIC_IF_ELSE'] = isVi ? 'nếu %1 thì' : 'if %1 then';
  Blockly.Msg['WB_LOGIC_ELSE'] = isVi ? 'nếu không' : 'else';

  // 5. Math messages
  Blockly.Msg['WB_MATH_RANDOM'] = isVi ? 'lấy ngẫu nhiên từ %1 đến %2' : 'pick random from %1 to %2';
  Blockly.Msg['WB_MATH_REMAINDER'] = isVi ? 'số dư của phép chia %1 cho %2' : 'the remainder of dividing %1 by %2';
  Blockly.Msg['WB_MATH_ROUND'] = isVi ? 'làm tròn %1' : 'round %1';

  // 6. Variables messages
  Blockly.Msg['WB_VAR_SET'] = isVi ? 'đặt %1 thành %2' : 'set %1 to %2';
  Blockly.Msg['WB_VAR_CHANGE'] = isVi ? 'thay đổi biến %1 một lượng %2' : 'variables %1 by %2';

  // 7. AI messages
  Blockly.Msg['WB_AI_QR_RECOGNITION'] = isVi
    ? 'nhận diện mã QR cổng %1 %2'
    : 'QR code recognition port %1 %2';
  Blockly.Msg['WB_AI_QR_MAP_MODE'] = isVi
    ? 'Chế độ bản đồ QR Cổng %1 %2 ID mỗi Hàng Khoảng cách %3'
    : 'QR Code Map Mode Port %1 %2 IDs per Row Spacing %3';
  Blockly.Msg['WB_AI_FLY_TO_ID'] = isVi
    ? 'Bay đến ID %1 Công suất %2 Lệch X %3 Lệch Y %4 độ cao %5'
    : 'Fly to ID %1 Power %2 X offset %3 Y offset %4 height %5';
  Blockly.Msg['WB_AI_HOVER_ON_ID'] = isVi
    ? 'Lơ lửng trên ID %1 trong %2 s Lệch X %3 Lệch Y %4 góc %5'
    : 'Hover on ID %1 for %2 s X offset %3 Y offset %4 angle %5';
  Blockly.Msg['WB_AI_LANDING_AT_ID'] = isVi
    ? 'Hạ cánh tại ID %1 Công suất %2 Lệch X %3 Lệch Y %4 góc %5'
    : 'Landing at ID %1 Power %2 X offset %3 Y offset %4 angle %5';
  Blockly.Msg['WB_AI_SET_EXPOSURE'] = isVi
    ? 'Đặt phơi sáng mô-đun thị giác tích hợp %1'
    : 'Set the onboard visual module exposure %1';
}

let blocksInitialized = false;

export function initializeDroneBlocks(): void {
  if (blocksInitialized) return;
  blocksInitialized = true;

  updateBlocklyMessages();

  // ==========================================
  // 1) CHUYỂN ĐỘNG (MOTION) - #FF5A6E
  // ==========================================

  // Entering pitch mode
  Blockly.Blocks['wb_enter_pitch_mode'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(Blockly.Msg['WB_ENTER_PITCH_MODE']), 'LABEL');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Entering pitch mode (Vào chế độ bay). Bắt buộc trước khi cất cánh!');
    },
  };

  // Exit pitch mode
  Blockly.Blocks['wb_exit_pitch_mode'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(Blockly.Msg['WB_EXIT_PITCH_MODE']), 'LABEL');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Exit pitch mode (Thoát chế độ bay)');
    },
  };

  // automatic takeoff Height [100] cm
  Blockly.Blocks['wb_takeoff_height'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(getAppLanguage() === 'vi' ? 'tự động cất cánh Độ cao' : 'automatic takeoff Height'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(100, 10, 250), 'HEIGHT')
        .appendField('cm');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Tự động cất cánh lên độ cao chỉ định rồi lơ lửng.');
    },
  };

  // Automatic takeoff altitude [100] cm, speed [100] X offset [0] degree Y offset [0] degree
  Blockly.Blocks['wb_takeoff_full'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'cất cánh tự động độ cao' : 'Automatic takeoff altitude'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(100, 10, 250), 'HEIGHT')
        .appendField(isVi ? 'cm, tốc độ' : 'cm, speed')
        .appendField(new Blockly.FieldNumber(100, 10, 100), 'SPEED')
        .appendField(isVi ? 'lệch X' : 'X offset')
        .appendField(new Blockly.FieldNumber(0, -90, 90), 'OFFSET_X')
        .appendField(isVi ? 'độ lệch Y' : 'degree Y offset')
        .appendField(new Blockly.FieldNumber(0, -90, 90), 'OFFSET_Y')
        .appendField(isVi ? 'độ' : 'degree');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Cất cánh tự động với tốc độ và độ lệch chỉ định.');
    },
  };

  // automatic landing
  Blockly.Blocks['wb_land'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(Blockly.Msg['WB_LAND']), 'LABEL');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Tự động hạ cánh an toàn xuống mặt sàn.');
    },
  };

  // Automatic descent speed [50] X offset [0] degrees Y offset [0] degrees
  Blockly.Blocks['wb_land_full'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'hạ cánh tự động tốc độ' : 'Automatic descent speed'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(50, 10, 100), 'SPEED')
        .appendField(isVi ? 'lệch X' : 'X offset')
        .appendField(new Blockly.FieldNumber(0, -90, 90), 'OFFSET_X')
        .appendField(isVi ? 'độ lệch Y' : 'degrees Y offset')
        .appendField(new Blockly.FieldNumber(0, -90, 90), 'OFFSET_Y')
        .appendField(isVi ? 'độ' : 'degrees');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Hạ cánh tự động với tốc độ và độ lệch chỉ định.');
    },
  };

  // set the flight speed to [50] cm/s
  Blockly.Blocks['wb_set_speed'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'đặt tốc độ bay thành' : 'set the flight speed to'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(50, 10, 100), 'SPEED')
        .appendField('cm/s');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Cài đặt tốc độ bay cho các lệnh di chuyển tiếp theo.');
    },
  };

  // get setting speed (oval reporter)
  Blockly.Blocks['wb_get_speed'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(Blockly.Msg['WB_GET_SPEED']), 'LABEL');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Lấy giá trị tốc độ bay hiện tại đã được cài đặt.');
    },
  };

  // rise [50] cm
  Blockly.Blocks['wb_rise'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'bay lên' : 'rise'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(50, 1, 250), 'DISTANCE')
        .appendField('cm');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Bay lên cao thêm một khoảng cách theo cm.');
    },
  };

  // down [50] cm
  Blockly.Blocks['wb_down'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'bay xuống' : 'down'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(50, 1, 250), 'DISTANCE')
        .appendField('cm');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Bay hạ xuống một khoảng cách theo cm.');
    },
  };

  // fly forward [50] cm
  Blockly.Blocks['wb_forward'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'bay tiến' : 'fly forward'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(50, 1, 300), 'DISTANCE')
        .appendField('cm');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Bay tiến về phía trước theo hướng mũi drone.');
    },
  };

  // fly backward [50] cm
  Blockly.Blocks['wb_backward'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'bay lùi' : 'fly backward'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(50, 1, 300), 'DISTANCE')
        .appendField('cm');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Bay lùi về phía sau theo hướng mũi drone.');
    },
  };

  // fly left [50] cm
  Blockly.Blocks['wb_left'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'bay sang trái' : 'fly left'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(50, 1, 300), 'DISTANCE')
        .appendField('cm');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Bay ngang sang bên trái của drone.');
    },
  };

  // fly right [50] cm
  Blockly.Blocks['wb_right'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'bay sang phải' : 'fly right'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(50, 1, 300), 'DISTANCE')
        .appendField('cm');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Bay ngang sang bên phải của drone.');
    },
  };

  // turn left [90]
  Blockly.Blocks['wb_turn_left'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'quay trái' : 'turn left'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(90, 1, 360), 'ANGLE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Xoay góc hướng (yaw) của drone sang trái.');
    },
  };

  // turn right [90]
  Blockly.Blocks['wb_turn_right'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'quay phải' : 'turn right'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(90, 1, 360), 'ANGLE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Xoay góc hướng (yaw) của drone sang phải.');
    },
  };

  // Flight direction specified speed [30] cm/s direction [0] °
  Blockly.Blocks['wb_fly_dir_speed'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'bay hướng tốc độ' : 'Flight direction specified speed'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(30, 10, 100), 'SPEED')
        .appendField(isVi ? 'cm/s hướng' : 'cm/s direction')
        .appendField(new Blockly.FieldNumber(0, 0, 360), 'DIRECTION')
        .appendField('°');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Bay liên tục theo tốc độ và hướng góc đã cho (0° = thẳng phía trước).');
    },
  };

  // flight designated distance x [50] cm y [50] cm z [50] cm speed [30] cm/s
  Blockly.Blocks['wb_fly_3axis'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'bay cự ly chỉ định x' : 'flight designated distance x'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(50, -200, 200), 'DX')
        .appendField(isVi ? 'cm y' : 'cm y')
        .appendField(new Blockly.FieldNumber(50, -200, 200), 'DY')
        .appendField(isVi ? 'cm z' : 'cm z')
        .appendField(new Blockly.FieldNumber(50, -200, 200), 'DZ')
        .appendField(isVi ? 'cm tốc độ' : 'cm speed')
        .appendField(new Blockly.FieldNumber(30, 10, 100), 'SPEED')
        .appendField('cm/s');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Dịch chuyển tương đối theo 3 trục (mặc định x=tiến, y=trái, z=lên) với tốc độ đã đặt.');
    },
  };

  // set the four channel lever quantities of the remote control pitch [50] roll [50] throttle [50] yaw [50]
  Blockly.Blocks['wb_joystick'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'đặt 4 cần gạt tay cầm pitch' : 'set the four channel lever quantities pitch'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(50, 0, 100), 'PITCH')
        .appendField('roll')
        .appendField(new Blockly.FieldNumber(50, 0, 100), 'ROLL')
        .appendField('throttle')
        .appendField(new Blockly.FieldNumber(50, 0, 100), 'THROTTLE')
        .appendField('yaw')
        .appendField(new Blockly.FieldNumber(50, 0, 100), 'YAW');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Mô phỏng tín hiệu điều khiển tay 4 kênh (50 là trung tính).');
    },
  };

  // stop moving and hover
  Blockly.Blocks['wb_hover'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(Blockly.Msg['WB_HOVER']), 'LABEL');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Dừng các lệnh di chuyển liên tục và lơ lửng tại chỗ.');
    },
  };

  // hover at a specified altitude [20] cm
  Blockly.Blocks['wb_hover_altitude'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'lơ lửng ở độ cao chỉ định' : 'hover at a specified altitude'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(20, 10, 250), 'HEIGHT')
        .appendField('cm');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Điều chỉnh độ cao đến giá trị chỉ định và giữ vị trí lơ lửng.');
    },
  };

  // emergency stop
  Blockly.Blocks['wb_emergency_stop'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(Blockly.Msg['WB_EMERGENCY_STOP']), 'LABEL');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#D32F2F');
      this.setTooltip('Dừng khẩn cấp: Cắt nguồn động cơ ngay lập tức.');
    },
  };

  // set the steering gear port [P2] speed [40] angle [90]
  Blockly.Blocks['wb_set_servo'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'đặt servo cổng' : 'set the steering gear port'), 'PREFIX')
        .appendField(
          new Blockly.FieldDropdown([
            ['P1', 'P1'],
            ['P2', 'P2'],
            ['P3', 'P3'],
            ['P4', 'P4'],
          ]),
          'PORT'
        )
        .appendField(isVi ? 'tốc độ' : 'speed')
        .appendField(new Blockly.FieldNumber(40, 1, 100), 'SPEED')
        .appendField(isVi ? 'góc' : 'angle')
        .appendField(new Blockly.FieldNumber(90, 0, 180), 'ANGLE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.motion);
      this.setTooltip('Điều khiển mô tơ servo xoay góc với tốc độ chỉ định.');
    },
  };

  // ==========================================
  // 2) CẢM BIẾN (SENSORS) - #6A5FE0
  // ==========================================

  // flight altitude cm (oval)
  Blockly.Blocks['wb_sensor_altitude'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(Blockly.Msg['WB_SENSOR_ALTITUDE']), 'LABEL');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.sensors);
    },
  };

  // laser ranging inside the fuselage cm (oval)
  Blockly.Blocks['wb_sensor_laser_fuselage'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(Blockly.Msg['WB_SENSOR_LASER_FUSELAGE']), 'LABEL');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.sensors);
    },
  };

  // Battery voltage (V) (oval)
  Blockly.Blocks['wb_sensor_battery_voltage'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(Blockly.Msg['WB_SENSOR_BATTERY_VOLT']), 'LABEL');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.sensors);
    },
  };

  // main board temperature (°) (oval)
  Blockly.Blocks['wb_sensor_mainboard_temp'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(Blockly.Msg['WB_SENSOR_MAINBOARD_TEMP']), 'LABEL');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.sensors);
    },
  };

  // attitude angle [pitch | roll | yaw] (°) (oval)
  Blockly.Blocks['wb_sensor_attitude_angle'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'góc tư thế' : 'attitude angle'), 'PREFIX')
        .appendField(
          new Blockly.FieldDropdown([
            ['pitch', 'pitch'],
            ['roll', 'roll'],
            ['yaw', 'yaw'],
          ]),
          'AXIS'
        )
        .appendField('(°)');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.sensors);
    },
  };

  // flight angular velocity [X | Y | Z] cm/s (oval)
  Blockly.Blocks['wb_sensor_angular_velocity'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'tốc độ góc bay' : 'flight angular velocity'), 'PREFIX')
        .appendField(
          new Blockly.FieldDropdown([
            ['X', 'X'],
            ['Y', 'Y'],
            ['Z', 'Z'],
          ]),
          'AXIS'
        )
        .appendField('cm/s');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.sensors);
    },
  };

  // flight acceleration [X | Y | Z] (1g) (oval)
  Blockly.Blocks['wb_sensor_acceleration'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'gia tốc bay' : 'flight acceleration'), 'PREFIX')
        .appendField(
          new Blockly.FieldDropdown([
            ['X', 'X'],
            ['Y', 'Y'],
            ['Z', 'Z'],
          ]),
          'AXIS'
        )
        .appendField('(1g)');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.sensors);
    },
  };

  // optical flow [X | Y] (cm) (oval)
  Blockly.Blocks['wb_sensor_optical_flow'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'quang lưu' : 'optical flow'), 'PREFIX')
        .appendField(
          new Blockly.FieldDropdown([
            ['X', 'X'],
            ['Y', 'Y'],
          ]),
          'AXIS'
        )
        .appendField('(cm)');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.sensors);
    },
  };

  // infrared ranging sensor port [P1] value (oval)
  Blockly.Blocks['wb_sensor_ir_ranging_port'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'cảm biến đo hồng ngoại cổng' : 'infrared ranging sensor port'), 'PREFIX')
        .appendField(
          new Blockly.FieldDropdown([
            ['P1', 'P1'],
            ['P2', 'P2'],
            ['P3', 'P3'],
            ['P4', 'P4'],
          ]),
          'PORT'
        )
        .appendField(isVi ? 'giá trị' : 'value');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.sensors);
    },
  };

  // infrared port [P1] obstacles detected (boolean / diamond)
  Blockly.Blocks['wb_sensor_ir_obstacles_detected'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'cổng hồng ngoại' : 'infrared port'), 'PREFIX')
        .appendField(
          new Blockly.FieldDropdown([
            ['P1', 'P1'],
            ['P2', 'P2'],
            ['P3', 'P3'],
            ['P4', 'P4'],
          ]),
          'PORT'
        )
        .appendField(isVi ? 'phát hiện vật cản' : 'obstacles detected');
      this.setOutput(true, 'Boolean');
      this.setColour(CATEGORY_COLORS.sensors);
    },
  };

  // human infrared sensor port [P1] detects a person (boolean / diamond)
  Blockly.Blocks['wb_sensor_human_ir_detected'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'hồng ngoại thân nhiệt cổng' : 'human infrared sensor port'), 'PREFIX')
        .appendField(
          new Blockly.FieldDropdown([
            ['P1', 'P1'],
            ['P2', 'P2'],
            ['P3', 'P3'],
            ['P4', 'P4'],
          ]),
          'PORT'
        )
        .appendField(isVi ? 'phát hiện người' : 'detects a person');
      this.setOutput(true, 'Boolean');
      this.setColour(CATEGORY_COLORS.sensors);
    },
  };

  // analog input port [P1] value (oval)
  Blockly.Blocks['wb_sensor_analog_port_val'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'giá trị ngõ vào tương tự cổng' : 'analog input port'), 'PREFIX')
        .appendField(
          new Blockly.FieldDropdown([
            ['P1', 'P1'],
            ['P2', 'P2'],
            ['P3', 'P3'],
            ['P4', 'P4'],
          ]),
          'PORT'
        )
        .appendField(isVi ? '' : 'value');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.sensors);
    },
  };

  // ultrasonic sensor port [P1] detect distance cm (oval)
  Blockly.Blocks['wb_sensor_ultrasonic_distance'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'cảm biến siêu âm cổng' : 'ultrasonic sensor port'), 'PREFIX')
        .appendField(
          new Blockly.FieldDropdown([
            ['P1', 'P1'],
            ['P2', 'P2'],
            ['P3', 'P3'],
            ['P4', 'P4'],
          ]),
          'PORT'
        )
        .appendField(isVi ? 'khoảng cách cm' : 'detect distance cm');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.sensors);
    },
  };

  // ==========================================
  // 3) VÒNG LẶP (LOOPS) - #FFAB19
  // ==========================================

  // repeat forever
  Blockly.Blocks['wb_loop_forever'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(Blockly.Msg['WB_LOOP_FOREVER']), 'LABEL');
      this.appendStatementInput('DO');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.loops);
    },
  };

  // repeat [10] times
  Blockly.Blocks['wb_loop_repeat_times'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'lặp lại' : 'repeat'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(10, 1, 1000), 'TIMES')
        .appendField(isVi ? 'lần' : 'times');
      this.appendStatementInput('DO');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.loops);
    },
  };

  // if <> repeat
  Blockly.Blocks['wb_loop_if_repeat'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendValueInput('CONDITION')
        .setCheck('Boolean')
        .appendField(new Blockly.FieldLabel(isVi ? 'nếu' : 'if'), 'PREFIX');
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'thì lặp' : 'repeat'), 'SUFFIX');
      this.appendStatementInput('DO');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.loops);
    },
  };

  // repeat until <>
  Blockly.Blocks['wb_loop_repeat_until'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendValueInput('CONDITION')
        .setCheck('Boolean')
        .appendField(new Blockly.FieldLabel(isVi ? 'lặp cho đến khi' : 'repeat until'), 'PREFIX');
      this.appendStatementInput('DO');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.loops);
    },
  };

  // break
  Blockly.Blocks['wb_loop_break'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(Blockly.Msg['WB_LOOP_BREAK']), 'LABEL');
      this.setPreviousStatement(true, null);
      this.setColour(CATEGORY_COLORS.loops);
    },
  };

  // Return [ ]
  Blockly.Blocks['wb_loop_return'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendValueInput('VALUE')
        .appendField(new Blockly.FieldLabel(isVi ? 'trả về' : 'Return'), 'PREFIX');
      this.setPreviousStatement(true, null);
      this.setColour(CATEGORY_COLORS.loops);
    },
  };

  // wait [2] secs.
  Blockly.Blocks['wb_loop_wait_seconds'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'chờ' : 'wait'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(2, 0.1, 100), 'SECONDS')
        .appendField(isVi ? 'giây' : 'secs.');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.loops);
    },
  };

  // wait until <>
  Blockly.Blocks['wb_loop_wait_until'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendValueInput('CONDITION')
        .setCheck('Boolean')
        .appendField(new Blockly.FieldLabel(isVi ? 'chờ cho đến khi' : 'wait until'), 'PREFIX');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.loops);
    },
  };

  // ==========================================
  // 4) LOGIC - #2DB8F0
  // ==========================================

  // if <> then
  Blockly.Blocks['wb_logic_if'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendValueInput('IF0')
        .setCheck('Boolean')
        .appendField(new Blockly.FieldLabel(isVi ? 'nếu' : 'if'), 'PREFIX');
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'thì' : 'then'), 'SUFFIX');
      this.appendStatementInput('DO0');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.logic);
    },
  };

  // if <> then ... else
  Blockly.Blocks['wb_logic_if_else'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendValueInput('IF0')
        .setCheck('Boolean')
        .appendField(new Blockly.FieldLabel(isVi ? 'nếu' : 'if'), 'PREFIX');
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'thì' : 'then'), 'SUFFIX');
      this.appendStatementInput('DO0');
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'nếu không' : 'else'), 'ELSE_LABEL');
      this.appendStatementInput('ELSE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.logic);
    },
  };

  // [ ] < [ ]
  Blockly.Blocks['wb_logic_compare_lt'] = {
    init: function () {
      this.appendValueInput('A');
      this.appendDummyInput().appendField('<');
      this.appendValueInput('B');
      this.setOutput(true, 'Boolean');
      this.setColour(CATEGORY_COLORS.logic);
    },
  };

  // [ ] > [ ]
  Blockly.Blocks['wb_logic_compare_gt'] = {
    init: function () {
      this.appendValueInput('A');
      this.appendDummyInput().appendField('>');
      this.appendValueInput('B');
      this.setOutput(true, 'Boolean');
      this.setColour(CATEGORY_COLORS.logic);
    },
  };

  // [ ] = [ ]
  Blockly.Blocks['wb_logic_compare_eq'] = {
    init: function () {
      this.appendValueInput('A');
      this.appendDummyInput().appendField('=');
      this.appendValueInput('B');
      this.setOutput(true, 'Boolean');
      this.setColour(CATEGORY_COLORS.logic);
    },
  };

  // [ ] not equal [ ]
  Blockly.Blocks['wb_logic_compare_neq'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendValueInput('A');
      this.appendDummyInput().appendField(new Blockly.FieldLabel(isVi ? 'khác' : 'not equal'), 'LABEL');
      this.appendValueInput('B');
      this.setOutput(true, 'Boolean');
      this.setColour(CATEGORY_COLORS.logic);
    },
  };

  // <> and <>
  Blockly.Blocks['wb_logic_and'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendValueInput('A').setCheck('Boolean');
      this.appendDummyInput().appendField(new Blockly.FieldLabel(isVi ? 'và' : 'and'), 'LABEL');
      this.appendValueInput('B').setCheck('Boolean');
      this.setOutput(true, 'Boolean');
      this.setColour(CATEGORY_COLORS.logic);
    },
  };

  // <> or <>
  Blockly.Blocks['wb_logic_or'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendValueInput('A').setCheck('Boolean');
      this.appendDummyInput().appendField(new Blockly.FieldLabel(isVi ? 'hoặc' : 'or'), 'LABEL');
      this.appendValueInput('B').setCheck('Boolean');
      this.setOutput(true, 'Boolean');
      this.setColour(CATEGORY_COLORS.logic);
    },
  };

  // not <>
  Blockly.Blocks['wb_logic_not'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendValueInput('BOOL')
        .setCheck('Boolean')
        .appendField(new Blockly.FieldLabel(isVi ? 'không' : 'not'), 'LABEL');
      this.setOutput(true, 'Boolean');
      this.setColour(CATEGORY_COLORS.logic);
    },
  };

  // ==========================================
  // 5) TOÁN (MATH) - #55CC55
  // ==========================================

  // [10] + [10]
  Blockly.Blocks['wb_math_add'] = {
    init: function () {
      this.appendValueInput('A').setCheck('Number');
      this.appendDummyInput().appendField('+');
      this.appendValueInput('B').setCheck('Number');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.math);
    },
  };

  // [10] - [10]
  Blockly.Blocks['wb_math_sub'] = {
    init: function () {
      this.appendValueInput('A').setCheck('Number');
      this.appendDummyInput().appendField('-');
      this.appendValueInput('B').setCheck('Number');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.math);
    },
  };

  // [10] x [10]
  Blockly.Blocks['wb_math_mul'] = {
    init: function () {
      this.appendValueInput('A').setCheck('Number');
      this.appendDummyInput().appendField('×');
      this.appendValueInput('B').setCheck('Number');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.math);
    },
  };

  // [10] / [10]
  Blockly.Blocks['wb_math_div'] = {
    init: function () {
      this.appendValueInput('A').setCheck('Number');
      this.appendDummyInput().appendField('÷');
      this.appendValueInput('B').setCheck('Number');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.math);
    },
  };

  // pick random from [0] to [10]
  Blockly.Blocks['wb_math_random'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'lấy ngẫu nhiên từ' : 'pick random from'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(0), 'FROM')
        .appendField(isVi ? 'đến' : 'to')
        .appendField(new Blockly.FieldNumber(10), 'TO');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.math);
    },
  };

  // the remainder of dividing [ ] by [ ]
  Blockly.Blocks['wb_math_remainder'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendValueInput('DIVIDEND')
        .setCheck('Number')
        .appendField(new Blockly.FieldLabel(isVi ? 'số dư của' : 'the remainder of dividing'), 'PREFIX');
      this.appendValueInput('DIVISOR')
        .setCheck('Number')
        .appendField(isVi ? 'chia cho' : 'by');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.math);
    },
  };

  // round [ ]
  Blockly.Blocks['wb_math_round'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendValueInput('NUM')
        .setCheck('Number')
        .appendField(new Blockly.FieldLabel(isVi ? 'làm tròn' : 'round'), 'PREFIX');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.math);
    },
  };

  // [abs | floor | ceiling | sqrt | sin | cos | tan | asin | acos | atan | ln | log | e^ | 10^] [ ]
  Blockly.Blocks['wb_math_single'] = {
    init: function () {
      this.appendValueInput('NUM')
        .setCheck('Number')
        .appendField(
          new Blockly.FieldDropdown([
            ['abs', 'ABS'],
            ['floor', 'FLOOR'],
            ['ceiling', 'CEIL'],
            ['sqrt', 'ROOT'],
            ['sin', 'SIN'],
            ['cos', 'COS'],
            ['tan', 'TAN'],
            ['asin', 'ASIN'],
            ['acos', 'ACOS'],
            ['atan', 'ATAN'],
            ['ln', 'LN'],
            ['log', 'LOG10'],
            ['e ^', 'EXP'],
            ['10 ^', 'POW10'],
          ]),
          'OP'
        );
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.math);
    },
  };

  // Number literal block
  Blockly.Blocks['math_number'] = {
    init: function () {
      this.appendDummyInput().appendField(new Blockly.FieldNumber(0), 'NUM');
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.math);
    },
  };

  // ==========================================
  // 6) BIẾN (VARIABLES) - #F2C21B
  // ==========================================

  // set [tên biến] to [0]
  Blockly.Blocks['wb_var_set'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendValueInput('VALUE')
        .appendField(new Blockly.FieldLabel(isVi ? 'đặt' : 'set'), 'PREFIX')
        .appendField(new Blockly.FieldVariable('item'), 'VAR')
        .appendField(new Blockly.FieldLabel(isVi ? 'thành' : 'to'), 'SUFFIX');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.variables);
    },
  };

  // variables [tên biến] by [1]
  Blockly.Blocks['wb_var_change'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendValueInput('DELTA')
        .setCheck('Number')
        .appendField(new Blockly.FieldLabel(isVi ? 'thay đổi biến' : 'variables'), 'PREFIX')
        .appendField(new Blockly.FieldVariable('item'), 'VAR')
        .appendField(new Blockly.FieldLabel(isVi ? 'một lượng' : 'by'), 'SUFFIX');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.variables);
    },
  };

  // ==========================================
  // 7) AI - #4C6FE6
  // ==========================================

  // QR code recognition port [Onboard] [ID] (oval)
  Blockly.Blocks['wb_ai_qr_recognition'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'nhận diện mã QR cổng' : 'QR code recognition port'), 'PREFIX')
        .appendField(
          new Blockly.FieldDropdown([
            ['Onboard', 'ONBOARD'],
            ['P1', 'P1'],
            ['P2', 'P2'],
          ]),
          'PORT'
        )
        .appendField(
          new Blockly.FieldDropdown([
            ['ID', 'ID'],
            ['X', 'X'],
            ['Y', 'Y'],
            ['Yaw', 'YAW'],
          ]),
          'PROP'
        );
      this.setOutput(true, 'Number');
      this.setColour(CATEGORY_COLORS.ai);
      this.setTooltip('Trả về ID của AprilTag đang thấy (-1 nếu không thấy)');
    },
  };

  // QR Code Map Mode Port [Onboard] [20] IDs per Row Spacing [30]
  Blockly.Blocks['wb_ai_qr_map_mode'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'Chế độ bản đồ QR Cổng' : 'QR Code Map Mode Port'), 'PREFIX')
        .appendField(
          new Blockly.FieldDropdown([
            ['Onboard', 'ONBOARD'],
            ['P1', 'P1'],
          ]),
          'PORT'
        )
        .appendField(new Blockly.FieldNumber(20, 2, 50), 'TAGS_PER_ROW')
        .appendField(isVi ? 'ID mỗi Hàng Khoảng cách' : 'IDs per Row Spacing')
        .appendField(new Blockly.FieldNumber(30, 10, 100), 'SPACING');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.ai);
      this.setTooltip('Cài đặt thông số lưới bản đồ QR code / AprilTag');
    },
  };

  // Fly to ID [10] Power [30] X offset [0] Y offset [0] height [100]
  Blockly.Blocks['wb_ai_fly_to_id'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'Bay đến ID' : 'Fly to ID'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(10, 0, 999), 'TAG_ID')
        .appendField(isVi ? 'Công suất' : 'Power')
        .appendField(new Blockly.FieldNumber(30, 10, 100), 'POWER')
        .appendField(isVi ? 'Lệch X' : 'X offset')
        .appendField(new Blockly.FieldNumber(0, -50, 50), 'OFFSET_X')
        .appendField(isVi ? 'Lệch Y' : 'Y offset')
        .appendField(new Blockly.FieldNumber(0, -50, 50), 'OFFSET_Y')
        .appendField(isVi ? 'độ cao' : 'height')
        .appendField(new Blockly.FieldNumber(100, 50, 150), 'HEIGHT');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.ai);
      this.setTooltip('Bay chính xác đến AprilTag ID (độ cao nhận diện: 50-150 cm)');
    },
  };

  // Hover on ID [10] for [5] s X offset [0] Y offset [0] angle [0]
  Blockly.Blocks['wb_ai_hover_on_id'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'Lơ lửng trên ID' : 'Hover on ID'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(10, 0, 999), 'TAG_ID')
        .appendField(isVi ? 'trong' : 'for')
        .appendField(new Blockly.FieldNumber(5, 1, 60), 'DURATION')
        .appendField(isVi ? 's Lệch X' : 's X offset')
        .appendField(new Blockly.FieldNumber(0, -50, 50), 'OFFSET_X')
        .appendField(isVi ? 'Lệch Y' : 'Y offset')
        .appendField(new Blockly.FieldNumber(0, -50, 50), 'OFFSET_Y')
        .appendField(isVi ? 'góc' : 'angle')
        .appendField(new Blockly.FieldNumber(0, 0, 360), 'ANGLE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.ai);
    },
  };

  // Landing at ID [10] Power [30] X offset [0] Y offset [0] angle [0]
  Blockly.Blocks['wb_ai_landing_at_id'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'Hạ cánh tại ID' : 'Landing at ID'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(10, 0, 999), 'TAG_ID')
        .appendField(isVi ? 'Công suất' : 'Power')
        .appendField(new Blockly.FieldNumber(30, 10, 100), 'POWER')
        .appendField(isVi ? 'Lệch X' : 'X offset')
        .appendField(new Blockly.FieldNumber(0, -50, 50), 'OFFSET_X')
        .appendField(isVi ? 'Lệch Y' : 'Y offset')
        .appendField(new Blockly.FieldNumber(0, -50, 50), 'OFFSET_Y')
        .appendField(isVi ? 'góc' : 'angle')
        .appendField(new Blockly.FieldNumber(0, 0, 360), 'ANGLE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.ai);
    },
  };

  // Set the onboard visual module exposure [1000]
  Blockly.Blocks['wb_ai_set_exposure'] = {
    init: function () {
      const isVi = getAppLanguage() === 'vi';
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabel(isVi ? 'Đặt phơi sáng mô-đun thị giác tích hợp' : 'Set the onboard visual module exposure'), 'PREFIX')
        .appendField(new Blockly.FieldNumber(1000, 100, 5000), 'EXPOSURE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.ai);
    },
  };
}
