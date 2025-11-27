import React from 'react';
import { WifiIcon, WifiSlashIcon } from './Icons';

interface FancyToggleSwitchProps {
    id: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}

const FancyToggleSwitch: React.FC<FancyToggleSwitchProps> = ({ id, checked, onChange, disabled }) => {
    return (
        <label htmlFor={id} className="relative inline-flex items-center cursor-pointer group">
            <input 
                type="checkbox" 
                id={id} 
                checked={checked} 
                onChange={onChange} 
                disabled={disabled} 
                className="sr-only peer" 
            />
            {/* Track */}
            <div className={`
                w-20 h-10 
                rounded-full 
                shadow-inner
                transition-all duration-300 ease-in-out
                peer-checked:bg-gradient-to-r peer-checked:from-cyan-400 peer-checked:to-blue-500 
                bg-slate-300
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}></div>
            
            {/* Thumb */}
            <div className={`
                absolute top-1 left-1 
                w-8 h-8 
                bg-white rounded-full 
                shadow-lg 
                flex items-center justify-center
                transition-all duration-300 ease-in-out
                transform 
                peer-checked:translate-x-10
                group-hover:scale-110
                active:scale-95
            `}>
                {/* Wifi Icon (On) */}
                <div className={`absolute transition-all duration-300 ease-in-out transform ${checked ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`}>
                    <WifiIcon className="w-5 h-5 text-blue-500" />
                </div>
                {/* Wifi Slash Icon (Off) */}
                 <div className={`absolute transition-all duration-300 ease-in-out transform ${!checked ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`}>
                    <WifiSlashIcon className="w-5 h-5 text-slate-500" />
                </div>
            </div>
        </label>
    );
};

export default FancyToggleSwitch;
