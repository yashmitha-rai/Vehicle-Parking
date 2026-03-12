import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Activity, FileText, ParkingSquare, BarChart3, AlertCircle, User, LogOut, Phone } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Slot Management', path: '/admin/slots', icon: ParkingSquare },
    { name: 'All Sessions', path: '/admin/sessions', icon: FileText },
    { name: 'Contacts', path: '/admin/contacts', icon: Phone },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="h-screen w-64 bg-slate-900 text-slate-100 flex flex-col fixed left-0 top-0 shadow-xl">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <ParkingSquare className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight">ParkSpace</div>
            <div className="text-xs text-slate-400 font-medium">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                active
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon 
                className={`w-5 h-5 transition-transform ${
                  active ? '' : 'group-hover:scale-110'
                }`} 
                strokeWidth={2}
              />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info at Bottom */}
      <div className="p-4 border-t border-slate-800 bg-slate-800/50">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full flex items-center justify-center shadow-sm">
            <User className="w-5 h-5 text-slate-200" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-slate-100 truncate">Admin User</div>
            <div className="text-xs text-slate-400 truncate">admin@parking.com</div>
          </div>
        </div>
        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200 text-sm font-medium">
          <LogOut className="w-4 h-4" strokeWidth={2} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;