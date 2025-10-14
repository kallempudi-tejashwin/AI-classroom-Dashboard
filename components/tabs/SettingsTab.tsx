
import React from 'react';
import { ACCENT_COLORS } from '../../constants';

interface SettingsTabProps {
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ accentColor, setAccentColor }) => {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-4">Personalization & Settings</h2>
      
      <div className="p-6 bg-white/5 rounded-lg border border-white/10">
        <h3 className="text-lg font-semibold mb-3">Accent Color</h3>
        <div className="flex items-center gap-4">
          {ACCENT_COLORS.map(item => (
            <button
              key={item.name}
              onClick={() => setAccentColor(item.color)}
              className={`w-10 h-10 rounded-full ${item.color} transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 ${accentColor === item.color ? item.ring : 'ring-transparent'} ring-offset-2 ring-offset-gray-800`}
              aria-label={`Set accent color to ${item.name}`}
            />
          ))}
        </div>
      </div>
      
      <div className="mt-6 p-6 bg-white/5 rounded-lg border border-white/10">
        <h3 className="text-lg font-semibold mb-3">Notification Preferences</h3>
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label htmlFor="email-notifications" className="text-gray-300">Email Notifications</label>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="email-notifications" value="" className="sr-only peer" defaultChecked/>
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
            </div>
            <div className="flex items-center justify-between">
                <label htmlFor="push-notifications" className="text-gray-300">Push Notifications</label>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="push-notifications" value="" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
