/**
 * Blockly Workspace Component with Scratch/Zelos renderer
 * Background: #FFEDE8 (Pale Pink)
 * Supports collapsible toolbox (40px strip with hover drawer),
 * classroom presentation mode with zoom and larger typography.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import {
  AppLanguage,
  initializeDroneBlocks,
  setAppLanguage,
} from '../blocks/definitions';
import { getDroneToolbox } from '../blocks/toolbox';
import { generateCCode } from '../blocks/c_generator';
import { PRESET_PROGRAMS } from '../blocks/presets';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';

interface BlocklyWorkspaceProps {
  language: AppLanguage;
  onWorkspaceReady: (ws: Blockly.WorkspaceSvg) => void;
  onCodeChange: (cCode: string) => void;
  highlightedBlockId: string | null;
  errorBlockId: string | null;
  isToolboxCollapsed: boolean;
  onToggleToolboxCollapse: () => void;
  isClassroomMode?: boolean;
  classroomZoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
}

const LOCAL_STORAGE_KEY = 'whalesbot_eagle1003_workspace_state_v2';

const CATEGORIES_LIST = [
  { id: 'motion', nameVi: 'Chuyển động', nameEn: 'Motion', color: '#FF5A6E', icon: '🚀' },
  { id: 'sensors', nameVi: 'Cảm biến', nameEn: 'Sensors', color: '#6A5FE0', icon: '📡' },
  { id: 'loops', nameVi: 'Vòng lặp', nameEn: 'Loops', color: '#FFAB19', icon: '🔁' },
  { id: 'logic', nameVi: 'Logic', nameEn: 'Logic', color: '#2DB8F0', icon: '🔀' },
  { id: 'math', nameVi: 'Toán', nameEn: 'Math', color: '#55CC55', icon: '➕' },
  { id: 'variables', nameVi: 'Biến', nameEn: 'Variables', color: '#F2C21B', icon: '📊' },
  { id: 'ai', nameVi: 'AI', nameEn: 'AI', color: '#4C6FE6', icon: '🤖' },
  { id: 'myblocks', nameVi: 'Khối của tôi', nameEn: 'My Blocks', color: '#9966FF', icon: '🧩' },
];

export const BlocklyWorkspace: React.FC<BlocklyWorkspaceProps> = ({
  language,
  onWorkspaceReady,
  onCodeChange,
  highlightedBlockId,
  errorBlockId,
  isToolboxCollapsed,
  onToggleToolboxCollapse,
  isClassroomMode = false,
  classroomZoom = 1.2,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  // Hover state for temporary drawer when toolbox is collapsed
  const [isHoveringDrawer, setIsHoveringDrawer] = useState(false);

  // Modal for creating custom block (My Blocks)
  const [isNewBlockModalOpen, setIsNewBlockModalOpen] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');

  const isVi = language === 'vi';

  // 1. Initialize Blockly
  useEffect(() => {
    if (!containerRef.current) return;

    setAppLanguage(language);
    initializeDroneBlocks();

    // Create custom theme with Scratch colors & #FFEDE8 background
    const zelosTheme = Blockly.Theme.defineTheme('zelos_whalesbot', {
      name: 'zelos_whalesbot',
      base: Blockly.Themes.Zelos,
      componentStyles: {
        workspaceBackgroundColour: '#FFEDE8', // Pale pink background
        toolboxBackgroundColour: '#FFFFFF',
        toolboxForegroundColour: '#4C566A',
        flyoutBackgroundColour: '#FFF7F5',
        flyoutOpacity: 0.95,
        scrollbarColour: '#E5D0CA',
        scrollbarOpacity: 0.7,
        insertionMarkerColour: '#FF5A6E',
        insertionMarkerOpacity: 0.5,
      },
    });

    const workspace = Blockly.inject(containerRef.current, {
      toolbox: getDroneToolbox(language),
      renderer: 'zelos', // Scratch rounded renderer
      theme: zelosTheme,
      collapse: true,
      comments: true,
      disable: true,
      maxBlocks: Infinity,
      trashcan: true,
      horizontalLayout: false,
      toolboxPosition: 'start',
      css: true,
      media: 'https://blockly-demo.appspot.com/static/media/',
      rtl: false,
      scrollbars: true,
      sounds: true,
      oneBasedIndex: true,
      grid: {
        spacing: 20,
        length: 2,
        colour: '#F3D2C9',
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: isClassroomMode ? classroomZoom : 0.85,
        maxScale: 2.5,
        minScale: 0.35,
        scaleSpeed: 1.1,
        pinch: true,
      },
    });

    workspaceRef.current = workspace;
    onWorkspaceReady(workspace);

    // Register callback for "Create new blocks" in My Blocks category
    workspace.registerButtonCallback('CREATE_NEW_PROCEDURE', () => {
      setIsNewBlockModalOpen(true);
    });

    // Try loading saved workspace, otherwise load Preset 1
    let loaded = false;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        Blockly.serialization.workspaces.load(state, workspace);
        loaded = true;
      }
    } catch {
      // fallback
    }

    if (!loaded) {
      const defaultXml = PRESET_PROGRAMS[0].xml;
      const dom = Blockly.utils.xml.textToDom(defaultXml);
      Blockly.Xml.domToWorkspace(dom, workspace);
    }

    const handleChange = () => {
      const code = generateCCode(workspace);
      onCodeChange(code);

      try {
        const state = Blockly.serialization.workspaces.save(workspace);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
      } catch {
        // ignore
      }
    };

    workspace.addChangeListener(handleChange);
    handleChange();

    const resizeObserver = new ResizeObserver(() => {
      Blockly.svgResize(workspace);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      workspace.dispose();
    };
  }, []);

  // 2. Language Change update
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;

    setAppLanguage(language);
    ws.updateToolbox(getDroneToolbox(language));

    try {
      const state = Blockly.serialization.workspaces.save(ws);
      ws.clear();
      Blockly.serialization.workspaces.load(state, ws);
    } catch {
      // ignore
    }
  }, [language]);

  // 3. Highlight running / error block
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;

    if (errorBlockId) {
      ws.highlightBlock(errorBlockId);
      const errBlock = ws.getBlockById(errorBlockId);
      if (errBlock) {
        const svgPath = (errBlock as any).getSvgRoot?.();
        if (svgPath) {
          svgPath.classList.add('blockly-error-block');
        }
      }
    } else if (highlightedBlockId) {
      ws.highlightBlock(highlightedBlockId);
    } else {
      ws.highlightBlock(null);
    }
  }, [highlightedBlockId, errorBlockId]);

  // 4. Handle Toolbox collapse / expand and hover drawer
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws || !containerRef.current) return;

    const toolboxDiv = containerRef.current.querySelector('.blocklyToolboxDiv') as HTMLElement | null;
    const flyout = ws.getFlyout?.();

    if (isToolboxCollapsed) {
      if (isHoveringDrawer) {
        // Temporary hover drawer: show toolbox floating over workspace
        if (toolboxDiv) {
          toolboxDiv.style.display = 'block';
          toolboxDiv.style.position = 'absolute';
          toolboxDiv.style.left = '40px';
          toolboxDiv.style.top = '0px';
          toolboxDiv.style.zIndex = '40';
          toolboxDiv.style.boxShadow = '4px 0 20px rgba(0,0,0,0.18)';
        }
      } else {
        // Hidden state: hide toolbox div
        if (toolboxDiv) {
          toolboxDiv.style.display = 'none';
        }
        if (flyout && flyout.isVisible()) {
          flyout.hide();
        }
      }
    } else {
      // Normal expanded state: normal positioning
      if (toolboxDiv) {
        toolboxDiv.style.display = 'block';
        toolboxDiv.style.position = 'absolute';
        toolboxDiv.style.left = '0px';
        toolboxDiv.style.top = '0px';
        toolboxDiv.style.zIndex = '1';
        toolboxDiv.style.boxShadow = '2px 0 8px rgba(0, 0, 0, 0.04)';
      }
    }

    // Trigger SVG resize
    Blockly.svgResize(ws);
    const t1 = setTimeout(() => ws && Blockly.svgResize(ws), 60);
    const t2 = setTimeout(() => ws && Blockly.svgResize(ws), 220);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isToolboxCollapsed, isHoveringDrawer]);

  // 5. Classroom zoom update
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;

    if (isClassroomMode) {
      ws.setScale(classroomZoom);
    } else {
      ws.setScale(0.85);
    }
    Blockly.svgResize(ws);
  }, [isClassroomMode, classroomZoom]);

  // Select category from slim strip
  const handleSelectCategory = (index: number) => {
    const ws = workspaceRef.current;
    if (!ws) return;

    // Show temporary drawer
    setIsHoveringDrawer(true);

    const toolbox = ws.getToolbox() as any;
    if (toolbox && typeof toolbox.selectItemByPosition === 'function') {
      toolbox.selectItemByPosition(index);
    }
  };

  // Handle Create Custom Block
  const handleConfirmNewBlock = () => {
    const ws = workspaceRef.current;
    if (!ws || !newBlockName.trim()) return;

    const cleanName = newBlockName.trim().replace(/\s+/g, '_');
    const defBlock = ws.newBlock('procedures_defnoreturn');
    defBlock.setFieldValue(cleanName, 'NAME');
    defBlock.initSvg();
    defBlock.render();
    defBlock.moveBy(250, 100);

    setNewBlockName('');
    setIsNewBlockModalOpen(false);
  };

  return (
    <div
      className={`relative w-full h-full bg-[#FFEDE8] overflow-hidden flex select-none ${
        isClassroomMode ? 'classroom-mode' : ''
      }`}
    >
      {/* SLIM 40px VERTICAL STRIP (Shown when toolbox is collapsed) */}
      {isToolboxCollapsed && (
        <div
          onMouseEnter={() => setIsHoveringDrawer(true)}
          className="w-10 h-full bg-white border-r border-[#F3D2C9] flex flex-col items-center py-2 z-30 shrink-0 shadow-sm transition-all duration-200 motion-reduce:transition-none"
        >
          {/* Open Toolbox Arrow Button */}
          <button
            onClick={onToggleToolboxCollapse}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition shadow-sm mb-3 group"
            title={isVi ? 'Mở rộng thanh khối (phím B)' : 'Expand block toolbox (key B)'}
          >
            <ChevronRight className="w-4 h-4 text-slate-700 transition group-hover:translate-x-0.5" />
          </button>

          {/* 8 Category Badges */}
          <div className="flex flex-col gap-2.5 items-center flex-1">
            {CATEGORIES_LIST.map((cat, idx) => (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(idx)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-sm hover:scale-110 active:scale-95 transition"
                style={{ backgroundColor: cat.color }}
                title={`${isVi ? cat.nameVi : cat.nameEn} (rê chuột để mở kho khối)`}
              >
                <span className="text-[11px] drop-shadow">{cat.icon}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FLYOUT HOVER DRAWER OVERLAY WRAPPER */}
      {isToolboxCollapsed && isHoveringDrawer && (
        <div
          onMouseLeave={() => setIsHoveringDrawer(false)}
          className="absolute left-10 top-0 h-full z-40 bg-transparent flex"
          style={{ width: '220px' }}
        >
          {/* Transparent hit area to hold mouse over Blockly toolboxDiv & flyout */}
          <div className="w-full h-full pointer-events-auto" />
        </div>
      )}

      {/* PINNED EXPANDED TOGGLE BUTTON (When toolbox is expanded) */}
      {!isToolboxCollapsed && (
        <button
          onClick={onToggleToolboxCollapse}
          className="absolute top-2 left-[155px] z-30 p-1.5 rounded-lg bg-white/95 hover:bg-slate-100 border border-[#F3D2C9] text-slate-600 hover:text-slate-900 shadow-md transition flex items-center justify-center group"
          title={isVi ? 'Thu gọn thanh khối (phím B)' : 'Collapse block toolbox (key B)'}
        >
          <ChevronLeft className="w-4 h-4 transition group-hover:-translate-x-0.5" />
          <span className="text-[10px] font-bold hidden sm:inline ml-0.5 text-slate-400">B</span>
        </button>
      )}

      {/* Blockly Workspace Container */}
      <div
        ref={containerRef}
        className="w-full h-full flex-1"
        style={{
          marginLeft: isToolboxCollapsed && !isHoveringDrawer ? '0px' : '0px',
        }}
      />

      {/* Floating Button for Custom Block (My Blocks) */}
      <div className="absolute bottom-4 left-14 z-20">
        <button
          onClick={() => setIsNewBlockModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-[#9966FF] hover:bg-[#855CD6] text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition active:scale-95"
          title="Tạo khối hàm của tôi (My Blocks)"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{language === 'vi' ? 'Tạo Khối của tôi' : 'Create new block'}</span>
        </button>
      </div>

      {/* Modal dialog: Create new block */}
      {isNewBlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 shadow-2xl max-w-sm w-full text-slate-800 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#9966FF] flex items-center gap-2">
                <span>🧩</span>
                <span>{language === 'vi' ? 'Tạo Khối của tôi' : 'Make a Block'}</span>
              </h3>
              <button
                onClick={() => setIsNewBlockModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {language === 'vi' ? 'Tên khối lệnh:' : 'Block name:'}
              </label>
              <input
                type="text"
                autoFocus
                placeholder={language === 'vi' ? 'Ví dụ: bay_hinh_vuong' : 'e.g., fly_square'}
                value={newBlockName}
                onChange={e => setNewBlockName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirmNewBlock()}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9966FF]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewBlockModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmNewBlock}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#9966FF] hover:bg-[#855CD6] shadow transition"
              >
                {language === 'vi' ? 'OK Tạo khối' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
