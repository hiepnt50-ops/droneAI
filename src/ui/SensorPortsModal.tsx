/**
 * Sensor Ports Configuration Modal (P1 - P4)
 */

import React, { useState } from 'react';
import { Radio, Save, X } from 'lucide-react';
import {
  SensorDirection,
  SensorPortId,
  SensorPortsMap,
  SensorPortType,
} from '../types/drone';

interface SensorPortsModalProps {
  isOpen: boolean;
  onClose: () => void;
  portsConfig: SensorPortsMap;
  onSave: (newPorts: SensorPortsMap) => void;
  language: 'vi' | 'en';
}

const SENSOR_TYPE_LABELS: Record<SensorPortType, { vi: string; en: string }> = {
  none: { vi: 'Không gắn', en: 'None' },
  ir_ranging: { vi: 'Hồng ngoại đo khoảng cách (IR Ranging)', en: 'IR Ranging Sensor' },
  ir_obstacle: { vi: 'Hồng ngoại phát hiện vật cản (IR Obstacle)', en: 'IR Obstacle Sensor' },
  human_ir: { vi: 'Hồng ngoại thân nhiệt người (PIR Human)', en: 'PIR Human Sensor' },
  ultrasonic: { vi: 'Siêu âm đo khoảng cách (Ultrasonic)', en: 'Ultrasonic Distance' },
  analog: { vi: 'Ngõ vào tương tự (Analog Input)', en: 'Analog Sensor' },
};

const DIRECTION_LABELS: Record<SensorDirection, { vi: string; en: string }> = {
  front: { vi: 'Phía trước (Front)', en: 'Front' },
  back: { vi: 'Phía sau (Back)', en: 'Back' },
  left: { vi: 'Bên trái (Left)', en: 'Left' },
  right: { vi: 'Bên phải (Right)', en: 'Right' },
  down: { vi: 'Hướng xuống (Down)', en: 'Down' },
};

export const SensorPortsModal: React.FC<SensorPortsModalProps> = ({
  isOpen,
  onClose,
  portsConfig,
  onSave,
  language,
}) => {
  const [formData, setFormData] = useState<SensorPortsMap>({ ...portsConfig });

  if (!isOpen) return null;

  const handleUpdate = (port: SensorPortId, field: 'type' | 'direction', value: any) => {
    setFormData(prev => ({
      ...prev,
      [port]: {
        ...prev[port],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const portList: SensorPortId[] = ['P1', 'P2', 'P3', 'P4'];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#6A5FE0]" />
            <h2 className="font-bold text-base text-slate-100">
              {language === 'vi' ? 'Cấu hình Cổng Cảm Biến Ngoài (P1 - P4)' : 'External Sensor Ports Configuration (P1 - P4)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-400">
            {language === 'vi'
              ? 'Gán loại cảm biến và hướng gắn vào thân drone cho từng cổng P1 đến P4. Cảm biến khoảng cách sẽ phản hồi tín hiệu khi gặp vật thể ảo trên sân.'
              : 'Assign sensor types and mounting directions to ports P1-P4. Distance sensors will react to virtual objects placed on the arena.'}
          </p>

          <div className="space-y-3">
            {portList.map(port => {
              const cfg = formData[port];
              return (
                <div
                  key={port}
                  className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[#6A5FE0]/20 text-[#6A5FE0] border border-[#6A5FE0]/40 flex items-center justify-center font-bold font-mono text-sm">
                      {port}
                    </span>
                    <span className="font-semibold text-slate-300">
                      {language === 'vi' ? `Cổng ${port}` : `Port ${port}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Sensor Type */}
                    <select
                      value={cfg.type}
                      onChange={e => handleUpdate(port, 'type', e.target.value as SensorPortType)}
                      className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#6A5FE0]"
                    >
                      {(Object.keys(SENSOR_TYPE_LABELS) as SensorPortType[]).map(t => (
                        <option key={t} value={t}>
                          {SENSOR_TYPE_LABELS[t][language]}
                        </option>
                      ))}
                    </select>

                    {/* Direction */}
                    <select
                      value={cfg.direction}
                      onChange={e => handleUpdate(port, 'direction', e.target.value as SensorDirection)}
                      className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#6A5FE0]"
                      disabled={cfg.type === 'none'}
                    >
                      {(Object.keys(DIRECTION_LABELS) as SensorDirection[]).map(d => (
                        <option key={d} value={d}>
                          {DIRECTION_LABELS[d][language]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-slate-300 hover:bg-slate-800 transition text-xs font-medium"
          >
            {language === 'vi' ? 'Hủy' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded bg-[#6A5FE0] hover:bg-[#5C51CC] text-white flex items-center gap-1.5 transition text-xs font-semibold shadow"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Lưu cấu hình' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
