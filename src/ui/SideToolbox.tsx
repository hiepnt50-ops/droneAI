/**
 * Unified Side Toolbox Component next to 3D/2D Simulator
 * Combines:
 * - Status Gauges & Telemetry (Trạng thái bay)
 * - Generated C Code (Mã C tương ứng)
 * - Flight Path Analysis (Phân tích đường bay)
 * - Flight Challenges / Tasks (Thử thách bay)
 * - Objects & Arena Layout Editor (Vật thể / Bày trí)
 * - Calibration Parameters (Hiệu chỉnh)
 * - Sensor Ports (Cổng cảm biến P1-P4)
 * - Debug Logs
 */

import React, { useState } from 'react';
import {
  Activity,
  Battery,
  Code2,
  Compass,
  Copy,
  Download,
  Gauge,
  Layers,
  Radio,
  Sliders,
  Terminal,
  Trophy,
  Boxes,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Trash2,
  Plus,
  SlidersHorizontal,
  Wind,
  Save,
  Upload,
} from 'lucide-react';
import {
  CalibrationConfig,
  DroneState,
  FieldObstacle,
  FlightPathPoint,
  ObstacleType,
  RunSummary,
  SensorPortsMap,
  TagGridConfig,
} from '../types/drone';
import { DEFAULT_CALIBRATION } from '../simulator/physics';

export type ToolboxTab =
  | 'status'
  | 'ccode'
  | 'analysis'
  | 'challenges'
  | 'objects'
  | 'calibration'
  | 'sensors'
  | 'debug';

interface ChallengeTask {
  id: string;
  title: string;
  description: string;
  targetAltitude: number;
  targetDistance: number;
  requireLand: boolean;
  maxTimeSec: number;
}

const CHALLENGES_LIST: ChallengeTask[] = [
  {
    id: 'takeoff_hover',
    title: 'Thử thách 1: Cất cánh và lơ lửng',
    description: 'Cất cánh lên độ cao tối thiểu 80 cm và giữ thăng bằng an toàn.',
    targetAltitude: 80,
    targetDistance: 0,
    requireLand: false,
    maxTimeSec: 15,
  },
  {
    id: 'square_flight',
    title: 'Thử thách 2: Chinh phục quỹ đạo vuông',
    description: 'Bay quãng đường ít nhất 150 cm theo hình khép kín và hạ cánh an toàn.',
    targetAltitude: 50,
    targetDistance: 150,
    requireLand: true,
    maxTimeSec: 40,
  },
  {
    id: 'precision_landing',
    title: 'Thử thách 3: Bay xa và hạ cánh chuẩn xác',
    description: 'Bay quãng đường trên 200 cm, độ cao từ 60-120 cm và hoàn thành với pin > 80%.',
    targetAltitude: 60,
    targetDistance: 200,
    requireLand: true,
    maxTimeSec: 60,
  },
];

interface SideToolboxProps {
  // Drone & telemetry
  drone: DroneState;
  cCode: string;
  lastSummary: RunSummary | null;
  savedRunA: RunSummary | null;
  savedRunB: RunSummary | null;
  onSetRunA: (run: RunSummary) => void;
  onSetRunB: (run: RunSummary) => void;
  onCompareRunsOn3D: (runA: RunSummary | null, runB: RunSummary | null) => void;

  // Objects & layout
  obstacles: FieldObstacle[];
  onUpdateObstacles: (obstacles: FieldObstacle[]) => void;
  selectedObstacleId: string | null;
  onSelectObstacle: (id: string | null) => void;
  showArenaObstacles: boolean;
  onToggleShowArena: (show: boolean) => void;
  tagConfig: TagGridConfig;
  onSaveTagConfig: (config: TagGridConfig) => void;

  // Calibration
  calibrationConfig: CalibrationConfig;
  onSaveCalibration: (config: CalibrationConfig) => void;

  // Sensor ports
  portsConfig: SensorPortsMap;
  onOpenSensorPortsModal: () => void;

  // Toolbox state
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: ToolboxTab;
  onChangeTab: (tab: ToolboxTab) => void;

  // Settings
  autoOpenOnObjectSelect: boolean;
  onToggleAutoOpenOnSelect?: (val: boolean) => void;

  language: 'vi' | 'en';
}

export const SideToolbox: React.FC<SideToolboxProps> = ({
  drone,
  cCode,
  lastSummary,
  savedRunA,
  savedRunB,
  onSetRunA,
  onSetRunB,
  onCompareRunsOn3D,
  obstacles,
  onUpdateObstacles,
  selectedObstacleId,
  onSelectObstacle,
  showArenaObstacles,
  onToggleShowArena,
  tagConfig,
  onSaveTagConfig,
  calibrationConfig,
  onSaveCalibration,
  portsConfig,
  onOpenSensorPortsModal,
  isCollapsed,
  onToggleCollapse,
  activeTab,
  onChangeTab,
  autoOpenOnObjectSelect,
  onToggleAutoOpenOnSelect,
  language,
}) => {
  const isVi = language === 'vi';
  const [copied, setCopied] = useState(false);
  const [newObsType, setNewObsType] = useState<ObstacleType>('hoop');

  // Calibration local form state
  const [calibForm, setCalibForm] = useState<CalibrationConfig>({ ...calibrationConfig });
  // Tag local form state
  const [tagForm, setTagForm] = useState<TagGridConfig>({ ...tagConfig });

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(cCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadCode = () => {
    const blob = new Blob([cCode], { type: 'text/x-csrc;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user_main.c';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedObs = obstacles.find(o => o.id === selectedObstacleId);

  const handleAddObstacle = (type: ObstacleType) => {
    const id = 'obs_' + Date.now();
    let newObs: FieldObstacle;

    if (type === 'hoop') {
      newObs = {
        id,
        type: 'hoop',
        name: `Vòng bay #${obstacles.length + 1}`,
        x: 150,
        y: 150,
        z: 30,
        width: 44,
        depth: 5,
        height: 60,
        radius: 22,
        innerRadius: 16,
        centerZ: 80,
      };
    } else if (type === 'pole') {
      newObs = {
        id,
        type: 'pole',
        name: `Cột tiêu #${obstacles.length + 1}`,
        x: 180,
        y: 180,
        z: 0,
        width: 12,
        depth: 12,
        height: 110,
        radius: 6,
      };
    } else if (type === 'barrier') {
      newObs = {
        id,
        type: 'barrier',
        name: `Thanh chắn #${obstacles.length + 1}`,
        x: 150,
        y: 150,
        z: 0,
        width: 60,
        depth: 15,
        height: 40,
      };
    } else if (type === 'human') {
      newObs = {
        id,
        type: 'human',
        name: `Người ảo #${obstacles.length + 1}`,
        x: 120,
        y: 180,
        z: 0,
        width: 25,
        depth: 25,
        height: 80,
      };
    } else {
      newObs = {
        id,
        type: 'flame',
        name: `Nguồn lửa #${obstacles.length + 1}`,
        x: 140,
        y: 140,
        z: 0,
        width: 20,
        depth: 20,
        height: 25,
      };
    }

    const updated = [...obstacles, newObs];
    onUpdateObstacles(updated);
    onSelectObstacle(id);
    if (!showArenaObstacles) {
      onToggleShowArena(true);
    }
  };

  const handleUpdateSelectedObs = (updates: Partial<FieldObstacle>) => {
    if (!selectedObstacleId) return;
    const updated = obstacles.map(o => (o.id === selectedObstacleId ? { ...o, ...updates } : o));
    onUpdateObstacles(updated);
  };

  const handleDeleteSelectedObs = (id: string) => {
    const updated = obstacles.filter(o => o.id !== id);
    onUpdateObstacles(updated);
    if (selectedObstacleId === id) {
      onSelectObstacle(null);
    }
  };

  const batteryColor =
    drone.batteryPercent > 50
      ? 'bg-emerald-500'
      : drone.batteryPercent > 20
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div className="w-full h-full bg-slate-900 border-t border-slate-800 flex flex-col overflow-hidden text-slate-200 relative select-none">
      {/* 1. TOP HEADER & TABS BAR */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-950 border-b border-slate-800 text-xs shrink-0 gap-1 overflow-x-auto">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {/* Tab 1: Trạng thái */}
          <button
            onClick={() => onChangeTab('status')}
            className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'status'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Bảng trạng thái bay chi tiết"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{isVi ? 'Trạng thái' : 'Status'}</span>
          </button>

          {/* Tab 2: Mã C tương ứng */}
          <button
            onClick={() => onChangeTab('ccode')}
            className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'ccode'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Mã nguồn C tương đương từ các khối Blockly"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{isVi ? 'Mã C' : 'C Code'}</span>
          </button>

          {/* Tab 3: Phân tích đường bay */}
          <button
            onClick={() => onChangeTab('analysis')}
            className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'analysis'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Bảng phân tích dữ liệu đường bay và so sánh"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isVi ? 'Phân tích' : 'Analysis'}</span>
            {lastSummary && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
          </button>

          {/* Tab 4: Thử thách */}
          <button
            onClick={() => onChangeTab('challenges')}
            className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'challenges'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Bảng nhiệm vụ và thử thách bay giáo dục"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{isVi ? 'Thử thách' : 'Tasks'}</span>
          </button>

          {/* Tab 5: Vật thể & Bày trí */}
          <button
            onClick={() => onChangeTab('objects')}
            className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'objects'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Bảng quản lý vật cản, người ảo và bày trí sân"
          >
            <Boxes className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isVi ? 'Vật thể' : 'Objects'}</span>
            {obstacles.length > 0 && (
              <span className="px-1 py-0.2 rounded text-[10px] bg-slate-800 text-emerald-300 border border-slate-700">
                {obstacles.length}
              </span>
            )}
          </button>

          {/* Tab 6: Hiệu chỉnh */}
          <button
            onClick={() => onChangeTab('calibration')}
            className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'calibration'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Bảng thông số vật lý và hiệu chỉnh drone"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>{isVi ? 'Hiệu chỉnh' : 'Calib'}</span>
          </button>

          {/* Tab 7: Cảm biến P1-P4 */}
          <button
            onClick={() => onChangeTab('sensors')}
            className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'sensors'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Đọc dữ liệu cảm biến và gán cổng P1-P4"
          >
            <Radio className="w-3.5 h-3.5 text-[#A59DF5]" />
            <span>{isVi ? 'Cảm biến' : 'Sensors'}</span>
          </button>

          {/* Tab 8: Debug log */}
          <button
            onClick={() => onChangeTab('debug')}
            className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'debug'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Nhật ký gỡ lỗi thời gian thực"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>Debug</span>
            {drone.debugLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-cyan-400 border border-slate-700">
                {drone.debugLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Right side controls: Collapse Button (arrow) */}
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          <button
            onClick={onToggleCollapse}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px] font-semibold border border-slate-700 shadow-sm"
            title={
              isCollapsed
                ? isVi
                  ? 'Mở hộp công cụ cạnh khung mô phỏng (phím P)'
                  : 'Expand simulator toolbox (key P)'
                : isVi
                ? 'Thu gọn hộp công cụ cạnh khung mô phỏng (phím P)'
                : 'Collapse simulator toolbox (key P)'
            }
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] text-cyan-300 hidden sm:inline">
                  {isVi ? 'Mở' : 'Expand'}
                </span>
              </>
            ) : (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  {isVi ? 'Thu gọn' : 'Collapse'}
                </span>
              </>
            )}
            <span className="text-[10px] font-mono opacity-60">P</span>
          </button>
        </div>
      </div>

      {/* 2. BODY CONTENT (Only visible when not collapsed) */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-3 text-xs leading-normal">
          {/* ================= TAB 1: STATUS ================= */}
          {activeTab === 'status' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {/* Altitude */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-cyan-400" /> {isVi ? 'Độ cao (Z)' : 'Altitude (Z)'}
                  </span>
                  <div className="mt-1">
                    <span className="text-xl font-bold font-mono text-cyan-400">
                      {drone.position.z.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">cm</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Laser ToF: {drone.laserAltitudeCm.toFixed(1)} cm
                  </div>
                </div>

                {/* X / Y Position */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-emerald-400" /> {isVi ? 'Tọa độ X / Y' : 'Position X / Y'}
                  </span>
                  <div className="mt-1 font-mono text-sm space-y-0.5">
                    <div>
                      <span className="text-slate-500">X: </span>
                      <span className="font-bold text-slate-200">{drone.position.x.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-500"> cm</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Y: </span>
                      <span className="font-bold text-slate-200">{drone.position.y.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-500"> cm</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Quang lưu: ({drone.opticalFlow?.dx?.toFixed(1) ?? '0.0'}, {drone.opticalFlow?.dy?.toFixed(1) ?? '0.0'})
                  </div>
                </div>

                {/* Yaw & Attitude */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-amber-400" /> {isVi ? 'Góc quay (Yaw)' : 'Yaw Angle'}
                  </span>
                  <div className="mt-1">
                    <span className="text-xl font-bold font-mono text-amber-400">
                      {Math.round(drone.yaw)}°
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    P: {drone.pitch.toFixed(1)}° | R: {drone.roll.toFixed(1)}°
                  </div>
                </div>

                {/* Speed */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-purple-400" /> {isVi ? 'Tốc độ đặt' : 'Set Speed'}
                  </span>
                  <div className="mt-1">
                    <span className="text-xl font-bold font-mono text-purple-400">
                      {drone.speed}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">cm/s</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Thực tế: {Math.sqrt(drone.velocity.x ** 2 + drone.velocity.y ** 2 + drone.velocity.z ** 2).toFixed(1)} cm/s
                  </div>
                </div>

                {/* Battery */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Battery className="w-3 h-3 text-emerald-400" /> {isVi ? 'Pin LiPo' : 'Battery'}
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      {drone.batteryVoltage.toFixed(2)}V
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ({Math.round(drone.batteryPercent)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className={`h-full ${batteryColor} transition-all duration-300`}
                      style={{ width: `${Math.max(0, Math.min(100, drone.batteryPercent))}%` }}
                    />
                  </div>
                </div>

                {/* Clock & Status */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-400" /> {isVi ? 'Thời gian bay' : 'Flight Time'}
                  </span>
                  <div className="mt-1">
                    <span className="text-xl font-bold font-mono text-cyan-300">
                      {drone.flightTimeSeconds.toFixed(1)}s
                    </span>
                  </div>
                  <div className="text-[10px] mt-1 flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        drone.isFlying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                      }`}
                    />
                    <span className="text-slate-400">
                      {drone.isEmergencyStopped
                        ? 'DỪNG KHẨN'
                        : drone.isFlying
                        ? 'Đang bay'
                        : drone.isUnlocked
                        ? 'Sẵn sàng'
                        : 'Khóa động cơ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-telemetry strip */}
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500">Nhiệt độ bo mạch:</span>
                  <span className="font-mono text-slate-300">{drone.boardTemp.toFixed(1)} °C</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500">AprilTag thấy được:</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {drone.detectedTagId !== -1 ? `ID #${drone.detectedTagId}` : 'Không thấy'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500">Độ tin cậy tag:</span>
                  <span className="font-mono text-slate-300">{drone.tagConfidence}%</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500">Camera phơi sáng:</span>
                  <span className="font-mono text-slate-300">{drone.cameraExposure}</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: C CODE ================= */}
          {activeTab === 'ccode' && (
            <div className="h-full flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {isVi
                    ? 'Mã nguồn C chuẩn thư viện WhalesBot Eagle 1003 SDK'
                    : 'Generated C source code using WhalesBot Eagle 1003 SDK'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px]"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? (isVi ? 'Đã chép!' : 'Copied!') : isVi ? 'Sao chép' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownloadCode}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px]"
                  >
                    <Download className="w-3 h-3" />
                    <span>{isVi ? 'Tải user_main.c' : 'Download .c'}</span>
                  </button>
                </div>
              </div>

              <pre className="flex-1 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 overflow-auto select-text leading-relaxed">
                {cCode || '// Kéo các khối lệnh để xem mã C tương ứng...'}
              </pre>
            </div>
          )}

          {/* ================= TAB 3: FLIGHT ANALYSIS ================= */}
          {activeTab === 'analysis' && (
            <div className="space-y-3">
              {!lastSummary ? (
                <div className="p-6 text-center text-slate-500 bg-slate-950/60 rounded-xl border border-slate-800">
                  <Activity className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                  <p className="font-medium text-slate-400">
                    {isVi
                      ? 'Chưa có dữ liệu chuyến bay. Hãy nhấn nút "Chạy" để mô phỏng và thu thập báo cáo!'
                      : 'No flight data yet. Run a program to collect flight metrics and telemetry.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                      <div className="text-slate-400 text-[10px]">{isVi ? 'Tổng quãng đường' : 'Distance'}</div>
                      <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                        {lastSummary.totalDistanceCm.toFixed(1)} cm
                      </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                      <div className="text-slate-400 text-[10px]">{isVi ? 'Thời gian bay' : 'Duration'}</div>
                      <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                        {lastSummary.totalTimeSec.toFixed(1)} s
                      </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                      <div className="text-slate-400 text-[10px]">{isVi ? 'Độ cao cực đại' : 'Max Alt'}</div>
                      <div className="text-base font-bold font-mono text-purple-400 mt-0.5">
                        {lastSummary.maxAltitudeCm.toFixed(1)} cm
                      </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                      <div className="text-slate-400 text-[10px]">{isVi ? 'Độ lệch chuẩn đường' : 'Path Error'}</div>
                      <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
                        {lastSummary.averagePathDeviationCm.toFixed(1)} cm
                      </div>
                    </div>
                  </div>

                  {/* Flight summary status */}
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {lastSummary.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-200">
                          {lastSummary.success
                            ? isVi
                              ? 'Chuyến bay hoàn thành thành công'
                              : 'Flight completed successfully'
                            : isVi
                            ? 'Chuyến bay kết thúc với cảnh báo / lỗi'
                            : 'Flight completed with warnings / errors'}
                        </span>
                        {lastSummary.errorMessage && (
                          <p className="text-[11px] text-rose-400 font-mono mt-0.5">
                            {lastSummary.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSetRunA(lastSummary)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-semibold border border-slate-700"
                        title="Lưu vào Chuyến A để so sánh"
                      >
                        {savedRunA?.id === lastSummary.id ? '✓ Đã gán A' : 'Lưu vào A'}
                      </button>
                      <button
                        onClick={() => onSetRunB(lastSummary)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-pink-300 text-[10px] font-semibold border border-slate-700"
                        title="Lưu vào Chuyến B để so sánh"
                      >
                        {savedRunB?.id === lastSummary.id ? '✓ Đã gán B' : 'Lưu vào B'}
                      </button>
                    </div>
                  </div>

                  {/* Comparison preview */}
                  {(savedRunA || savedRunB) && (
                    <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-900/60 flex items-center justify-between">
                      <div className="text-[11px] text-indigo-200">
                        <span>So sánh: </span>
                        <span className="font-mono text-cyan-300">
                          {savedRunA ? `A (${savedRunA.totalDistanceCm.toFixed(0)}cm)` : 'Chưa có A'}
                        </span>
                        <span className="text-slate-500"> vs </span>
                        <span className="font-mono text-pink-300">
                          {savedRunB ? `B (${savedRunB.totalDistanceCm.toFixed(0)}cm)` : 'Chưa có B'}
                        </span>
                      </div>

                      {savedRunA && (
                        <button
                          onClick={() => onCompareRunsOn3D(savedRunA, savedRunB)}
                          className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] shadow"
                        >
                          Hiển thị đường so sánh trên 3D
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 4: CHALLENGES ================= */}
          {activeTab === 'challenges' && (
            <div className="space-y-3">
              <div className="text-[11px] text-slate-400">
                {isVi
                  ? 'Các bài thực hành bay đo lường độ chính xác và kiểm tra kỹ năng lập trình drone:'
                  : 'STEM Flight challenges to test programming accuracy and mission goals:'}
              </div>

              <div className="space-y-2">
                {CHALLENGES_LIST.map((task, idx) => {
                  const isDone =
                    lastSummary &&
                    lastSummary.maxAltitudeCm >= task.targetAltitude &&
                    lastSummary.totalDistanceCm >= task.targetDistance &&
                    (!task.requireLand || (lastSummary.success && !drone.isFlying));

                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-emerald-950/30 border-emerald-700/60 text-slate-200'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="font-bold text-xs flex items-center gap-1.5 text-slate-100">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            )}
                            <span>{task.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{task.description}</p>
                          <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-mono pt-1">
                            <span>Độ cao: ≥ {task.targetAltitude}cm</span>
                            {task.targetDistance > 0 && <span>Quãng đường: ≥ {task.targetDistance}cm</span>}
                            <span>Hạ cánh: {task.requireLand ? 'Bắt buộc' : 'Không'}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-600/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isDone ? 'ĐẠT' : 'CHƯA ĐẠT'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 5: OBJECTS & ARENA LAYOUT ================= */}
          {activeTab === 'objects' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 text-xs">
                  {isVi ? 'Bày trí vật thể trên sân' : 'Arena Obstacles & Objects'}
                </span>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArenaObstacles}
                    onChange={e => onToggleShowArena(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                  />
                  <span>{isVi ? 'Hiển thị trên 3D' : 'Show on 3D'}</span>
                </label>
              </div>

              {/* Add Obstacle Bar */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="text-[11px] text-slate-400">{isVi ? 'Thêm nhanh đối tượng:' : 'Add New Object:'}</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleAddObstacle('hoop')}
                    className="px-2.5 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-700 text-amber-300 font-medium text-[11px] flex items-center gap-1"
                  >
                    <span>🟡 {isVi ? 'Vòng bay' : 'Hoop'}</span>
                  </button>
                  <button
                    onClick={() => handleAddObstacle('pole')}
                    className="px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 font-medium text-[11px] flex items-center gap-1"
                  >
                    <span>🔴 {isVi ? 'Cột tiêu' : 'Pole'}</span>
                  </button>
                  <button
                    onClick={() => handleAddObstacle('barrier')}
                    className="px-2.5 py-1 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-300 font-medium text-[11px] flex items-center gap-1"
                  >
                    <span>🧱 {isVi ? 'Thanh chắn' : 'Barrier'}</span>
                  </button>
                  <button
                    onClick={() => handleAddObstacle('human')}
                    className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-medium text-[11px] flex items-center gap-1"
                  >
                    <span>🚶 {isVi ? 'Người ảo' : 'Human'}</span>
                  </button>
                </div>
              </div>

              {/* Selected Object Property Inspector */}
              {selectedObs ? (
                <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/50 space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <span className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      {selectedObs.name}
                    </span>
                    <button
                      onClick={() => handleDeleteSelectedObs(selectedObs.id)}
                      className="p-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[10px] flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{isVi ? 'Xóa' : 'Delete'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <label className="text-slate-400">X (cm):</label>
                      <input
                        type="number"
                        value={selectedObs.x}
                        onChange={e => handleUpdateSelectedObs({ x: Number(e.target.value) })}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400">Y (cm):</label>
                      <input
                        type="number"
                        value={selectedObs.y}
                        onChange={e => handleUpdateSelectedObs({ y: Number(e.target.value) })}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400">Cao Z (cm):</label>
                      <input
                        type="number"
                        value={selectedObs.z}
                        onChange={e => handleUpdateSelectedObs({ z: Number(e.target.value) })}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2 text-center text-slate-500 text-[11px] italic">
                  {isVi
                    ? 'Nhấn vào vật thể trên khung 3D/2D để chọn và chỉnh sửa tọa độ.'
                    : 'Click an object on the 3D/2D arena to inspect and adjust.'}
                </div>
              )}

              {/* List of existing obstacles */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {obstacles.map(obs => (
                  <div
                    key={obs.id}
                    onClick={() => onSelectObstacle(obs.id)}
                    className={`p-2 rounded-lg border text-[11px] flex items-center justify-between cursor-pointer transition ${
                      selectedObstacleId === obs.id
                        ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200 font-semibold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{obs.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      ({obs.x}, {obs.y}, {obs.z})
                    </span>
                  </div>
                ))}
              </div>

              {/* Setting: Auto open on select */}
              {onToggleAutoOpenOnSelect && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{isVi ? 'Tự mở hộp khi chọn vật thể:' : 'Auto open on object select:'}</span>
                  <input
                    type="checkbox"
                    checked={autoOpenOnObjectSelect}
                    onChange={e => onToggleAutoOpenOnSelect(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 6: CALIBRATION ================= */}
          {activeTab === 'calibration' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 text-xs">
                  {isVi ? 'Thông số vật lý & Hiệu chuẩn Drone' : 'Physical Parameters & Calibration'}
                </span>
                <button
                  onClick={() => {
                    setCalibForm({ ...DEFAULT_CALIBRATION });
                    onSaveCalibration(DEFAULT_CALIBRATION);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Mặc định</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label className="text-slate-400">Tốc độ chuẩn (cm/s):</label>
                  <input
                    type="number"
                    value={calibForm.defaultSpeed}
                    onChange={e => {
                      const next = { ...calibForm, defaultSpeed: Number(e.target.value) };
                      setCalibForm(next);
                      onSaveCalibration(next);
                    }}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Tốc độ cất cánh (cm/s):</label>
                  <input
                    type="number"
                    value={calibForm.takeoffSpeed}
                    onChange={e => {
                      const next = { ...calibForm, takeoffSpeed: Number(e.target.value) };
                      setCalibForm(next);
                      onSaveCalibration(next);
                    }}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Sai số quãng đường (cm):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={calibForm.distanceStdDevCm}
                    onChange={e => {
                      const next = { ...calibForm, distanceStdDevCm: Number(e.target.value) };
                      setCalibForm(next);
                      onSaveCalibration(next);
                    }}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Sai số góc quay (°):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={calibForm.yawErrorDeg}
                    onChange={e => {
                      const next = { ...calibForm, yawErrorDeg: Number(e.target.value) };
                      setCalibForm(next);
                      onSaveCalibration(next);
                    }}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Rộng sân (cm):</label>
                  <input
                    type="number"
                    value={calibForm.fieldWidthCm}
                    onChange={e => {
                      const next = { ...calibForm, fieldWidthCm: Number(e.target.value) };
                      setCalibForm(next);
                      onSaveCalibration(next);
                    }}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Dài sân (cm):</label>
                  <input
                    type="number"
                    value={calibForm.fieldHeightCm}
                    onChange={e => {
                      const next = { ...calibForm, fieldHeightCm: Number(e.target.value) };
                      setCalibForm(next);
                      onSaveCalibration(next);
                    }}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 7: SENSORS P1-P4 ================= */}
          {activeTab === 'sensors' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 text-xs">
                  {isVi ? 'Đọc cảm biến ngoại vi & Cổng P1-P4' : 'Sensor Ports Configuration (P1-P4)'}
                </span>
                <button
                  onClick={onOpenSensorPortsModal}
                  className="px-2 py-0.5 rounded bg-[#6A5FE0]/30 hover:bg-[#6A5FE0]/50 border border-[#6A5FE0]/60 text-[#D2CEFA] font-medium text-[10px]"
                >
                  {isVi ? 'Cấu hình cổng' : 'Config Ports'}
                </button>
              </div>

              {/* External sensor ports values */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['P1', 'P2', 'P3', 'P4'] as const).map(pId => {
                  const port = portsConfig?.[pId] || { type: 'none', direction: 'front' };
                  const portData = drone.portReadings?.[pId] || {
                    distanceCm: 80,
                    obstacle: false,
                    human: false,
                    analogVal: 512,
                  };
                  return (
                    <div key={pId} className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-cyan-400">{pId}</span>
                        <span className="text-[10px] text-slate-400">{port.direction}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{port.type}</div>
                      <div className="pt-1 border-t border-slate-900 font-mono text-xs">
                        <span className="text-slate-400">Đo: </span>
                        <span className="text-emerald-400 font-bold">{portData.distanceCm.toFixed(1)} cm</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex justify-between">
                        <span>Vật cản: {portData.obstacle ? 'CÓ' : 'Không'}</span>
                        <span>Người: {portData.human ? 'CÓ' : 'Không'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 8: DEBUG LOG ================= */}
          {activeTab === 'debug' && (
            <div className="h-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-xs overflow-auto space-y-1">
              {drone.debugLogs.length === 0 ? (
                <div className="text-slate-600 italic py-4 text-center">
                  {isVi ? 'Chưa có thông báo gỡ lỗi nào.' : 'No debug messages logged yet.'}
                </div>
              ) : (
                drone.debugLogs.map(log => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 py-0.5 leading-relaxed ${
                      log.type === 'error'
                        ? 'text-rose-400 font-bold'
                        : log.type === 'warn'
                        ? 'text-amber-400'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-600 select-none">[{log.time.toFixed(1)}s]</span>
                    <span>{log.message}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
