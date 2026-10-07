/**
 * Main Application Component for WhalesBot Eagle 1003 Drone Simulator
 * Scratch / Zelos style rounded block programming
 * Includes panel toggle controls, classroom presentation mode, shortcuts, and touch gestures.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import {
  CalibrationConfig,
  DroneState,
  FieldObstacle,
  FlightPathPoint,
  HashGridConfig,
  RunSummary,
  SensorPortsMap,
  TagGridConfig,
} from './types/drone';
import {
  createInitialDroneState,
  DEFAULT_CALIBRATION,
  DEFAULT_SENSOR_PORTS,
  DEFAULT_TAG_GRID,
} from './simulator/physics';
import { DEFAULT_HASH_CONFIG } from './simulator/challengeEngine';
import { DroneInterpreter } from './simulator/interpreter';
import { Header } from './ui/Header';
import { BlocklyWorkspace } from './ui/BlocklyWorkspace';
import { Drone3DView } from './scene/Drone3DView';
import { StatusPanel } from './ui/StatusPanel';
import { SideToolbox, ToolboxTab } from './ui/SideToolbox';
import { CalibrationModal } from './ui/CalibrationModal';
import { AnalysisModal } from './ui/AnalysisModal';
import { ArenaEditorModal } from './ui/ArenaEditorModal';
import { PresetsModal } from './ui/PresetsModal';
import { SensorPortsModal } from './ui/SensorPortsModal';
import { PresetProgram } from './blocks/presets';
import { generateCCode } from './blocks/c_generator';
import { AppLanguage } from './blocks/definitions';
import {
  AlertOctagon,
  AlertTriangle,
  ChevronDown,
  Pause,
  Play,
  Presentation,
  RotateCcw,
  StepForward,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export default function App() {
  // Simulator State
  const [droneState, setDroneState] = useState<DroneState>(createInitialDroneState());
  const [flightPath, setFlightPath] = useState<FlightPathPoint[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);
  const [errorBlockId, setErrorBlockId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Language State: 'vi' (default) or 'en'
  const [language, setLanguage] = useState<AppLanguage>('vi');
  const isVi = language === 'vi';

  // UI Panels Collapse & Classroom Mode States (In-memory state only)
  const [isToolboxCollapsed, setIsToolboxCollapsed] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isStatusPanelCollapsed, setIsStatusPanelCollapsed] = useState(false);
  const [isClassroomMode, setIsClassroomMode] = useState(false);
  const [classroomZoom, setClassroomZoom] = useState(1.2);

  // Store previous states to restore when exiting classroom mode
  const prevPanelStatesRef = useRef({
    toolbox: false,
    header: false,
    status: false,
  });

  // Configuration State
  const [calibrationConfig, setCalibrationConfig] = useState<CalibrationConfig>(DEFAULT_CALIBRATION);
  const [tagConfig, setTagConfig] = useState<TagGridConfig>(DEFAULT_TAG_GRID);
  const [hashConfig, setHashConfig] = useState<HashGridConfig>(DEFAULT_HASH_CONFIG);
  const [portsConfig, setPortsConfig] = useState<SensorPortsMap>(DEFAULT_SENSOR_PORTS);
  const [obstacles, setObstacles] = useState<FieldObstacle[]>([
    {
      id: 'hoop_1',
      type: 'hoop',
      name: 'Vòng bay vàng #1',
      x: 120,
      y: 150,
      z: 30,
      width: 44,
      depth: 5,
      height: 60,
      radius: 22,
      innerRadius: 16,
      centerZ: 80,
    },
    {
      id: 'pole_1',
      type: 'pole',
      name: 'Cột mốc đỏ #1',
      x: 210,
      y: 200,
      z: 0,
      width: 12,
      depth: 12,
      height: 110,
      radius: 6,
    },
  ]);
  const [showArenaObstacles, setShowArenaObstacles] = useState(true);
  const [selectedObstacleId, setSelectedObstacleId] = useState<string | null>(null);
  const [activeToolboxTab, setActiveToolboxTab] = useState<ToolboxTab>('status');
  const [autoOpenOnObjectSelect, setAutoOpenOnObjectSelect] = useState(true);

  // Handler when an obstacle is selected on the 3D/2D field
  const handleSelectObstacle = useCallback((id: string | null) => {
    setSelectedObstacleId(id);
    if (id && autoOpenOnObjectSelect) {
      // Auto expand toolbox and switch to objects tab to edit properties
      setIsStatusPanelCollapsed(false);
      setActiveToolboxTab('objects');
    }
  }, [autoOpenOnObjectSelect]);

  // C Code & Summary State
  const [cCode, setCCode] = useState<string>('');
  const [currentSummary, setCurrentSummary] = useState<RunSummary | null>(null);
  const [savedRunA, setSavedRunA] = useState<RunSummary | null>(null);
  const [savedRunB, setSavedRunB] = useState<RunSummary | null>(null);
  const [comparisonPathOn3D, setComparisonPathOn3D] = useState<FlightPathPoint[] | null>(null);

  // Modals
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isArenaEditorOpen, setIsArenaEditorOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isSensorPortsOpen, setIsSensorPortsOpen] = useState(false);

  // Refs
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const interpreterRef = useRef<DroneInterpreter | null>(null);

  // Initialize Interpreter
  useEffect(() => {
    const interpreter = new DroneInterpreter(calibrationConfig, tagConfig, obstacles, portsConfig);
    interpreterRef.current = interpreter;

    interpreter.setListeners(
      (drone, blockId) => {
        setDroneState(drone);
        setHighlightedBlockId(blockId);
        setFlightPath(interpreter.getFlightPath());
      },
      summary => {
        setIsRunning(false);
        setIsPaused(false);
        setHighlightedBlockId(null);
        setCurrentSummary(summary);
        setIsAnalysisOpen(true);
      },
      (blockId, msg) => {
        setErrorBlockId(blockId);
        setErrorMessage(msg);
        setIsRunning(false);
        setIsPaused(false);
      },
      newTagConfig => {
        setTagConfig({ ...newTagConfig });
      },
      updatedObstacles => {
        setObstacles([...updatedObstacles]);
      }
    );

    return () => {
      interpreter.stop();
    };
  }, []);

  // Update Interpreter Configs when changed
  useEffect(() => {
    if (interpreterRef.current) {
      interpreterRef.current.setCalibration(calibrationConfig);
    }
  }, [calibrationConfig]);

  useEffect(() => {
    if (interpreterRef.current) {
      interpreterRef.current.setTagConfig(tagConfig);
    }
  }, [tagConfig]);

  useEffect(() => {
    if (interpreterRef.current) {
      interpreterRef.current.setObstacles(obstacles);
    }
  }, [obstacles]);

  useEffect(() => {
    if (interpreterRef.current) {
      interpreterRef.current.setPortsConfig(portsConfig);
    }
  }, [portsConfig]);

  useEffect(() => {
    if (interpreterRef.current) {
      interpreterRef.current.setSpeedMultiplier(speedMultiplier);
    }
  }, [speedMultiplier]);

  // Handle Workspace Ready
  const handleWorkspaceReady = useCallback((ws: Blockly.WorkspaceSvg) => {
    workspaceRef.current = ws;
    setCCode(generateCCode(ws));
  }, []);

  const handleCodeChange = useCallback((code: string) => {
    setCCode(code);
  }, []);

  // Language Toggle
  const handleToggleLanguage = useCallback(() => {
    setLanguage(prev => (prev === 'vi' ? 'en' : 'vi'));
  }, []);

  // Toolbar Actions
  const handleRun = useCallback(() => {
    if (!workspaceRef.current || !interpreterRef.current) return;
    setErrorMessage(null);
    setErrorBlockId(null);
    setIsRunning(true);
    setIsPaused(false);
    setComparisonPathOn3D(null);
    interpreterRef.current.reset();
    interpreterRef.current.start(workspaceRef.current);
  }, []);

  const handlePause = useCallback(() => {
    if (!interpreterRef.current) return;
    interpreterRef.current.pause();
    setIsPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    if (!interpreterRef.current) return;
    interpreterRef.current.resume();
    setIsPaused(false);
  }, []);

  const handleStep = useCallback(() => {
    if (!workspaceRef.current || !interpreterRef.current) return;
    setErrorMessage(null);
    setIsRunning(true);
    interpreterRef.current.step(workspaceRef.current);
  }, []);

  const handleReset = useCallback(() => {
    if (!interpreterRef.current) return;
    interpreterRef.current.reset();
    setIsRunning(false);
    setIsPaused(false);
    setHighlightedBlockId(null);
    setErrorBlockId(null);
    setErrorMessage(null);
    setFlightPath([]);
    setDroneState(interpreterRef.current.getState());
  }, []);

  const handleEmergencyStop = useCallback(() => {
    if (!interpreterRef.current) return;
    interpreterRef.current.emergencyStop();
    setIsRunning(false);
    setIsPaused(false);
    setHighlightedBlockId(null);
  }, []);

  const handleUndo = useCallback(() => {
    if (workspaceRef.current) {
      workspaceRef.current.undo(false);
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (workspaceRef.current) {
      workspaceRef.current.undo(true);
    }
  }, []);

  const handleExportJson = useCallback(() => {
    if (!workspaceRef.current) return;
    const state = Blockly.serialization.workspaces.save(workspaceRef.current);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'eagle1003_scratch_program.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);

  const handleImportJson = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target?.result as string;
        const state = JSON.parse(text);
        if (workspaceRef.current) {
          workspaceRef.current.clear();
          Blockly.serialization.workspaces.load(state, workspaceRef.current);
          handleReset();
        }
      } catch {
        alert('File JSON không hợp lệ!');
      }
    };
    reader.readAsText(file);
  }, [handleReset]);

  // Load Preset
  const handleSelectPreset = useCallback((preset: PresetProgram) => {
    if (!workspaceRef.current) return;
    try {
      workspaceRef.current.clear();
      const dom = Blockly.utils.xml.textToDom(preset.xml);
      Blockly.Xml.domToWorkspace(dom, workspaceRef.current);

      // Load preset initial obstacles if available
      if (preset.initialObstacles && preset.initialObstacles.length > 0) {
        setObstacles(preset.initialObstacles);
        setShowArenaObstacles(true);
      }

      // Reset drone state and apply specific start position if defined
      handleReset();
      if (preset.droneStartPosition) {
        setDroneState(prev => ({
          ...prev,
          position: {
            x: preset.droneStartPosition!.x,
            y: preset.droneStartPosition!.y,
            z: preset.droneStartPosition!.z,
          },
          yaw: preset.droneStartPosition!.yaw ?? prev.yaw,
        }));
      }

      // Switch toolbox tab to challenges or status
      if (preset.category && preset.category !== 'basic') {
        setActiveToolboxTab('challenges');
      }
    } catch {
      // fallback
    }
  }, [handleReset]);

  // Comparison on 3D View
  const handleCompareRunsOn3D = useCallback((runA: RunSummary | null, runB: RunSummary | null) => {
    if (runB) {
      setComparisonPathOn3D(runB.path);
    } else {
      setComparisonPathOn3D(null);
    }
  }, []);

  // Classroom / Fullscreen Mode Toggle
  const handleToggleClassroomMode = useCallback(() => {
    if (!isClassroomMode) {
      prevPanelStatesRef.current = {
        toolbox: isToolboxCollapsed,
        header: isHeaderCollapsed,
        status: isStatusPanelCollapsed,
      };
      setIsClassroomMode(true);
      setIsHeaderCollapsed(true);
      setIsToolboxCollapsed(true);
      setIsStatusPanelCollapsed(true);
      setClassroomZoom(1.2);
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    } else {
      handleExitClassroomMode();
    }
  }, [isClassroomMode, isToolboxCollapsed, isHeaderCollapsed, isStatusPanelCollapsed]);

  const handleExitClassroomMode = useCallback(() => {
    setIsClassroomMode(false);
    setIsHeaderCollapsed(prevPanelStatesRef.current.header);
    setIsToolboxCollapsed(prevPanelStatesRef.current.toolbox);
    setIsStatusPanelCollapsed(prevPanelStatesRef.current.status);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  // Keyboard Shortcuts (B, T, P, F, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setIsToolboxCollapsed(prev => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setIsHeaderCollapsed(prev => !prev);
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsStatusPanelCollapsed(prev => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleClassroomMode();
      } else if (e.key === 'Escape') {
        if (isClassroomMode) {
          e.preventDefault();
          handleExitClassroomMode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleClassroomMode, handleExitClassroomMode, isClassroomMode]);

  // Tablet Touch Swipe Gestures (Swipe edge to restore hidden panels)
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;

        // Dominant horizontal swipe
        if (Math.abs(dx) > Math.abs(dy) * 1.5) {
          // Swipe from left edge inwards (> 50px) to restore left toolbox
          if (touchStartX < 50 && dx > 50) {
            setIsToolboxCollapsed(false);
          }
          // Swipe from right edge inwards (< -50px) to restore right status panel
          if (touchStartX > window.innerWidth - 60 && dx < -50) {
            setIsStatusPanelCollapsed(false);
          }
        }
        // Dominant vertical swipe down from top edge (> 50px) to restore header
        if (touchStartY < 50 && dy > 50 && Math.abs(dy) > Math.abs(dx)) {
          setIsHeaderCollapsed(false);
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Synchronized Blockly Resize when panels toggle
  useEffect(() => {
    if (workspaceRef.current) {
      Blockly.svgResize(workspaceRef.current);
      const t1 = setTimeout(() => workspaceRef.current && Blockly.svgResize(workspaceRef.current), 60);
      const t2 = setTimeout(() => workspaceRef.current && Blockly.svgResize(workspaceRef.current), 220);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isToolboxCollapsed, isHeaderCollapsed, isStatusPanelCollapsed, isClassroomMode]);

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 font-sans overflow-hidden select-none relative">
      {/* 1. TOP HEADER TOOLBAR */}
      <div
        className={`w-full overflow-hidden transition-all duration-200 motion-reduce:transition-none z-30 shrink-0 ${
          isHeaderCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-24 opacity-100'
        }`}
      >
        <Header
          isRunning={isRunning}
          isPaused={isPaused}
          speedMultiplier={speedMultiplier}
          language={language}
          onToggleLanguage={handleToggleLanguage}
          onRun={handleRun}
          onPause={handlePause}
          onResume={handleResume}
          onStep={handleStep}
          onReset={handleReset}
          onEmergencyStop={handleEmergencyStop}
          onChangeSpeed={setSpeedMultiplier}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
          onOpenPresets={() => setIsPresetsOpen(true)}
          onOpenCalibration={() => setIsCalibrationOpen(true)}
          onOpenArenaEditor={() => setIsArenaEditorOpen(true)}
          onOpenSensorPorts={() => setIsSensorPortsOpen(true)}
          onToggleCollapse={() => setIsHeaderCollapsed(true)}
          onToggleClassroomMode={handleToggleClassroomMode}
          isClassroomMode={isClassroomMode}
        />
      </div>

      {/* FLOATING MINI-TOOLBAR WHEN HEADER IS HIDDEN */}
      {isHeaderCollapsed && !isClassroomMode && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-slate-700 rounded-full px-3 py-1 shadow-2xl backdrop-blur-md flex items-center gap-2 select-none animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Run / Resume / Pause */}
          {!isRunning ? (
            <button
              onClick={handleRun}
              className="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow transition active:scale-95"
              title="Chạy (phím Enter / Click)"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Chạy</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={handleResume}
              className="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow transition active:scale-95"
              title="Tiếp tục"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Tiếp tục</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-2.5 py-1 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 shadow transition active:scale-95"
              title="Tạm dừng"
            >
              <Pause className="w-3 h-3" />
              <span>Tạm dừng</span>
            </button>
          )}

          {/* Step */}
          <button
            onClick={handleStep}
            className="p-1 rounded-full hover:bg-slate-800 text-cyan-400 transition"
            title="Thực thi từng khối lệnh"
          >
            <StepForward className="w-3.5 h-3.5" />
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Đặt lại vị trí xuất phát"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Emergency Stop */}
          <button
            onClick={handleEmergencyStop}
            className="px-2.5 py-1 rounded-full bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow active:scale-95"
            title="Dừng khẩn cấp: Cắt động cơ ngay lập tức!"
          >
            <AlertOctagon className="w-3 h-3" />
            <span className="hidden sm:inline">Dừng khẩn</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          {/* Re-open Header */}
          <button
            onClick={() => setIsHeaderCollapsed(false)}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1 group"
            title="Hiện thanh nút phía trên (phím T)"
          >
            <ChevronDown className="w-4 h-4 transition group-hover:translate-y-0.5" />
            <span className="text-[10px] font-mono opacity-60">T</span>
          </button>

          {/* Classroom Mode button */}
          <button
            onClick={handleToggleClassroomMode}
            className="p-1.5 rounded-full hover:bg-slate-800 text-amber-300 transition"
            title="Chế độ chiếu lớp / Toàn màn hình (phím F)"
          >
            <Presentation className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* FLOATING HUD IN CLASSROOM PRESENTATION MODE */}
      {isClassroomMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-amber-500/70 rounded-2xl px-4 py-2 shadow-2xl backdrop-blur-md flex items-center gap-3 select-none text-slate-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 border-r border-slate-700 pr-3">
            <Presentation className="w-4 h-4" />
            <span>Chiếu lớp</span>
          </div>

          {/* Execution buttons */}
          <div className="flex items-center gap-1.5 border-r border-slate-700 pr-3">
            {!isRunning ? (
              <button
                onClick={handleRun}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Chạy</span>
              </button>
            ) : isPaused ? (
              <button
                onClick={handleResume}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Tiếp tục</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 shadow"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Tạm dừng</span>
              </button>
            )}

            <button
              onClick={handleStep}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs"
              title="Từng khối"
            >
              <StepForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              title="Đặt lại"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleEmergencyStop}
              className="px-2.5 py-1 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow"
              title="Dừng khẩn cấp!"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Dừng khẩn</span>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border-r border-slate-700 pr-3">
            <span className="text-[11px] text-slate-400 mr-1">Cỡ chữ:</span>
            <button
              onClick={() => setClassroomZoom(z => Math.max(0.65, Math.round((z - 0.15) * 100) / 100))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Thu nhỏ chữ & khối"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setClassroomZoom(1.2)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 font-bold"
              title="Đặt lại mức chuẩn 120%"
            >
              {Math.round(classroomZoom * 100)}%
            </button>
            <button
              onClick={() => setClassroomZoom(z => Math.min(2.5, Math.round((z + 0.15) * 100) / 100))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Phóng to chữ & khối"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Exit Classroom Mode */}
          <button
            onClick={handleExitClassroomMode}
            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-rose-900/80 hover:text-white border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Thoát chế độ chiếu lớp (phím Esc hoặc F)"
          >
            <X className="w-3.5 h-3.5" />
            <span>Thoát chiếu lớp</span>
            <span className="text-[10px] font-mono opacity-60">Esc</span>
          </button>
        </div>
      )}

      {/* Error / Alert Toast Notification */}
      {errorMessage && (
        <div className="bg-rose-950 border-b border-rose-800 px-4 py-2 flex items-center justify-between text-xs text-rose-200 z-30 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 rounded hover:bg-rose-900 text-rose-400 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. MAIN WORKSPACE & SIMULATION LAYOUT */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* LEFT PANE: Blockly Workspace with Zelos renderer and #FFEDE8 background */}
        <div
          className={`h-[45vh] md:h-full border-r border-slate-800 flex flex-col overflow-hidden relative bg-[#FFEDE8] transition-all duration-200 motion-reduce:transition-none ${
            isClassroomMode ? 'w-full md:w-[54%] lg:w-[56%]' : 'w-full md:w-[50%] lg:w-[52%]'
          }`}
        >
          <div className="bg-white/80 px-3 py-1 border-b border-[#F3D2C9] flex items-center justify-between text-[11px] text-slate-600 backdrop-blur-sm shrink-0">
            <span className="font-bold text-slate-700">
              {language === 'vi' ? 'Vùng lập trình kéo thả Scratch (Zelos)' : 'Blockly Programming Workspace (Zelos)'}
            </span>
            <span className="text-[10px] text-slate-500">
              {isClassroomMode ? 'Chế độ chiếu lớp 120%' : isVi ? 'Nhãn: Tiếng Việt / English' : 'Labels: English / Tiếng Việt'}
            </span>
          </div>
          <div className="flex-1 relative overflow-hidden">
            <BlocklyWorkspace
              language={language}
              onWorkspaceReady={handleWorkspaceReady}
              onCodeChange={handleCodeChange}
              highlightedBlockId={highlightedBlockId}
              errorBlockId={errorBlockId}
              isToolboxCollapsed={isToolboxCollapsed}
              onToggleToolboxCollapse={() => setIsToolboxCollapsed(prev => !prev)}
              isClassroomMode={isClassroomMode}
              classroomZoom={classroomZoom}
              onZoomIn={() => setClassroomZoom(z => Math.min(2.5, z + 0.15))}
              onZoomOut={() => setClassroomZoom(z => Math.max(0.65, z - 0.15))}
              onResetZoom={() => setClassroomZoom(1.2)}
            />
          </div>
        </div>

        {/* RIGHT PANE: Split Top (3D / 2D Simulation) & Bottom (Status & C Code) */}
        <div
          className={`h-[55vh] md:h-full flex flex-col overflow-hidden bg-slate-950 transition-all duration-200 motion-reduce:transition-none ${
            isClassroomMode ? 'w-full md:w-[46%] lg:w-[44%]' : 'w-full md:w-[50%] lg:w-[48%]'
          }`}
        >
          {/* Top Right: 3D / 2D Simulation View (Expands smoothly when toolbox is collapsed) */}
          <div
            className={`w-full relative border-b border-slate-800 overflow-hidden transition-all duration-200 motion-reduce:transition-none ${
              isStatusPanelCollapsed ? 'flex-1 h-[calc(100%-36px)]' : 'h-[55%]'
            }`}
          >
            <Drone3DView
              drone={droneState}
              flightPath={flightPath}
              comparisonPath={comparisonPathOn3D}
              tagConfig={tagConfig}
              obstacles={obstacles}
              showArenaObstacles={showArenaObstacles}
              onUpdateObstacles={setObstacles}
              onToggleShowArena={setShowArenaObstacles}
              onOpenArenaEditor={() => setIsArenaEditorOpen(true)}
              selectedObstacleId={selectedObstacleId}
              onSelectObstacle={handleSelectObstacle}
              isToolboxCollapsed={isStatusPanelCollapsed}
              onToggleToolboxCollapse={() => setIsStatusPanelCollapsed(prev => !prev)}
              fieldWidthCm={calibrationConfig.fieldWidthCm}
              fieldHeightCm={calibrationConfig.fieldHeightCm}
              language={language}
            />
          </div>

          {/* Bottom Right: Unified Side Toolbox (Status, C Code, Analysis, Tasks, Objects, Calib, Sensors) */}
          <div
            className={`w-full overflow-hidden transition-all duration-200 motion-reduce:transition-none ${
              isStatusPanelCollapsed ? 'h-9 shrink-0' : 'h-[45%]'
            }`}
          >
            <SideToolbox
              drone={droneState}
              cCode={cCode}
              lastSummary={currentSummary}
              savedRunA={savedRunA}
              savedRunB={savedRunB}
              onSetRunA={setSavedRunA}
              onSetRunB={setSavedRunB}
              onCompareRunsOn3D={handleCompareRunsOn3D}
              obstacles={obstacles}
              onUpdateObstacles={setObstacles}
              selectedObstacleId={selectedObstacleId}
              onSelectObstacle={handleSelectObstacle}
              showArenaObstacles={showArenaObstacles}
              onToggleShowArena={setShowArenaObstacles}
              tagConfig={tagConfig}
              onSaveTagConfig={setTagConfig}
              calibrationConfig={calibrationConfig}
              onSaveCalibration={setCalibrationConfig}
              portsConfig={portsConfig}
              onOpenSensorPortsModal={() => setIsSensorPortsOpen(true)}
              isCollapsed={isStatusPanelCollapsed}
              onToggleCollapse={() => setIsStatusPanelCollapsed(prev => !prev)}
              activeTab={activeToolboxTab}
              onChangeTab={setActiveToolboxTab}
              autoOpenOnObjectSelect={autoOpenOnObjectSelect}
              onToggleAutoOpenOnSelect={setAutoOpenOnObjectSelect}
              language={language}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <CalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        config={calibrationConfig}
        onSave={setCalibrationConfig}
        language={language}
      />

      <AnalysisModal
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        currentSummary={currentSummary}
        savedRunA={savedRunA}
        savedRunB={savedRunB}
        onSetRunA={setSavedRunA}
        onSetRunB={setSavedRunB}
        onCompareRunsOn3D={handleCompareRunsOn3D}
        language={language}
      />

      <ArenaEditorModal
        isOpen={isArenaEditorOpen}
        onClose={() => setIsArenaEditorOpen(false)}
        tagConfig={tagConfig}
        onSaveTagConfig={setTagConfig}
        obstacles={obstacles}
        onSaveObstacles={setObstacles}
        showArenaObstacles={showArenaObstacles}
        onToggleShowArena={setShowArenaObstacles}
        language={language}
      />

      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
        language={language}
      />

      <SensorPortsModal
        isOpen={isSensorPortsOpen}
        onClose={() => setIsSensorPortsOpen(false)}
        portsConfig={portsConfig}
        onSave={setPortsConfig}
        language={language}
      />
    </div>
  );
}
