import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import { useDarkMode } from '../../hooks/useDarkMode.ts';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, toggleDark] = useDarkMode();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        dark={dark}
        onToggleDark={toggleDark}
      />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
