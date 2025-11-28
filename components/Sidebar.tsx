
import React from 'react';
import { DashboardIcon, CollectionIcon, ClockIcon, EllipsisHorizontalIcon, BanknotesIcon, ArrowLeftOnRectangleIcon } from './Icons';

type View = 'dashboard' | 'collections' | 'members' | 'history' | 'remitted' | 'menu' | 'settings' | 'profile';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  setSelectedCollectionId: (id: string | null) => void;
  isMobileNavVisible: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, setSelectedCollectionId, isMobileNavVisible }) => {
  
  const navItems = [
    { view: 'dashboard' as const, label: 'Home', icon: DashboardIcon },
    { view: 'collections' as const, label: 'Collect', icon: CollectionIcon },
    { view: 'remitted' as const, label: 'Remitted', icon: BanknotesIcon },
    { view: 'history' as const, label: 'History', icon: ClockIcon },
    { view: 'menu' as const, label: 'Menu', icon: EllipsisHorizontalIcon },
  ];

  const handleNavClick = (view: View) => {
    setSelectedCollectionId(null);
    setActiveView(view);
  };

  const handleReturnToPortal = () => {
      const url = localStorage.getItem('bseePortalReturnUrl');
      if (url) {
          window.location.href = url;
      } else {
          alert("Return URL has not been configured in the Vault.");
      }
  };

  return (
    <>
      {/* Desktop Sidebar - Frosted Glass Panel */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white/60 backdrop-blur-2xl border-r border-white/40 p-4 fixed h-full z-40 shadow-[2px_0_24px_rgba(0,0,0,0.02)]">
          <div className="py-4 px-2 flex items-center space-x-2 mb-4">
               <div className="h-3 w-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"></div>
               <div className="h-3 w-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors"></div>
               <div className="h-3 w-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors"></div>
          </div>
           <div className="px-2 mb-8">
               <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                  Treasurer's Portal
              </h1>
              <p className="text-xs text-slate-500 font-medium">Blue Edition</p>
           </div>
          <nav className="space-y-1.5 flex-grow">
              {navItems.map(item => {
                  const isActive = activeView === item.view;
                  const buttonClass = `flex items-center w-full px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 group ${
                      isActive
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                          : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
                  }`;
                  const iconClass = `h-5 w-5 mr-3 transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'
                  }`;

                  return (
                      <button 
                          key={item.view} 
                          onClick={() => handleNavClick(item.view)} 
                          className={buttonClass}
                          aria-current={isActive ? 'page' : undefined}
                      >
                          <item.icon className={iconClass} />
                          {item.label}
                      </button>
                  );
              })}
          </nav>
          
          <div className="pt-4 mt-4 border-t border-white/40">
              <button 
                  onClick={handleReturnToPortal}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-2xl text-slate-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300 group"
              >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3 text-slate-500 group-hover:text-red-600 transition-colors" />
                  Return to Portal
              </button>
          </div>
      </aside>

      {/* Mobile Dock - Floating macOS Style */}
      <div className={`md:hidden fixed bottom-4 left-4 right-4 z-50 transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${isMobileNavVisible ? 'translate-y-0' : 'translate-y-[150%]'}`}>
          <nav className="flex justify-between items-center h-[4.5rem] bg-white/75 backdrop-blur-2xl border border-white/50 shadow-2xl shadow-slate-300/30 rounded-[2.5rem] px-2">
              {navItems.map(item => {
                  const isActive = activeView === item.view;
                  // Added gap-0.5 and removed margin-bottom from icon to keep them tight
                  const buttonClass = `flex flex-col items-center justify-center w-full h-full rounded-[2rem] transition-all duration-200 gap-0.5 ${
                      isActive ? '' : 'hover:bg-white/40'
                  }`;
                  
                  const iconContainerClass = `p-2 rounded-2xl transition-all duration-300 flex items-center justify-center ${
                      isActive 
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' 
                      : 'bg-transparent text-slate-500'
                  }`;

                  return (
                       <button 
                          key={item.view} 
                          onClick={() => handleNavClick(item.view)} 
                          className={buttonClass}
                          aria-current={isActive ? 'page' : undefined}
                       >
                          <div className={iconContainerClass}>
                             <item.icon className={`h-6 w-6 transition-transform duration-200 ${isActive ? 'scale-100' : 'scale-90'}`} />
                          </div>
                          <span className={`text-[10px] font-semibold tracking-wide transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                              {item.label}
                          </span>
                      </button>
                  );
              })}
          </nav>
      </div>
    </>
  );
};

export default Sidebar;
