import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/common/Navbar';
import { Sidebar } from '@/components/common/Sidebar';
import { Footer } from '@/components/common/Footer';
import { useAuth } from '@/context/AuthContext';

export const AppLayout: React.FC<{ withSidebar?: boolean }> = ({ withSidebar = false }) => {
  const { isAuthenticated } = useAuth();
  const showSidebar = withSidebar && isAuthenticated;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100">
      <Navbar />
      <div className="flex-1 flex">
        {showSidebar && <Sidebar />}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};
