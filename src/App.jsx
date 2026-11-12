import { useEffect } from 'react';
import { LabProvider, useLab } from './context/LabContext.jsx';
import { AppShell } from './components/AppShell.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { WorkbenchPage } from './pages/WorkbenchPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { GalleryPage } from './pages/GalleryPage.jsx';
import { InspirationPage } from './pages/InspirationPage.jsx';
import { FavoritesPage } from './pages/FavoritesPage.jsx';
import { HistoryPage } from './pages/HistoryPage.jsx';

const PAGE_TITLES = {
  workbench: '随机工作台',
  inspiration: '绘画灵感工坊',
  settings: '筛选设置',
  gallery: '我的图库',
  favorites: '我的收藏',
  history: '抽取历史',
};

function RoutedPage() {
  const { page } = useLab();

  useEffect(() => {
    document.title = `${PAGE_TITLES[page]} · Pokémon Drawing Lab`;
  }, [page]);

  let content;
  if (page === 'inspiration') content = <InspirationPage />;
  else if (page === 'settings') content = <SettingsPage />;
  else if (page === 'gallery') content = <GalleryPage />;
  else if (page === 'favorites') content = <FavoritesPage />;
  else if (page === 'history') content = <HistoryPage />;
  else content = <WorkbenchPage />;

  return <div key={page} className="page-transition">{content}</div>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <LabProvider>
        <AppShell>
          <RoutedPage />
        </AppShell>
      </LabProvider>
    </ErrorBoundary>
  );
}
