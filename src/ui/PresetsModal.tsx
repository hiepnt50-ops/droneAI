/**
 * Preset Missions Modal for Eagle 1003
 */

import React from 'react';
import { BookOpen, Check, Play, X } from 'lucide-react';
import { PRESET_PROGRAMS, PresetProgram } from '../blocks/presets';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetProgram) => void;
  language?: 'vi' | 'en';
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  language = 'vi',
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<'all' | 'basic' | 'hash' | 'pinwheel' | 'stick'>('all');

  if (!isOpen) return null;
  const isVi = language === 'vi';

  const filtered = PRESET_PROGRAMS.filter(p => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'basic') return !p.category || p.category === 'basic';
    return p.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-base text-slate-100">
              {isVi ? 'Các chương trình & Thử thách mẫu' : 'Preset Flight Missions & Challenges'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-950/70 border-b border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              selectedCategory === 'all'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {isVi ? 'Tất cả mẫu' : 'All Presets'}
          </button>
          <button
            onClick={() => setSelectedCategory('basic')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              selectedCategory === 'basic'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {isVi ? 'Bay cơ bản & Tag' : 'Basic & Tags'}
          </button>
          <button
            onClick={() => setSelectedCategory('hash')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              selectedCategory === 'hash'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            # {isVi ? 'Dấu thăng (Lắp cột / Nét)' : 'Hash (#) Grid'}
          </button>
          <button
            onClick={() => setSelectedCategory('pinwheel')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              selectedCategory === 'pinwheel'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            🌀 {isVi ? 'Chong chóng' : 'Pinwheel'}
          </button>
          <button
            onClick={() => setSelectedCategory('stick')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              selectedCategory === 'stick'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            🥢 {isVi ? 'Đẩy gậy' : 'Stick Push'}
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 text-xs">
          {filtered.map((preset, index) => (
            <div
              key={preset.id}
              className="bg-slate-950/70 border border-slate-800 hover:border-cyan-600/60 rounded-lg p-4 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-lg">
                <div className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                  <span>{preset.name}</span>
                </div>
                <p className="text-slate-400 leading-relaxed">{preset.description}</p>
              </div>

              <button
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 shadow transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Nạp bài tập này</span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
