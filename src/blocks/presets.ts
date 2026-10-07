/**
 * Preset flight programs for WhalesBot Eagle 1003
 */

export interface PresetProgram {
  id: string;
  name: string;
  description: string;
  xml: string;
  category?: 'basic' | 'hash' | 'pinwheel' | 'stick';
  initialObstacles?: any[];
  droneStartPosition?: { x: number; y: number; z: number; yaw?: number };
}

export const PRESET_PROGRAMS: PresetProgram[] = [
  {
    id: 'doc_sample',
    name: '1. Mẫu cơ bản theo tài liệu Eagle 1003',
    description: 'Entering pitch mode, automatic takeoff 80 cm, wait 2s, speed 20, rise 50, forward 50, wait 5s, automatic landing.',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="wb_enter_pitch_mode" x="50" y="40">
    <next>
      <block type="wb_takeoff_height">
        <field name="HEIGHT">80</field>
        <next>
          <block type="wb_loop_wait_seconds">
            <field name="SECONDS">2</field>
            <next>
              <block type="wb_set_speed">
                <field name="SPEED">20</field>
                <next>
                  <block type="wb_rise">
                    <field name="DISTANCE">50</field>
                    <next>
                      <block type="wb_forward">
                        <field name="DISTANCE">50</field>
                        <next>
                          <block type="wb_loop_wait_seconds">
                            <field name="SECONDS">5</field>
                            <next>
                              <block type="wb_land"></block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    id: 'square_dead_reckoning',
    name: '2. Bay hình vuông 100 cm (Đếm bước)',
    description: 'Sử dụng vòng lặp 4 lần: Bay tiến 100 cm rồi Quay phải 90 độ, hạ cánh an toàn.',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="wb_enter_pitch_mode" x="50" y="40">
    <next>
      <block type="wb_takeoff_height">
        <field name="HEIGHT">80</field>
        <next>
          <block type="wb_set_speed">
            <field name="SPEED">30</field>
            <next>
              <block type="wb_loop_repeat_times">
                <field name="TIMES">4</field>
                <statement name="DO">
                  <block type="wb_forward">
                    <field name="DISTANCE">100</field>
                    <next>
                      <block type="wb_turn_right">
                        <field name="ANGLE">90</field>
                        <next>
                          <block type="wb_loop_wait_seconds">
                            <field name="SECONDS">1</field>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </statement>
                <next>
                  <block type="wb_land"></block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    id: 'square_tag_navigation',
    name: '3. Bay hình vuông bằng AI AprilTag (Fly to ID)',
    description: 'Sử dụng QR Code Map Mode và bay chính xác qua các điểm mốc ID 2 -> 4 -> 44 -> 42 -> 2 rồi hạ cánh.',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="wb_ai_qr_map_mode" x="50" y="40">
    <field name="PORT">ONBOARD</field>
    <field name="TAGS_PER_ROW">20</field>
    <field name="SPACING">30</field>
    <next>
      <block type="wb_enter_pitch_mode">
        <next>
          <block type="wb_takeoff_height">
            <field name="HEIGHT">80</field>
            <next>
              <block type="wb_ai_fly_to_id">
                <field name="TAG_ID">2</field>
                <field name="POWER">30</field>
                <field name="OFFSET_X">0</field>
                <field name="OFFSET_Y">0</field>
                <field name="HEIGHT">80</field>
                <next>
                  <block type="wb_ai_fly_to_id">
                    <field name="TAG_ID">4</field>
                    <field name="POWER">30</field>
                    <field name="OFFSET_X">0</field>
                    <field name="OFFSET_Y">0</field>
                    <field name="HEIGHT">80</field>
                    <next>
                      <block type="wb_ai_fly_to_id">
                        <field name="TAG_ID">44</field>
                        <field name="POWER">30</field>
                        <field name="OFFSET_X">0</field>
                        <field name="OFFSET_Y">0</field>
                        <field name="HEIGHT">80</field>
                        <next>
                          <block type="wb_ai_fly_to_id">
                            <field name="TAG_ID">42</field>
                            <field name="POWER">30</field>
                            <field name="OFFSET_X">0</field>
                            <field name="OFFSET_Y">0</field>
                            <field name="HEIGHT">80</field>
                            <next>
                              <block type="wb_ai_fly_to_id">
                                <field name="TAG_ID">2</field>
                                <field name="POWER">30</field>
                                <field name="OFFSET_X">0</field>
                                <field name="OFFSET_Y">0</field>
                                <field name="HEIGHT">80</field>
                                <next>
                                  <block type="wb_ai_landing_at_id">
                                    <field name="TAG_ID">2</field>
                                    <field name="POWER">30</field>
                                    <field name="OFFSET_X">0</field>
                                    <field name="OFFSET_Y">0</field>
                                    <field name="ANGLE">0</field>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    id: 'figure_eight_tag',
    name: '4. Số 8 dùng một hình vuông (hai đường chéo)',
    description: 'Bay hình số 8 bắt chéo qua các điểm nút AprilTag: ID 2 -> chéo lên 44 -> sang 42 -> chéo xuống 4 -> về lại 2.',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="wb_ai_qr_map_mode" x="50" y="40">
    <field name="PORT">ONBOARD</field>
    <field name="TAGS_PER_ROW">20</field>
    <field name="SPACING">30</field>
    <next>
      <block type="wb_enter_pitch_mode">
        <next>
          <block type="wb_takeoff_height">
            <field name="HEIGHT">80</field>
            <next>
              <block type="wb_ai_fly_to_id">
                <field name="TAG_ID">2</field>
                <field name="POWER">30</field>
                <field name="OFFSET_X">0</field>
                <field name="OFFSET_Y">0</field>
                <field name="HEIGHT">80</field>
                <next>
                  <block type="wb_ai_fly_to_id">
                    <field name="TAG_ID">44</field>
                    <field name="POWER">30</field>
                    <field name="OFFSET_X">0</field>
                    <field name="OFFSET_Y">0</field>
                    <field name="HEIGHT">80</field>
                    <next>
                      <block type="wb_ai_fly_to_id">
                        <field name="TAG_ID">42</field>
                        <field name="POWER">30</field>
                        <field name="OFFSET_X">0</field>
                        <field name="OFFSET_Y">0</field>
                        <field name="HEIGHT">80</field>
                        <next>
                          <block type="wb_ai_fly_to_id">
                            <field name="TAG_ID">4</field>
                            <field name="POWER">30</field>
                            <field name="OFFSET_X">0</field>
                            <field name="OFFSET_Y">0</field>
                            <field name="HEIGHT">80</field>
                            <next>
                              <block type="wb_ai_fly_to_id">
                                <field name="TAG_ID">2</field>
                                <field name="POWER">30</field>
                                <field name="OFFSET_X">0</field>
                                <field name="OFFSET_Y">0</field>
                                <field name="HEIGHT">80</field>
                                <next>
                                  <block type="wb_ai_landing_at_id">
                                    <field name="TAG_ID">2</field>
                                    <field name="POWER">30</field>
                                    <field name="OFFSET_X">0</field>
                                    <field name="OFFSET_Y">0</field>
                                    <field name="ANGLE">0</field>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    id: 'wind_compensation',
    name: '5. Tự sửa quỹ đạo khi bị gió đẩy lệch',
    description: 'Sử dụng hệ thống camera AprilTag để tự động bù lệch gió và khóa định vị ổn định trước khi hạ cánh.',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="wb_ai_qr_map_mode" x="50" y="40">
    <field name="PORT">ONBOARD</field>
    <field name="TAGS_PER_ROW">20</field>
    <field name="SPACING">30</field>
    <next>
      <block type="wb_enter_pitch_mode">
        <next>
          <block type="wb_takeoff_height">
            <field name="HEIGHT">80</field>
            <next>
              <block type="wb_ai_fly_to_id">
                <field name="TAG_ID">23</field>
                <field name="POWER">40</field>
                <field name="OFFSET_X">0</field>
                <field name="OFFSET_Y">0</field>
                <field name="HEIGHT">80</field>
                <next>
                  <block type="wb_ai_hover_on_id">
                    <field name="TAG_ID">23</field>
                    <field name="DURATION">4</field>
                    <field name="OFFSET_X">0</field>
                    <field name="OFFSET_Y">0</field>
                    <field name="ANGLE">0</field>
                    <next>
                      <block type="wb_ai_landing_at_id">
                        <field name="TAG_ID">23</field>
                        <field name="POWER">30</field>
                        <field name="OFFSET_X">0</field>
                        <field name="OFFSET_Y">0</field>
                        <field name="ANGLE">0</field>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  // ================= 3 NEW CHALLENGE MISSION PRESETS =================
  {
    id: 'hash_orbit_sample',
    name: '6. Thử thách #: Dấu thăng bay quanh cột',
    description: 'Bố trí 4 cột dấu thăng. Drone bay đến từng góc và lượn quanh từng cột mốc (quét góc ≥ 270°) theo thứ tự.',
    category: 'hash',
    droneStartPosition: { x: 30, y: 30, z: 0, yaw: 0 },
    initialObstacles: [
      { id: 'hash_pole_1', type: 'pole', name: 'Cột #1 (Tây Bắc)', x: 120, y: 180, z: 0, width: 12, depth: 12, height: 110, radius: 6, isInstalled: true, poleIndex: 1 },
      { id: 'hash_pole_2', type: 'pole', name: 'Cột #2 (Đông Bắc)', x: 180, y: 180, z: 0, width: 12, depth: 12, height: 110, radius: 6, isInstalled: true, poleIndex: 2 },
      { id: 'hash_pole_3', type: 'pole', name: 'Cột #3 (Đông Nam)', x: 180, y: 120, z: 0, width: 12, depth: 12, height: 110, radius: 6, isInstalled: true, poleIndex: 3 },
      { id: 'hash_pole_4', type: 'pole', name: 'Cột #4 (Tây Nam)', x: 120, y: 120, z: 0, width: 12, depth: 12, height: 110, radius: 6, isInstalled: true, poleIndex: 4 },
    ],
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="wb_ai_qr_map_mode" x="50" y="40">
    <field name="PORT">ONBOARD</field>
    <field name="TAGS_PER_ROW">20</field>
    <field name="SPACING">30</field>
    <next>
      <block type="wb_enter_pitch_mode">
        <next>
          <block type="wb_takeoff_height">
            <field name="HEIGHT">80</field>
            <next>
              <block type="wb_ai_fly_to_id">
                <field name="TAG_ID">4</field>
                <field name="POWER">35</field>
                <field name="OFFSET_X">0</field>
                <field name="OFFSET_Y">0</field>
                <field name="HEIGHT">80</field>
                <next>
                  <block type="wb_flight_direction_speed">
                    <field name="SPEED">30</field>
                    <field name="DIRECTION">90</field>
                    <next>
                      <block type="wb_ai_fly_to_id">
                        <field name="TAG_ID">24</field>
                        <field name="POWER">35</field>
                        <field name="OFFSET_X">0</field>
                        <field name="OFFSET_Y">0</field>
                        <field name="HEIGHT">80</field>
                        <next>
                          <block type="wb_ai_fly_to_id">
                            <field name="TAG_ID">44</field>
                            <field name="POWER">35</field>
                            <field name="OFFSET_X">0</field>
                            <field name="OFFSET_Y">0</field>
                            <field name="HEIGHT">80</field>
                            <next>
                              <block type="wb_ai_fly_to_id">
                                <field name="TAG_ID">42</field>
                                <field name="POWER">35</field>
                                <field name="OFFSET_X">0</field>
                                <field name="OFFSET_Y">0</field>
                                <field name="HEIGHT">80</field>
                                <next>
                                  <block type="wb_ai_landing_at_id">
                                    <field name="TAG_ID">2</field>
                                    <field name="POWER">30</field>
                                    <field name="OFFSET_X">0</field>
                                    <field name="OFFSET_Y">0</field>
                                    <field name="ANGLE">0</field>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    id: 'hash_strokes_sample',
    name: '7. Thử thách #: Dấu thăng theo nét',
    description: 'Drone bay lần lượt theo 4 nét dấu thăng (#) liên tiếp (2 nét ngang, 2 nét dọc) đi trọn vẹn giữa hai đầu mút.',
    category: 'hash',
    droneStartPosition: { x: 30, y: 30, z: 0, yaw: 0 },
    initialObstacles: [
      { id: 'hash_pole_1', type: 'pole', name: 'Cột #1 (Tây Bắc)', x: 120, y: 180, z: 0, width: 12, depth: 12, height: 110, radius: 6, isInstalled: true, poleIndex: 1 },
      { id: 'hash_pole_2', type: 'pole', name: 'Cột #2 (Đông Bắc)', x: 180, y: 180, z: 0, width: 12, depth: 12, height: 110, radius: 6, isInstalled: true, poleIndex: 2 },
      { id: 'hash_pole_3', type: 'pole', name: 'Cột #3 (Đông Nam)', x: 180, y: 120, z: 0, width: 12, depth: 12, height: 110, radius: 6, isInstalled: true, poleIndex: 3 },
      { id: 'hash_pole_4', type: 'pole', name: 'Cột #4 (Tây Nam)', x: 120, y: 120, z: 0, width: 12, depth: 12, height: 110, radius: 6, isInstalled: true, poleIndex: 4 },
    ],
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="wb_ai_qr_map_mode" x="50" y="40">
    <field name="PORT">ONBOARD</field>
    <field name="TAGS_PER_ROW">20</field>
    <field name="SPACING">30</field>
    <next>
      <block type="wb_enter_pitch_mode">
        <next>
          <block type="wb_takeoff_height">
            <field name="HEIGHT">80</field>
            <next>
              <block type="wb_ai_fly_to_id">
                <field name="TAG_ID">23</field>
                <field name="POWER">35</field>
                <field name="OFFSET_X">0</field>
                <field name="OFFSET_Y">0</field>
                <field name="HEIGHT">80</field>
                <next>
                  <block type="wb_ai_fly_to_id">
                    <field name="TAG_ID">27</field>
                    <field name="POWER">35</field>
                    <field name="OFFSET_X">0</field>
                    <field name="OFFSET_Y">0</field>
                    <field name="HEIGHT">80</field>
                    <next>
                      <block type="wb_ai_fly_to_id">
                        <field name="TAG_ID">47</field>
                        <field name="POWER">35</field>
                        <field name="OFFSET_X">0</field>
                        <field name="OFFSET_Y">0</field>
                        <field name="HEIGHT">80</field>
                        <next>
                          <block type="wb_ai_fly_to_id">
                            <field name="TAG_ID">43</field>
                            <field name="POWER">35</field>
                            <field name="OFFSET_X">0</field>
                            <field name="OFFSET_Y">0</field>
                            <field name="HEIGHT">80</field>
                            <next>
                              <block type="wb_land"></block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    id: 'pinwheel_single_sample',
    name: '8. Thử thách: Chong chóng một cái',
    description: 'Fly to ID đến vị trí chong chóng, hover ở độ cao luồng gió (cao hơn cánh 30 cm) trong 6 giây để quay đủ 3 vòng rồi hạ cánh.',
    category: 'pinwheel',
    droneStartPosition: { x: 30, y: 30, z: 0, yaw: 0 },
    initialObstacles: [
      {
        id: 'pinwheel_main',
        type: 'pinwheel',
        name: 'Chong chóng trung tâm',
        x: 150,
        y: 150,
        z: 0,
        width: 20,
        depth: 20,
        height: 60,
        bladeRadius: 10,
        targetRotations: 3,
        currentRotations: 0,
        currentRotationSpeedDegS: 0,
        maxTimeSec: 30,
      },
    ],
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="wb_ai_qr_map_mode" x="50" y="40">
    <field name="PORT">ONBOARD</field>
    <field name="TAGS_PER_ROW">20</field>
    <field name="SPACING">30</field>
    <next>
      <block type="wb_enter_pitch_mode">
        <next>
          <block type="wb_takeoff_height">
            <field name="HEIGHT">90</field>
            <next>
              <block type="wb_ai_fly_to_id">
                <field name="TAG_ID">25</field>
                <field name="POWER">35</field>
                <field name="OFFSET_X">0</field>
                <field name="OFFSET_Y">0</field>
                <field name="HEIGHT">90</field>
                <next>
                  <block type="wb_ai_hover_on_id">
                    <field name="TAG_ID">25</field>
                    <field name="DURATION">6</field>
                    <field name="OFFSET_X">0</field>
                    <field name="OFFSET_Y">0</field>
                    <field name="ANGLE">0</field>
                    <next>
                      <block type="wb_ai_landing_at_id">
                        <field name="TAG_ID">2</field>
                        <field name="POWER">30</field>
                        <field name="OFFSET_X">0</field>
                        <field name="OFFSET_Y">0</field>
                        <field name="ANGLE">0</field>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    id: 'stick_push_sample',
    name: '9. Thử thách: Đẩy gậy vào đích (60 cm)',
    description: 'Gậy ở giữa sa bàn (150, 150), vùng đích cách 60 cm phía trước (150, 210). Drone bay thấp (25 cm) rồi tiến lên đẩy gậy trượt vào vòng đích.',
    category: 'stick',
    droneStartPosition: { x: 150, y: 110, z: 0, yaw: 0 },
    initialObstacles: [
      {
        id: 'stick_center',
        type: 'stick',
        name: 'Gậy thi đấu',
        x: 150,
        y: 150,
        z: 0,
        width: 40,
        depth: 3,
        height: 3,
        length: 40,
        diameter: 3,
        angleDeg: 0,
        massKg: 0.2,
        frictionCoeff: 0.8,
        velocityX: 0,
        velocityY: 0,
        angularVelocityDegS: 0,
        pushCount: 0,
      },
      {
        id: 'target_zone_front',
        type: 'target_zone',
        name: 'Vùng đích 60cm',
        x: 150,
        y: 210,
        z: 0,
        width: 50,
        depth: 50,
        height: 1,
        radius: 25,
      },
    ],
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="wb_enter_pitch_mode" x="50" y="40">
    <next>
      <block type="wb_takeoff_height">
        <field name="HEIGHT">25</field>
        <next>
          <block type="wb_set_speed">
            <field name="SPEED">40</field>
            <next>
              <block type="wb_forward">
                <field name="DISTANCE">70</field>
                <next>
                  <block type="wb_loop_wait_seconds">
                    <field name="SECONDS">2</field>
                    <next>
                      <block type="wb_land"></block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    id: 'stick_push_off_sample',
    name: '10. Thử thách: Đẩy gậy rơi khỏi bệ',
    description: 'Gậy đặt gần mép sa bàn (y = 250). Drone bay độ cao 25 cm, tăng tốc húc thẳng đẩy thanh gậy rơi ra ngoài mép sân.',
    category: 'stick',
    droneStartPosition: { x: 150, y: 180, z: 0, yaw: 0 },
    initialObstacles: [
      {
        id: 'stick_edge',
        type: 'stick',
        name: 'Gậy gần mép bàn',
        x: 150,
        y: 250,
        z: 0,
        width: 40,
        depth: 3,
        height: 3,
        length: 40,
        diameter: 3,
        angleDeg: 0,
        massKg: 0.15,
        frictionCoeff: 0.5,
        velocityX: 0,
        velocityY: 0,
        angularVelocityDegS: 0,
        pushCount: 0,
      },
      {
        id: 'target_zone_off',
        type: 'target_zone',
        name: 'Vùng rơi bệ',
        x: 150,
        y: 290,
        z: 0,
        width: 60,
        depth: 30,
        height: 1,
        radius: 30,
        allowOffTable: true,
      },
    ],
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="wb_enter_pitch_mode" x="50" y="40">
    <next>
      <block type="wb_takeoff_height">
        <field name="HEIGHT">25</field>
        <next>
          <block type="wb_set_speed">
            <field name="SPEED">60</field>
            <next>
              <block type="wb_forward">
                <field name="DISTANCE">90</field>
                <next>
                  <block type="wb_loop_wait_seconds">
                    <field name="SECONDS">2</field>
                    <next>
                      <block type="wb_land"></block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
];
