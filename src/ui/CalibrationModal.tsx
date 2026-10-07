/**
 * Physics & Calibration Parameters Modal for Eagle 1003
 */

import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Download,
  RotateCcw,
  Save,
  Sliders,
  Upload,
  Wind,
  X,
} from 'lucide-react';
import { CalibrationConfig } from '../types/drone';
import { DEFAULT_CALIBRATION } from '../simulator/physics';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CalibrationConfig;
  onSave: (newConfig: CalibrationConfig) => void;
  language: 'vi' | 'en';
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  language,
}) => {
  const [formData, setFormData] = useState<CalibrationConfig>({ ...config });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleResetDefaults = () => {
    setFormData({ ...DEFAULT_CALIBRATION });
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleExportConfig = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'eagle1003_calibration.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        setFormData({ ...DEFAULT_CALIBRATION, ...parsed });
      } catch {
        alert('File JSON cấu hình không hợp lệ!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isVi = language === 'vi';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-base text-slate-100">
              {isVi ? 'Hiệu chỉnh Mô hình Vật lý & Sân bay' : 'Physics & Field Calibration'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="px-5 py-2.5 bg-amber-950/40 border-b border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>{isVi ? 'Lưu ý:' : 'Note:'}</strong>{' '}
            {isVi
              ? 'Các hằng số sau là giá trị giả định ban đầu phục vụ mô phỏng giáo dục, cần thay bằng số đo thực tế từ drone WhalesBot Eagle 1003 thật.'
              : 'These constants are educational simulation assumptions and should be verified with real WhalesBot Eagle 1003 measurements.'}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Section 1: Speeds */}
          <div>
            <h3 className="font-semibold text-slate-300 text-sm mb-3 pb-1 border-b border-slate-800">
              {isVi ? '1. Tốc độ chuyển động' : '1. Flight Speeds'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">
                  {isVi ? 'Tốc độ bay mặc định (cm/s):' : 'Default speed (cm/s):'}
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={formData.defaultSpeed}
                  onChange={e => setFormData({ ...formData, defaultSpeed: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-cyan-300 font-mono"
                />
                <span className="text-[10px] text-slate-500">{isVi ? 'Mặc định: 50 cm/s' : 'Default: 50 cm/s'}</span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  {isVi ? 'Tốc độ tối đa cho phép (cm/s):' : 'Max allowed speed (cm/s):'}
                </label>
                <input
                  type="number"
                  min="50"
                  max="150"
                  value={formData.maxSpeed}
                  onChange={e => setFormData({ ...formData, maxSpeed: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-cyan-300 font-mono"
                />
                <span className="text-[10px] text-slate-500">{isVi ? 'Mặc định: 100 cm/s' : 'Default: 100 cm/s'}</span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  {isVi ? 'Tốc độ cất cánh (cm/s):' : 'Takeoff speed (cm/s):'}
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={formData.takeoffSpeed}
                  onChange={e => setFormData({ ...formData, takeoffSpeed: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-cyan-300 font-mono"
                />
                <span className="text-[10px] text-slate-500">{isVi ? 'Mặc định: 40 cm/s' : 'Default: 40 cm/s'}</span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  {isVi ? 'Tốc độ hạ cánh (cm/s):' : 'Landing speed (cm/s):'}
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={formData.landingSpeed}
                  onChange={e => setFormData({ ...formData, landingSpeed: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-cyan-300 font-mono"
                />
                <span className="text-[10px] text-slate-500">{isVi ? 'Mặc định: 30 cm/s' : 'Default: 30 cm/s'}</span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  {isVi ? 'Tốc độ quay góc (độ/giây):' : 'Turn rate (deg/s):'}
                </label>
                <input
                  type="number"
                  min="20"
                  max="180"
                  value={formData.turnSpeed}
                  onChange={e => setFormData({ ...formData, turnSpeed: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-cyan-300 font-mono"
                />
                <span className="text-[10px] text-slate-500">{isVi ? 'Mặc định: 90 độ/giây' : 'Default: 90 deg/s'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Physical Noise & Drift */}
          <div>
            <h3 className="font-semibold text-slate-300 text-sm mb-3 pb-1 border-b border-slate-800">
              {isVi ? '2. Hệ số & Sai số cơ khí' : '2. Physics Noise & Drift'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">
                  {isVi ? 'Hệ số quãng đường (thật / lệnh):' : 'Distance factor (real / cmd):'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.8"
                  max="1.2"
                  value={formData.distanceFactor}
                  onChange={e => setFormData({ ...formData, distanceFactor: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-cyan-300 font-mono"
                />
                <span className="text-[10px] text-slate-500">{isVi ? 'Mặc định: 1.00' : 'Default: 1.00'}</span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  {isVi ? 'Sai số quãng đường (± cm):' : 'Distance error (± cm):'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={formData.distanceStdDevCm}
                  onChange={e => setFormData({ ...formData, distanceStdDevCm: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-cyan-300 font-mono"
                />
                <span className="text-[10px] text-slate-500">{isVi ? 'Mặc định: ± 2.0 cm' : 'Default: ± 2.0 cm'}</span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  {isVi ? 'Sai số góc quay Yaw (± độ):' : 'Yaw rotation error (± deg):'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={formData.yawErrorDeg}
                  onChange={e => setFormData({ ...formData, yawErrorDeg: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-cyan-300 font-mono"
                />
                <span className="text-[10px] text-slate-500">{isVi ? 'Mặc định: ± 2.0°' : 'Default: ± 2.0°'}</span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  {isVi ? 'Độ trôi khi hover (cm / √giây):' : 'Hover drift (cm / sqrt(s)):'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.hoverDriftRate}
                  onChange={e => setFormData({ ...formData, hoverDriftRate: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-cyan-300 font-mono"
                />
                <span className="text-[10px] text-slate-500">{isVi ? 'Mặc định: 1.5 cm/√s' : 'Default: 1.5 cm/√s'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Arena Size & Axis Convention */}
          <div>
            <h3 className="font-semibold text-slate-300 text-sm mb-3 pb-1 border-b border-slate-800">
              {isVi ? '3. Kích thước Sân & Quy ước Trục 3D' : '3. Field Dimensions & 3-Axis Convention'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">
                  {isVi ? 'Chiều rộng sân X (300 - 600 cm):' : 'Field width X (300 - 600 cm):'}
                </label>
                <input
                  type="number"
                  min="300"
                  max="600"
                  step="50"
                  value={formData.fieldWidthCm}
                  onChange={e => setFormData({ ...formData, fieldWidthCm: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-cyan-300 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  {isVi ? 'Chiều dài sân Y (300 - 600 cm):' : 'Field length Y (300 - 600 cm):'}
                </label>
                <input
                  type="number"
                  min="300"
                  max="600"
                  step="50"
                  value={formData.fieldHeightCm}
                  onChange={e => setFormData({ ...formData, fieldHeightCm: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-cyan-300 font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">
                  {isVi ? 'Quy ước trục cho khối "bay cự ly chỉ định x y z":' : '3-axis convention for designated distance block:'}
                </label>
                <select
                  value={formData.axisConvention}
                  onChange={e => setFormData({ ...formData, axisConvention: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-200"
                >
                  <option value="forward_left_up">
                    {isVi ? 'x = tiến, y = trái, z = lên (Mặc định Eagle 1003)' : 'x = forward, y = left, z = up (Eagle 1003 default)'}
                  </option>
                  <option value="right_forward_up">
                    {isVi ? 'x = phải, y = tiến, z = lên (Hệ tọa độ Descartes)' : 'x = right, y = forward, z = up (Cartesian)'}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Wind Simulation */}
          <div>
            <h3 className="font-semibold text-slate-300 text-sm mb-3 pb-1 border-b border-slate-800 flex items-center gap-2">
              <Wind className="w-4 h-4 text-sky-400" />
              <span>{isVi ? '4. Luồng gió môi trường' : '4. Environmental Wind'}</span>
            </h3>
            <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.windEnabled}
                  onChange={e => setFormData({ ...formData, windEnabled: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4"
                />
                <span className="font-medium text-slate-200">
                  {isVi ? 'Kích hoạt gió thổi làm lệch drone' : 'Enable wind deflection'}
                </span>
              </label>

              {formData.windEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      {isVi ? 'Hướng gió (0° = Bắc, 90° = Đông):' : 'Wind direction (0° = North, 90° = East):'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={formData.windDirectionDeg}
                      onChange={e => setFormData({ ...formData, windDirectionDeg: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-cyan-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      {isVi ? 'Tốc độ gió (cm/s):' : 'Wind speed (cm/s):'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={formData.windSpeedCmS}
                      onChange={e => setFormData({ ...formData, windSpeedCmS: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-cyan-300 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: PRNG Seed */}
          <div>
            <h3 className="font-semibold text-slate-300 text-sm mb-3 pb-1 border-b border-slate-800">
              {isVi ? '5. Hạt giống ngẫu nhiên (Seed)' : '5. Random Seed'}
            </h3>
            <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.useSeed}
                  onChange={e => setFormData({ ...formData, useSeed: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4"
                />
                <span className="font-medium text-slate-200">
                  {isVi ? 'Cố định hạt giống ngẫu nhiên (chạy lại kết quả giống nhau)' : 'Use fixed seed for reproducible runs'}
                </span>
              </label>
              {formData.useSeed && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Seed:</span>
                  <input
                    type="number"
                    value={formData.seed}
                    onChange={e => setFormData({ ...formData, seed: Number(e.target.value) })}
                    className="w-28 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-cyan-300 font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 6: Export / Import JSON */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <span className="text-slate-400">{isVi ? 'Sao lưu / Phục hồi cấu hình:' : 'Backup / Restore config:'}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportConfig}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isVi ? 'Xuất JSON' : 'Export JSON'}</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isVi ? 'Nhập JSON' : 'Import JSON'}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportConfig}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center gap-1.5 transition text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isVi ? 'Mặc định ban đầu' : 'Reset defaults'}</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded text-slate-300 hover:bg-slate-800 transition text-xs font-medium"
            >
              {isVi ? 'Hủy' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition text-xs font-semibold shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isVi ? 'Áp dụng cấu hình' : 'Apply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
