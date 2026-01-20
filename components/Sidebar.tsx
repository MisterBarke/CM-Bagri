
import React from 'react';
import { BAGRI_LOGO, Icons } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <Icons.Dashboard /> },
    { id: 'veille', label: 'Veille Concurrentielle', icon: <Icons.Trends /> },
    { id: 'calendar', label: 'Calendrier Editorial', icon: <Icons.Calendar /> },
    { id: 'generator', label: 'Générateur de Post', icon: <Icons.Plus /> },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center justify-center border-b">
        <img src={BAGRI_LOGO} alt="BAGRI Logo" className="h-16 object-contain" />
      </div>
      
      <nav className="flex-1 mt-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-orange-50 text-bagri-orange border-r-4 border-bagri-orange'
                : 'text-gray-600 hover:bg-gray-50 hover:text-bagri-green'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-bagri-green flex items-center justify-center text-white font-bold">
            CM
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Comm. Manager</p>
            <p className="text-xs text-gray-500">BAGRI Niger</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
