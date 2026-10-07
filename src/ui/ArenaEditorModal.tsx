/**
 * Arena & AprilTag Field Configuration Modal
 */

import React, { useState } from 'react';
import {
  Grid,
  MapPin,
  Plus,
  SlidersHorizontal,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import { FieldObstacle, ObstacleType, TagGridConfig } from '../types/drone';

interface ArenaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagConfig: TagGridConfig;
  onSaveTagConfig: (config: TagGridConfig) => void;
  obstacles: FieldObstacle[];
  onSaveObstacles: (obstacles: FieldObstacle[]) => void;
  showArenaObstacles: boolean;
  onToggleShowArena: (show: boolean) => void;
  language?: 'vi' | 'en';
}

export const ArenaEditorModal: React.FC<ArenaEditorModalProps> = ({
  isOpen,
  onClose,
  tagConfig,
  onSaveTagConfig,
  obstacles,
  onSaveObstacles,
  showArenaObstacles,
  onToggleShowArena,
  language = 'vi',
}) => {
  const isVi = language === 'vi';
  const [tagForm, setTagForm] = useState<TagGridConfig>({ ...tagConfig });
  const [obstacleList, setObstacleList] = useState<FieldObstacle[]>([...obstacles]);
  const [newType, setNewType] = useState<ObstacleType>('hoop');

  if (!isOpen) return null;

  const handleAddObstacle = () => {
    const id = 'obs_' + Date.now();
    let newObs: FieldObstacle;

    if (newType === 'hoop') {
      newObs = {
        id,
        type: 'hoop',
        name: `Vòng bay #${obstacleList.length + 1}`,
        x: 150,
        y: 150,
        z: 40,
        width: 44,
        depth: 5,
        height: 60,
        radius: 22,
        innerRadius: 15,
        centerZ: 80,
      };
    } else if (newType === 'pole') {
      newObs = {
        id,
        type: 'pole',
        name: `Cột mốc #${obstacleList.length + 1}`,
        x: 100,
        y: 180,
        z: 0,
        width: 12,
        depth: 12,
        height: 120,
        radius: 6,
      };
    } else if (newType === 'barrier') {
      newObs = {
        id,
        type: 'barrier',
        name: `Thanh chắn #${obstacleList.length + 1}`,
        x: 180,
        y: 120,
        z: 0,
        width: 60,
        depth: 15,
        height: 40,
      };
    } else if (newType === 'flame') {
      newObs = {
        id,
        type: 'flame',
        name: `Nguồn lửa #${obstacleList.length + 1}`,
        x: 220,
        y: 220,
        z: 0,
        width: 20,
        depth: 20,
        height: 25,
      };
    } else {
      newObs = {
        id,
        type: 'human',
        name: `Người ảo #${obstacleList.length + 1}`,
        x: 200,
        y: 80,
        z: 0,
        width: 25,
        depth: 25,
        height: 80,
      };
    }

    const updated = [...obstacleList, newObs];
    setObstacleList(updated);
    onSaveObstacles(updated);
  };

  const handleRemoveObstacle = (id: string) => {
    const updated = obstacleList.filter(o => o.id !== id);
    setObstacleList(updated);
    onSaveObstacles(updated);
  };

  const handleUpdateObstacleCoord = (id: string, field: 'x' | 'y' | 'z', val: number) => {
    const updated = obstacleList.map(o => (o.id === id ? { ...o, [field]: val } : o));
    setObstacleList(updated);
    onSaveObstacles(updated);
  };

  const handleSaveAll = () => {
    onSaveTagConfig(tagForm);
    onSaveObstacles(obstacleList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base text-slate-100">Thiết kế Sân thi đấu & Bản đồ AprilTag</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {/* Section 1: AprilTag Grid Settings */}
          <div>
            <h3 className="font-semibold text-slate-300 text-sm mb-3 pb-1 border-b border-slate-800 flex items-center gap-2">
              <Grid className="w-4 h-4 text-cyan-400" /> 1. Cấu hình lưới AprilTag trên sàn ({tagForm.tagsPerRow} tag/hàng, {tagForm.spacingCm} cm/tag)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1">Số tag mỗi hàng / cột:</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={tagForm.tagsPerRow}
                  onChange={e => setTagForm({ ...tagForm, tagsPerRow: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 font-mono"
                />
                <span className="text-[10px] text-slate-500">Mặc định: 20 tag mỗi hàng</span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Khoảng cách giữa các tag (cm):</label>
                <input
                  type="number"
                  min="10"
                  max="150"
                  value={tagForm.spacingCm}
                  onChange={e => setTagForm({ ...tagForm, spacingCm: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 font-mono"
                />
                <span className="text-[10px] text-slate-500">Mặc định: 30 cm</span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Khoảng cách tag 0 tới mép (cm):</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={tagForm.offsetFromEdgeCm}
                  onChange={e => setTagForm({ ...tagForm, offsetFromEdgeCm: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 font-mono"
                />
                <span className="text-[10px] text-slate-500">Mặc định: 30 cm</span>
              </div>
            </div>
          </div>

          {/* Section 2: Competition Arena Obstacles */}
          <div>
            <div className="flex items-center justify-between pb-1 mb-3 border-b border-slate-800">
              <h3 className="font-semibold text-slate-300 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" /> 2. Chế độ Sân thi đấu (Vòng bay, Cột, Vật cản)
              </h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={showArenaObstacles}
                  onChange={e => onToggleShowArena(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4"
                />
                <span className="text-slate-300 font-medium">Bật hiển thị vật cản</span>
              </label>
            </div>

            {/* Add new obstacle control */}
            <div className="flex items-center gap-2 mb-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400">Thêm đối tượng mới:</span>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as ObstacleType)}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
              >
                <option value="hoop">Vòng bay xuyên qua (Hoop)</option>
                <option value="pole">Cột tiêu Slalom (Pole)</option>
                <option value="barrier">Thanh chắn (Barrier)</option>
                <option value="flame">Nguồn lửa ảo (Flame source)</option>
                <option value="human">Người ảo (Pedestrian/Human)</option>
              </select>
              <button
                onClick={handleAddObstacle}
                className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm vào sân</span>
              </button>
            </div>

            {/* List of current obstacles */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {obstacleList.length === 0 ? (
                <div className="text-center py-6 text-slate-500 italic bg-slate-950/40 rounded border border-slate-800">
                  Chưa có vật cản nào trên sân thi đấu.
                </div>
              ) : (
                obstacleList.map(obs => (
                  <div
                    key={obs.id}
                    className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs gap-3"
                  >
                    <div className="flex items-center gap-2 w-40 truncate font-medium text-slate-200">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <span>{obs.name}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">X:</span>
                        <input
                          type="number"
                          min="10"
                          max="290"
                          value={obs.x}
                          onChange={e => handleUpdateObstacleCoord(obs.id, 'x', Number(e.target.value))}
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-300"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Y:</span>
                        <input
                          type="number"
                          min="10"
                          max="290"
                          value={obs.y}
                          onChange={e => handleUpdateObstacleCoord(obs.id, 'y', Number(e.target.value))}
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-300"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Z:</span>
                        <input
                          type="number"
                          min="0"
                          max="150"
                          value={obs.z}
                          onChange={e => handleUpdateObstacleCoord(obs.id, 'z', Number(e.target.value))}
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-emerald-300"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveObstacle(obs.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                      title="Xóa vật cản"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            * Cảm biến hồng ngoại, ToF và ngọn lửa sẽ phản ứng tương ứng với các vị trí này.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded text-slate-400 hover:bg-slate-800 transition text-xs font-medium"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveAll}
              className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow"
            >
              Lưu & Cập nhật sân
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
