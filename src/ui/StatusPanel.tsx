/**
 * Status and Telemetry Panel with C Code Tab and Sensors
 * WhalesBot Eagle 1003
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
  Wind,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DroneState, RunSummary } from '../types/drone';

interface StatusPanelProps {
  drone: DroneState;
  cCode: string;
  lastSummary: RunSummary | null;
  onOpenAnalysisModal: () => void;
  onOpenSensorPortsModal: () => void;
  language: 'vi' | 'en';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  drone,
  cCode,
  lastSummary,
  onOpenAnalysisModal,
  onOpenSensorPortsModal,
  language,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'ccode' | 'sensors' | 'debug'>('status');
  const [copied, setCopied] = useState(false);

  const isVi = language === 'vi';

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

  const batteryColor =
    drone.batteryPercent > 50
      ? 'bg-emerald-500'
      : drone.batteryPercent > 20
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div className="w-full h-full bg-slate-900 border-t border-slate-800 flex flex-col overflow-hidden text-slate-200">
      {/* Tab Navigation Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'status'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{isVi ? 'Trạng thái bay' : 'Flight Status'}</span>
          </button>

          <button
            onClick={() => setActiveTab('ccode')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'ccode'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{isVi ? 'Mã C tương ứng' : 'Generated C Code'}</span>
          </button>

          <button
            onClick={() => setActiveTab('sensors')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'sensors'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isVi ? 'Cảm biến & Cổng P1-P4' : 'Sensors & Ports'}</span>
          </button>

          <button
            onClick={() => setActiveTab('debug')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'debug'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Debug Log</span>
            {drone.debugLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-cyan-400 border border-slate-700">
                {drone.debugLogs.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSensorPortsModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#6A5FE0]/20 hover:bg-[#6A5FE0]/30 border border-[#6A5FE0]/40 text-[#A59DF5] transition font-medium text-[11px]"
          >
            <Radio className="w-3 h-3" />
            <span>{isVi ? 'Cổng cảm biến (P1-P4)' : 'Sensor Ports'}</span>
          </button>

          {lastSummary && (
            <button
              onClick={onOpenAnalysisModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 transition font-medium text-[11px]"
            >
              <Activity className="w-3 h-3" />
              <span>{isVi ? 'Xem phân tích đường bay' : 'Flight Analysis'}</span>
            </button>
          )}

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px] font-semibold border border-slate-700 shadow-sm"
              title={
                isCollapsed
                  ? isVi
                    ? 'Mở rộng bảng trạng thái (phím P)'
                    : 'Expand status panel (key P)'
                  : isVi
                  ? 'Thu gọn bảng trạng thái (phím P)'
                  : 'Collapse status panel (key P)'
              }
            >
              {isCollapsed ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] text-cyan-300 hidden sm:inline">{isVi ? 'Mở' : 'Expand'}</span>
                </>
              ) : (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-[10px] text-slate-400 hidden sm:inline">{isVi ? 'Thu gọn' : 'Collapse'}</span>
                </>
              )}
              <span className="text-[10px] font-mono opacity-60">P</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-auto p-3">
        {/* TAB 1: FLIGHT STATUS */}
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

              {/* Coordinates X / Y */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-emerald-400" /> {isVi ? 'Tọa độ (X, Y)' : 'Position (X, Y)'}
                </span>
                <div className="mt-1 text-sm font-bold font-mono text-slate-200">
                  X: <span className="text-emerald-400">{drone.position.x.toFixed(1)}</span>
                  <span className="mx-1 text-slate-600">|</span>
                  Y: <span className="text-emerald-400">{drone.position.y.toFixed(1)}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Tag ID: {drone.detectedTagId !== -1 ? drone.detectedTagId : (isVi ? 'Không thấy' : 'None')}
                </div>
              </div>

              {/* Yaw */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-amber-400" /> {isVi ? 'Góc hướng Yaw' : 'Yaw Angle'}
                </span>
                <div className="mt-1">
                  <span className="text-xl font-bold font-mono text-amber-400">
                    {Math.round(drone.yaw)}°
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Pitch: {drone.pitch.toFixed(1)}° | Roll: {drone.roll.toFixed(1)}°
                </div>
              </div>

              {/* Speed */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Wind className="w-3 h-3 text-sky-400" /> {isVi ? 'Tốc độ bay' : 'Flight Speed'}
                </span>
                <div className="mt-1">
                  <span className="text-xl font-bold font-mono text-sky-400">
                    {drone.speed.toFixed(0)}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">cm/s</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {drone.isFlying ? (drone.isHovering ? (isVi ? 'Lơ lửng' : 'Hovering') : (isVi ? 'Di chuyển' : 'Moving')) : (isVi ? 'Mặt đất' : 'Grounded')}
                </div>
              </div>

              {/* Battery */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Battery className="w-3 h-3 text-green-400" /> {isVi ? 'Pin' : 'Battery'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-300">
                    {Math.round(drone.batteryPercent)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-1.5">
                  <div
                    className={`h-full transition-all duration-300 ${batteryColor}`}
                    style={{ width: `${Math.max(0, drone.batteryPercent)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>{drone.batteryVoltage.toFixed(2)} V</span>
                  <span>{isVi ? 'Tối đa ~10p' : '~10 min'}</span>
                </div>
              </div>

              {/* Flight Time */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-purple-400" /> {isVi ? 'Đồng hồ bay' : 'Flight Time'}
                </span>
                <div className="mt-1">
                  <span className="text-xl font-bold font-mono text-purple-400">
                    {drone.flightTimeSeconds.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">{isVi ? 'giây' : 's'}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {isVi ? 'Chế độ: ' : 'Mode: '}
                  {drone.isUnlocked ? (isVi ? 'Đã mở khóa' : 'Unlocked') : (isVi ? 'Đã khóa' : 'Locked')}
                </div>
              </div>
            </div>

            {/* Remote Control 4 Channels & Servo Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-4">
                <span className="text-slate-400 font-medium">
                  {isVi ? 'Cần lái 4 kênh (Four-channel Lever):' : 'RC 4-Channel Levers:'}
                </span>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span>PITCH: <b className="text-cyan-400">{drone.rcChannels.pitch}</b></span>
                  <span>ROLL: <b className="text-cyan-400">{drone.rcChannels.roll}</b></span>
                  <span>THR: <b className="text-cyan-400">{drone.rcChannels.throttle}</b></span>
                  <span>YAW: <b className="text-cyan-400">{drone.rcChannels.yaw}</b></span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-4">
                <span className="text-slate-400 font-medium">
                  {isVi ? 'Bộ chấp hành Servo:' : 'Steering Gear (Servo):'}
                </span>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span>{isVi ? 'Cổng:' : 'Port:'} <b className="text-amber-400">{drone.servoPort}</b></span>
                  <span>{isVi ? 'Góc:' : 'Angle:'} <b className="text-amber-400">{drone.servoAngle}°</b></span>
                  <span>{isVi ? 'Tốc độ:' : 'Speed:'} <b className="text-amber-400">{drone.servoSpeed}</b></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: C CODE GENERATED */}
        {activeTab === 'ccode' && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Eagle1003_SDK Code Generator</span>
                <span className="text-slate-600">|</span>
                <span>{isVi ? 'Tự động sinh mã nguồn trong hàm user_main()' : 'Auto-generated in user_main()'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-all"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? (isVi ? 'Đã chép!' : 'Copied!') : (isVi ? 'Sao chép' : 'Copy')}</span>
                </button>
                <button
                  onClick={handleDownloadCode}
                  className="px-2.5 py-1 text-xs rounded bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1 transition-all"
                >
                  <Download className="w-3 h-3" />
                  <span>{isVi ? 'Tải .c' : 'Download .c'}</span>
                </button>
              </div>
            </div>
            <pre className="flex-1 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300 overflow-auto whitespace-pre leading-relaxed">
              {cCode}
            </pre>
          </div>
        )}

        {/* TAB 3: SENSORS & PORTS P1-P4 */}
        {activeTab === 'sensors' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Column 1: Built-in Sensors */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                <Radio className="w-3.5 h-3.5 text-cyan-400" /> {isVi ? 'Cảm biến thân máy' : 'Fuselage Sensors'}
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">{isVi ? 'Đo laser trong thân máy:' : 'Fuselage laser ranging:'}</span>
                <span className="font-mono text-cyan-400">{drone.laserAltitudeCm.toFixed(1)} cm</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">{isVi ? 'Quang lưu (Optical flow):' : 'Optical flow:'}</span>
                <span className="font-mono text-cyan-400">
                  X: {drone.opticalFlow.dx.toFixed(1)}, Y: {drone.opticalFlow.dy.toFixed(1)} cm
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">{isVi ? 'Gia tốc (Acceleration 1g):' : 'Acceleration (1g):'}</span>
                <span className="font-mono text-cyan-400">
                  X:{drone.acceleration.x} Y:{drone.acceleration.y} Z:{drone.acceleration.z}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">{isVi ? 'Nhiệt độ bo mạch chính:' : 'Mainboard temp:'}</span>
                <span className="font-mono text-amber-400">{drone.boardTemp.toFixed(1)} °</span>
              </div>
            </div>

            {/* Column 2: External Ports P1-P4 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
              <div className="font-semibold text-slate-300 flex items-center justify-between pb-1 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#6A5FE0]" />
                  <span>{isVi ? 'Cổng gắn ngoài P1 - P4' : 'External Ports P1 - P4'}</span>
                </div>
                <button
                  onClick={onOpenSensorPortsModal}
                  className="text-[10px] text-[#A59DF5] hover:underline"
                >
                  {isVi ? 'Cấu hình' : 'Config'}
                </button>
              </div>
              {(['P1', 'P2', 'P3', 'P4'] as const).map(p => {
                const r = drone.portReadings[p];
                return (
                  <div key={p} className="flex justify-between py-1 border-b border-slate-900 font-mono">
                    <span className="text-slate-400 font-semibold">{p}:</span>
                    <span className="text-cyan-400">
                      {r.distanceCm} cm | {r.obstacle ? 'Vật cản' : 'Trống'} | Analog: {r.analogVal}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Column 3: AI Camera & Vision */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                <Radio className="w-3.5 h-3.5 text-blue-400" /> {isVi ? 'Thị giác AI & AprilTag' : 'AI Vision & AprilTag'}
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">{isVi ? 'Nhận diện AprilTag ID:' : 'Recognized Tag ID:'}</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {drone.detectedTagId !== -1 ? drone.detectedTagId : '-1 (không thấy)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">{isVi ? 'Khoảng cách nhận diện:' : 'Camera Altitude Window:'}</span>
                <span className="font-mono text-emerald-400">50 - 150 cm</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">{isVi ? 'Độ phơi sáng camera:' : 'Camera Exposure:'}</span>
                <span className="font-mono text-slate-300">{drone.cameraExposure}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">{isVi ? 'Số lần mất tag:' : 'Tag Loss Count:'}</span>
                <span className="font-mono text-rose-400 font-bold">{drone.tagLossCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DEBUG LOGS */}
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
