import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import { useDarkMode } from '../../hooks/useDarkMode.ts';

const MOBILE_QUERY = '(max-width: 767px)';

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

export default function AppLayout() {
  // Start collapsed on mobile so the sidebar doesn't squeeze the main content
  const [collapsed, setCollapsed] = useState<boolean>(() => isMobile());
  const [dark, toggleDark] = useDarkMode();

  // Auto-collapse whenever the viewport drops into the mobile range
  // (e.g. on rotation or resize). Doesn't force-expand on desktop so the
  // user's preference is preserved while on larger screens.
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setCollapsed(true);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

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
