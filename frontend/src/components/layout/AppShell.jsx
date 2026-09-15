import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppShell() {
  // Application-level site selection state
  const [selectedSite, setSelectedSite] = useState('site-4');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isMobileOpen={isMobileOpen} onCloseMobile={() => setIsMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          selectedSite={selectedSite} 
          onSiteChange={setSelectedSite} 
          onMenuClick={() => setIsMobileOpen(true)} 
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full relative">
          <Outlet context={{ selectedSite }} />
        </main>
      </div>
    </div>
  );
}
