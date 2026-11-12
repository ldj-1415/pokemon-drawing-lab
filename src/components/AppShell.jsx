import { useLab } from '../context/LabContext.jsx';
import { Icon, PokeballMark } from './Icon.jsx';
import { ToastStack } from './ToastStack.jsx';

const NAV_ITEMS = [
  { id: 'workbench', label: '随机工作台', short: '工作台', icon: 'sparkles', eyebrow: 'WORKBENCH' },
  { id: 'inspiration', label: '绘画灵感工坊', short: '灵感', icon: 'bulb', eyebrow: 'INSPIRATION' },
  { id: 'settings', label: '筛选设置', short: '设置', icon: 'sliders', eyebrow: 'SETTINGS' },
  { id: 'gallery', label: '我的图库', short: '图库', icon: 'image', eyebrow: 'GALLERY' },
  { id: 'favorites', label: '我的收藏', short: '收藏', icon: 'heart', eyebrow: 'FAVORITES' },
  { id: 'history', label: '抽取历史', short: '历史', icon: 'history', eyebrow: 'HISTORY' },
];

function apiStatusLabel(status) {
  if (status === 'online') return 'PokeAPI 已连接';
  if (status === 'offline') return '离线 · 使用本地图鉴';
  return '正在检查 PokeAPI';
}

export function AppShell({ children }) {
  const { page, navigate, favorites, history, gallery, pokedex } = useLab();
  const counts = {
    gallery: gallery.stats.total,
    favorites: favorites.length,
    history: history.length,
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="主导航">
        <button type="button" className="brand" onClick={() => navigate('workbench')}>
          <span className="brand-mark"><PokeballMark size={42} /></span>
          <span className="brand-copy">
            <span className="brand-name">PokéDraw<span>Lab</span></span>
            <span className="brand-sub">宝可梦绘画随机工作台</span>
          </span>
        </button>

        <span className="sidebar-label">创作空间</span>
        <nav className="side-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${page === item.id ? 'is-active' : ''}`.trim()}
              onClick={() => navigate(item.id)}
              aria-current={page === item.id ? 'page' : undefined}
            >
              <span className="nav-icon"><Icon name={item.icon} size={20} /></span>
              <span className="nav-copy">
                <span>{item.label}</span>
                <small>{item.eyebrow}</small>
              </span>
              {counts[item.id] ? <span className="nav-count">{counts[item.id]}</span> : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-panel">
          <span className="sidebar-panel-icon"><Icon name="database" size={18} /></span>
          <div>
            <strong>全国图鉴 {pokedex.dex.length.toLocaleString('zh-CN')} 只</strong>
            <p>PokeAPI · 本地缓存</p>
          </div>
        </div>

        <button
          type="button"
          className={`api-status api-status-${pokedex.apiStatus}`}
          onClick={() => navigate('settings')}
          title={`${apiStatusLabel(pokedex.apiStatus)}。点击前往数据设置。`}
        >
          <span className="api-dot" aria-hidden="true" />
          <span>{apiStatusLabel(pokedex.apiStatus)}</span>
          <Icon name="chevron-right" size={14} />
        </button>
        <p className="sidebar-footnote">无需登录，所有设置与作品都保存在本机浏览器。</p>
      </aside>

      <header className="mobile-header">
        <button type="button" className="brand brand-mobile" onClick={() => navigate('workbench')}>
          <span className="brand-mark"><PokeballMark size={34} /></span>
          <span className="brand-copy">
            <span className="brand-name">PokéDraw<span>Lab</span></span>
            <span className="brand-sub">绘画随机工作台</span>
          </span>
        </button>
        <button
          type="button"
          className={`mobile-api api-status-${pokedex.apiStatus}`}
          onClick={() => navigate('settings')}
          aria-label={apiStatusLabel(pokedex.apiStatus)}
        >
          <span className="api-dot" />
        </button>
      </header>

      <main className="app-main">
        <div className="page-container">{children}</div>
      </main>

      <nav className="mobile-nav" aria-label="移动端主导航">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`mobile-nav-item ${page === item.id ? 'is-active' : ''}`.trim()}
            onClick={() => navigate(item.id)}
            aria-current={page === item.id ? 'page' : undefined}
          >
            <span className="mobile-nav-icon">
              <Icon name={item.icon} size={21} />
              {counts[item.id] ? <span className="mobile-nav-count">{counts[item.id] > 99 ? '99+' : counts[item.id]}</span> : null}
            </span>
            <span>{item.short}</span>
          </button>
        ))}
      </nav>

      <ToastStack />
    </div>
  );
}
