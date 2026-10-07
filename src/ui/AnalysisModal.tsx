/**
 * Flight Path Analysis & Multi-run Comparison Modal
 * WhalesBot Eagle 1003
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitCompare,
  Navigation,
  TrendingDown,
  X,
} from 'lucide-react';
import { FlightPathPoint, RunSummary } from '../types/drone';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSummary: RunSummary | null;
  savedRunA: RunSummary | null;
  savedRunB: RunSummary | null;
  onSetRunA: (run: RunSummary) => void;
  onSetRunB: (run: RunSummary) => void;
  onCompareRunsOn3D: (runA: RunSummary | null, runB: RunSummary | null) => void;
  language: 'vi' | 'en';
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  currentSummary,
  savedRunA,
  savedRunB,
  onSetRunA,
  onSetRunB,
  onCompareRunsOn3D,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'compare'>('current');

  if (!isOpen || !currentSummary) return null;

  const isVi = language === 'vi';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-base text-slate-100">
              {isVi ? 'Báo cáo Phân tích Đường bay Drone' : 'Flight Path Analysis Report'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 px-5 py-2 bg-slate-950/60 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-3 py-1.5 rounded font-medium transition ${
              activeTab === 'current'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {isVi ? 'Lần chạy hiện tại' : 'Current Run'}
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition ${
              activeTab === 'compare'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>{isVi ? 'So sánh 2 lần chạy' : 'Compare 2 Runs'}</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {activeTab === 'current' ? (
            <>
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" /> {isVi ? 'Tổng thời gian' : 'Total Time'}
                  </div>
                  <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                    {currentSummary.totalTimeSeconds} <span className="text-xs text-slate-500">{isVi ? 'giây' : 's'}</span>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" /> {isVi ? 'Tổng quãng đường' : 'Total Distance'}
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                    {currentSummary.totalDistanceCm} <span className="text-xs text-slate-500">cm</span>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-400" /> {isVi ? 'Sai số lớn nhất' : 'Max Deviation'}
                  </div>
                  <div className="text-xl font-bold font-mono text-amber-300 mt-1">
                    {currentSummary.maxErrorCm} <span className="text-xs text-slate-500">cm</span>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> {isVi ? 'Sai số điểm cuối' : 'Final Deviation'}
                  </div>
                  <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
                    {currentSummary.finalErrorCm} <span className="text-xs text-slate-500">cm</span>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> {isVi ? 'Mất AprilTag' : 'Tag Losses'}
                  </div>
                  <div className="text-xl font-bold font-mono text-rose-300 mt-1">
                    {currentSummary.tagLossCount} <span className="text-xs text-slate-500">{isVi ? 'lần' : 'times'}</span>
                  </div>
                </div>
              </div>

              {/* Status Notice */}
              {currentSummary.collisionOccurred && (
                <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{currentSummary.collisionDetails || (isVi ? 'Có sự cố va chạm hoặc lỗi trong quá trình bay!' : 'Collision or error occurred!')}</span>
                </div>
              )}

              {/* Chart 1: Altitude Over Time with 50cm and 150cm reference guide lines */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-200 text-sm">
                    {isVi ? '📈 Đồ thị Độ cao theo thời gian (Altitude vs Time)' : '📈 Altitude vs Time'}
                  </h3>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-3 h-0.5 bg-emerald-400 inline-block border-dashed"></span>
                      <span>50 & 150 cm {isVi ? '(Vùng Camera AI)' : '(AI Camera Zone)'}</span>
                    </span>
                    <span className="text-slate-500">{isVi ? 'Đơn vị: cm' : 'Unit: cm'}</span>
                  </div>
                </div>
                <div className="h-44 w-full">
                  <SvgAltitudeChart path={currentSummary.path} />
                </div>
              </div>

              {/* Chart 2: Deviation / Error Over Time */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-200 text-sm">
                    {isVi ? '📉 Đồ thị Sai lệch quỹ đạo (Thực tế vs Lý tưởng)' : '📉 Trajectory Deviation vs Time'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {isVi ? 'Đơn vị: cm' : 'Unit: cm'}
                  </span>
                </div>
                <div className="h-44 w-full">
                  <SvgErrorChart path={currentSummary.path} />
                </div>
              </div>

              {/* Save Run Slot Options */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-slate-400">
                  {isVi ? 'Lưu lần chạy này để so sánh:' : 'Save this run for comparison:'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSetRunA(currentSummary)}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium border border-cyan-800 transition"
                  >
                    {isVi ? 'Lưu làm Lần A' : 'Save as Run A'}
                  </button>
                  <button
                    onClick={() => onSetRunB(currentSummary)}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-pink-300 font-medium border border-pink-800 transition"
                  >
                    {isVi ? 'Lưu làm Lần B' : 'Save as Run B'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* TAB: COMPARE 2 RUNS */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Run A Card */}
                <div className="bg-slate-950/70 border border-cyan-800/60 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-cyan-400 text-sm">
                      {isVi ? 'Lần chạy A (vd: Không gió / Đếm bước)' : 'Run A (e.g. No Wind / Step count)'}
                    </span>
                    <button
                      onClick={() => onSetRunA(currentSummary)}
                      className="text-[11px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700"
                    >
                      {isVi ? 'Dùng lần hiện tại' : 'Use Current'}
                    </button>
                  </div>
                  {savedRunA ? (
                    <div className="space-y-1.5 font-mono text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isVi ? 'Thời gian:' : 'Time:'}</span>
                        <span>{savedRunA.totalTimeSeconds}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isVi ? 'Quãng đường:' : 'Distance:'}</span>
                        <span>{savedRunA.totalDistanceCm} cm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isVi ? 'Sai số lớn nhất:' : 'Max error:'}</span>
                        <span className="text-amber-400">{savedRunA.maxErrorCm} cm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isVi ? 'Sai số cuối:' : 'Final error:'}</span>
                        <span className="text-emerald-400">{savedRunA.finalErrorCm} cm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isVi ? 'Mất Tag:' : 'Tag loss:'}</span>
                        <span>{savedRunA.tagLossCount}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic py-6 text-center">
                      {isVi ? 'Chưa lưu Lần A.' : 'Run A not set.'}
                    </div>
                  )}
                </div>

                {/* Run B Card */}
                <div className="bg-slate-950/70 border border-pink-800/60 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-pink-400 text-sm">
                      {isVi ? 'Lần chạy B (vd: Có gió / Bay theo Tag)' : 'Run B (e.g. Wind / Tag navigation)'}
                    </span>
                    <button
                      onClick={() => onSetRunB(currentSummary)}
                      className="text-[11px] px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-700"
                    >
                      {isVi ? 'Dùng lần hiện tại' : 'Use Current'}
                    </button>
                  </div>
                  {savedRunB ? (
                    <div className="space-y-1.5 font-mono text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isVi ? 'Thời gian:' : 'Time:'}</span>
                        <span>{savedRunB.totalTimeSeconds}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isVi ? 'Quãng đường:' : 'Distance:'}</span>
                        <span>{savedRunB.totalDistanceCm} cm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isVi ? 'Sai số lớn nhất:' : 'Max error:'}</span>
                        <span className="text-amber-400">{savedRunB.maxErrorCm} cm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isVi ? 'Sai số cuối:' : 'Final error:'}</span>
                        <span className="text-emerald-400">{savedRunB.finalErrorCm} cm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isVi ? 'Mất Tag:' : 'Tag loss:'}</span>
                        <span>{savedRunB.tagLossCount}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic py-6 text-center">
                      {isVi ? 'Chưa lưu Lần B.' : 'Run B not set.'}
                    </div>
                  )}
                </div>
              </div>

              {savedRunA && savedRunB && (
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg text-center space-y-3">
                  <div className="text-sm font-semibold text-slate-200">
                    {isVi ? 'Chênh lệch kết quả: Quãng đường lệch ' : 'Difference: Distance delta '}
                    <span className="text-cyan-400 font-mono">
                      {Math.abs(savedRunA.totalDistanceCm - savedRunB.totalDistanceCm).toFixed(1)} cm
                    </span>
                    {isVi ? ', Sai số điểm cuối chênh ' : ', Final error delta '}
                    <span className="text-amber-400 font-mono">
                      {Math.abs(savedRunA.finalErrorCm - savedRunB.finalErrorCm).toFixed(1)} cm
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onCompareRunsOn3D(savedRunA, savedRunB);
                      onClose();
                    }}
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 mx-auto shadow-lg transition"
                  >
                    <GitCompare className="w-4 h-4" />
                    <span>{isVi ? 'Chồng 2 đường bay lên khung mô phỏng 3D' : 'Overlay both paths on 3D simulator'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            {isVi ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SvgAltitudeChart: React.FC<{ path: FlightPathPoint[] }> = ({ path }) => {
  if (!path || path.length < 2) {
    return <div className="w-full h-full flex items-center justify-center text-slate-500 italic">Chưa đủ dữ liệu</div>;
  }

  const width = 800;
  const height = 160;
  const padL = 45;
  const padR = 20;
  const padT = 15;
  const padB = 25;

  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxVal = Math.max(180, Math.ceil(Math.max(...path.map(p => p.altitude)) * 1.15));
  const minVal = 0;
  const maxTime = Math.max(1, path[path.length - 1].time);

  const getY = (val: number) => padT + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;

  const points = path.map(p => {
    const x = padL + (p.time / maxTime) * chartW;
    const y = getY(p.altitude);
    return `${x},${y}`;
  });

  const y50 = getY(50);
  const y150 = getY(150);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      {/* 50cm and 150cm reference guide lines */}
      <line x1={padL} y1={y50} x2={width - padR} y2={y50} stroke="#10b981" strokeDasharray="4,4" strokeWidth="1.5" />
      <text x={width - padR - 5} y={y50 - 4} fill="#10b981" fontSize="9" textAnchor="end" fontFamily="monospace">
        50 cm (Camera min)
      </text>

      <line x1={padL} y1={y150} x2={width - padR} y2={y150} stroke="#10b981" strokeDasharray="4,4" strokeWidth="1.5" />
      <text x={width - padR - 5} y={y150 - 4} fill="#10b981" fontSize="9" textAnchor="end" fontFamily="monospace">
        150 cm (Camera max)
      </text>

      {/* Grid lines */}
      {[0, 0.5, 1].map((ratio, idx) => {
        const y = padT + chartH * (1 - ratio);
        const label = Math.round(minVal + ratio * (maxVal - minVal));
        return (
          <g key={idx}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#1e293b" strokeDasharray="3,3" />
            <text x={padL - 6} y={y + 3} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
              {label}
            </text>
          </g>
        );
      })}

      {/* Time labels */}
      {[0, 0.5, 1].map((ratio, idx) => {
        const x = padL + chartW * ratio;
        const timeVal = (ratio * maxTime).toFixed(1);
        return (
          <text key={idx} x={x} y={height - 5} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
            {timeVal}s
          </text>
        );
      })}

      <polyline
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(' ')}
      />
    </svg>
  );
};

const SvgErrorChart: React.FC<{ path: FlightPathPoint[] }> = ({ path }) => {
  if (!path || path.length < 2) {
    return <div className="w-full h-full flex items-center justify-center text-slate-500 italic">Chưa đủ dữ liệu</div>;
  }

  const width = 800;
  const height = 160;
  const padL = 45;
  const padR = 20;
  const padT = 15;
  const padB = 25;

  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxVal = Math.max(10, Math.ceil(Math.max(...path.map(p => p.errorCm)) * 1.15));
  const minVal = 0;
  const maxTime = Math.max(1, path[path.length - 1].time);

  const points = path.map(p => {
    const x = padL + (p.time / maxTime) * chartW;
    const y = padT + chartH - ((p.errorCm - minVal) / (maxVal - minVal)) * chartH;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      {[0, 0.5, 1].map((ratio, idx) => {
        const y = padT + chartH * (1 - ratio);
        const label = Math.round(minVal + ratio * (maxVal - minVal));
        return (
          <g key={idx}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#1e293b" strokeDasharray="3,3" />
            <text x={padL - 6} y={y + 3} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
              {label}
            </text>
          </g>
        );
      })}

      {[0, 0.5, 1].map((ratio, idx) => {
        const x = padL + chartW * ratio;
        const timeVal = (ratio * maxTime).toFixed(1);
        return (
          <text key={idx} x={x} y={height - 5} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
            {timeVal}s
          </text>
        );
      })}

      <polyline
        fill="none"
        stroke="#f59e0b"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(' ')}
      />
    </svg>
  );
};
