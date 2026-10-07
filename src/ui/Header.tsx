/**
 * Main Toolbar & Application Header
 * WhalesBot Eagle 1003
 */

import React, { useRef } from 'react';
import {
  AlertOctagon,
  BookOpen,
  ChevronUp,
  FastForward,
  FolderOpen,
  Languages,
  Pause,
  Play,
  Presentation,
  Radio,
  Redo2,
  RotateCcw,
  Save,
  Sliders,
  StepForward,
  Trophy,
  Undo2,
} from 'lucide-react';

interface HeaderProps {
  isRunning: boolean;
  isPaused: boolean;
  speedMultiplier: number;
  language: 'vi' | 'en';
  onToggleLanguage: () => void;
  onRun: () => void;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onReset: () => void;
  onEmergencyStop: () => void;
  onChangeSpeed: (speed: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onOpenPresets: () => void;
  onOpenCalibration: () => void;
  onOpenArenaEditor: () => void;
  onOpenSensorPorts: () => void;
  onToggleCollapse?: () => void;
  onToggleClassroomMode?: () => void;
  isClassroomMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  isPaused,
  speedMultiplier,
  language,
  onToggleLanguage,
  onRun,
  onPause,
  onResume,
  onStep,
  onReset,
  onEmergencyStop,
  onChangeSpeed,
  onUndo,
  onRedo,
  onExportJson,
  onImportJson,
  onOpenPresets,
  onOpenCalibration,
  onOpenArenaEditor,
  onOpenSensorPorts,
  onToggleCollapse,
  onToggleClassroomMode,
  isClassroomMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isVi = language === 'vi';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      e.target.value = '';
    }
  };

  return (
    <header className="relative w-full bg-slate-950 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 select-none text-slate-200 transition-all duration-200 motion-reduce:transition-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF5A6E] to-[#6A5FE0] flex items-center justify-center shadow-lg text-white font-black text-sm">
          🦅
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight text-slate-100 flex items-center gap-2">
            <span>WhalesBot Eagle 1003</span>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
              Scratch Style
            </span>
          </h1>
          <p className="text-[10px] text-slate-400">
            {isVi ? 'Mô phỏng lập trình bay giáo dục 3D' : 'Educational 3D Drone Simulator'}
          </p>
        </div>
      </div>

      {/* Main Execution Controls */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
        {!isRunning ? (
          <button
            onClick={onRun}
            className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95"
            title={isVi ? 'Chạy chương trình' : 'Run Program'}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isVi ? 'Chạy' : 'Run'}</span>
          </button>
        ) : isPaused ? (
          <button
            onClick={onResume}
            className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95"
            title={isVi ? 'Tiếp tục chạy' : 'Resume'}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isVi ? 'Tiếp tục' : 'Resume'}</span>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95"
            title={isVi ? 'Tạm dừng' : 'Pause'}
          >
            <Pause className="w-3.5 h-3.5" />
            <span>{isVi ? 'Tạm dừng' : 'Pause'}</span>
          </button>
        )}

        <button
          onClick={onStep}
          className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition"
          title={isVi ? 'Thực thi từng khối lệnh (Step)' : 'Step by Step'}
        >
          <StepForward className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">{isVi ? 'Từng khối' : 'Step'}</span>
        </button>

        <button
          onClick={onReset}
          className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition"
          title={isVi ? 'Đặt lại drone về bệ xuất phát' : 'Reset Drone'}
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">{isVi ? 'Đặt lại' : 'Reset'}</span>
        </button>

        {/* Speed multiplier selector */}
        <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-700 text-xs">
          <FastForward className="w-3.5 h-3.5 text-slate-400" />
          {([0.5, 1, 2, 4] as const).map(s => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition ${
                speedMultiplier === s
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Emergency Stop Button */}
        <button
          onClick={onEmergencyStop}
          className="ml-1 px-2.5 py-1.5 rounded-md bg-rose-700 hover:bg-rose-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1 transition shadow-lg shadow-rose-900/30"
          title={isVi ? 'Dừng khẩn cấp: Cắt nguồn động cơ ngay lập tức!' : 'Emergency Stop: Cut Motors'}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>{isVi ? 'DỪNG KHẨN' : 'EMERGENCY'}</span>
        </button>
      </div>

      {/* Utilities & Dialog Triggers */}
      <div className="flex items-center gap-1.5 text-xs">
        {/* Language Toggle Button */}
        <button
          onClick={onToggleLanguage}
          className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition font-semibold"
          title="Chuyển đổi nhãn khối sang tiếng Anh gốc / tiếng Việt"
        >
          <Languages className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isVi ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}</span>
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-md border border-slate-800">
          <button
            onClick={onUndo}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Hoàn tác (Undo)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Làm lại (Redo)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* File Save / Open */}
        <button
          onClick={onExportJson}
          className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1 transition"
          title="Lưu file JSON"
        >
          <Save className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">{isVi ? 'Lưu file' : 'Save'}</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1 transition"
          title="Mở file JSON"
        >
          <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">{isVi ? 'Mở file' : 'Open'}</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />

        {/* Presets */}
        <button
          onClick={onOpenPresets}
          className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1.5 transition font-medium"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>{isVi ? 'Mẫu có sẵn' : 'Presets'}</span>
        </button>

        {/* Sensor Ports */}
        <button
          onClick={onOpenSensorPorts}
          className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1.5 transition font-medium"
        >
          <Radio className="w-3.5 h-3.5 text-[#6A5FE0]" />
          <span className="hidden lg:inline">{isVi ? 'Cổng cảm biến' : 'Sensor Ports'}</span>
        </button>

        {/* Arena Setup */}
        <button
          onClick={onOpenArenaEditor}
          className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1.5 transition font-medium"
        >
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span className="hidden lg:inline">{isVi ? 'Sân thi đấu' : 'Arena'}</span>
        </button>

        {/* Calibration */}
        <button
          onClick={onOpenCalibration}
          className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1.5 transition font-medium"
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden lg:inline">{isVi ? 'Hiệu chỉnh' : 'Calibration'}</span>
        </button>

        {/* Classroom Presentation Mode / Fullscreen */}
        {onToggleClassroomMode && (
          <button
            onClick={onToggleClassroomMode}
            className={`px-2.5 py-1.5 rounded border transition font-semibold flex items-center gap-1.5 ${
              isClassroomMode
                ? 'bg-amber-600 border-amber-500 text-white shadow-lg'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-amber-300'
            }`}
            title={isVi ? 'Chế độ chiếu lớp / Toàn màn hình (phím F)' : 'Classroom Presentation / Fullscreen (key F)'}
          >
            <Presentation className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isVi ? 'Chiếu lớp' : 'Classroom'}</span>
            <span className="text-[10px] opacity-75 font-mono">F</span>
          </button>
        )}
      </div>

      {/* Collapse Header Arrow Button */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-[11px] font-bold shadow-md z-30 flex items-center gap-1 transition group"
          title={isVi ? 'Ẩn thanh nút phía trên (phím T)' : 'Hide top toolbar (key T)'}
        >
          <ChevronUp className="w-3.5 h-3.5 transition group-hover:-translate-y-0.5" />
          <span className="text-[10px] hidden group-hover:inline">T</span>
        </button>
      )}
    </header>
  );
};
