import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white/40 backdrop-blur-2xl overflow-hidden shadow-xl shadow-stone-200/20 rounded-[2rem] border border-white/50 h-full">
      <div className="p-6 flex items-center h-full">
        <div className={`flex-shrink-0 ${color} backdrop-blur-md rounded-2xl p-4 shadow-inner`}>
          {icon}
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-xs font-bold text-stone-500 uppercase tracking-wide truncate">{title}</dt>
            <dd className="text-2xl font-extrabold text-stone-800 mt-1 tracking-tight">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default StatCard;