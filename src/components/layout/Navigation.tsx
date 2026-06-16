import React from 'react';
import { BookOpen, User, Settings, BarChart3, Heart, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange, isOpen }) => {
  const { user, isAdmin } = useAuth();

  const navItems = [
    { id: 'library', label: 'Browse Books', icon: BookOpen },
    ...(user ? [
      { id: 'dashboard', label: 'My Dashboard', icon: User },
      { id: 'wishlist', label: 'Wishlist', icon: Heart },
      { id: 'reservations', label: 'Reservations', icon: Clock },
    ] : []),
    ...(isAdmin ? [
      { id: 'admin', label: 'Admin Panel', icon: Settings },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 }
    ] : [])
  ];

  return (
    <nav className={`${
      isOpen ? 'block' : 'hidden'
    } md:block bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 w-full md:w-64 min-h-screen`}>
      <div className="p-4">
        <ul className="space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                    currentView === item.id
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};