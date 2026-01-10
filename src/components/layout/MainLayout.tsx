import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isRTL } = useI18n();

  return (
    <div className={cn('flex min-h-screen bg-background', isRTL && 'flex-row-reverse')}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
