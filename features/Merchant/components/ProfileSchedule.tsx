import React from 'react';
import { Clock } from 'lucide-react';

interface ProfileScheduleProps {
  schedule: any;
  onChange: (day: string, field: string, value: any) => void;
}

const DAYS_OF_WEEK = [
    { key: 'Seg', label: 'Segunda' },
    { key: 'Ter', label: 'Terça' },
    { key: 'Qua', label: 'Quarta' },
    { key: 'Qui', label: 'Quinta' },
    { key: 'Sex', label: 'Sexta' },
    { key: 'Sáb', label: 'Sábado' },
    { key: 'Dom', label: 'Domingo' }
];

export const ProfileSchedule: React.FC<ProfileScheduleProps> = ({ schedule, onChange }) => {
  return (
    <div className="pt-4 border-t border-gray-100 mt-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock size={18} className="text-brand-600" /> Horários de Funcionamento</h3>
        <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => {
                const daySchedule = schedule[day.key] || { isOpen: false, open: '08:00', close: '18:00' };
                return (
                    <div key={day.key} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3 w-32">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={daySchedule.isOpen} onChange={(e) => onChange(day.key, 'isOpen', e.target.checked)} />
                                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                            <span className={`text-sm font-bold ${daySchedule.isOpen ? 'text-gray-800' : 'text-gray-400'}`}>{day.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="time" disabled={!daySchedule.isOpen} value={daySchedule.open} onChange={(e) => onChange(day.key, 'open', e.target.value)} className="p-1 border border-gray-300 rounded text-sm disabled:opacity-50" />
                            <span className="text-gray-400 text-xs">até</span>
                            <input type="time" disabled={!daySchedule.isOpen} value={daySchedule.close} onChange={(e) => onChange(day.key, 'close', e.target.value)} className="p-1 border border-gray-300 rounded text-sm disabled:opacity-50" />
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};