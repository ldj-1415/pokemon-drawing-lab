import { useState } from 'react';
import { useLab } from '../context/LabContext.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { SavedCompositionCard } from '../components/SavedCompositionCard.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { Icon } from '../components/Icon.jsx';

export function FavoritesPage() {
  const {
    favorites,
    removeFavorite,
    loadFavorite,
    clearFavorites,
    navigate,
  } = useLab();
  const [clearOpen, setClearOpen] = useState(false);

  return (
    <div className="page page-favorites">
      <PageHeader
        eyebrow="SAVED COMPOSITIONS"
        title="我的收藏"
        description="收藏会保存完整绘画组合：宝可梦、场景、天气、时间、动作、互动、特殊事件与创建时间。"
        actions={favorites.length ? (
          <button type="button" className="button button-ghost button-danger-text" onClick={() => setClearOpen(true)}>
            <Icon name="trash" size={16} />
            清空收藏
          </button>
        ) : null}
      />

      <div className="collection-stats">
        <div className="collection-stat">
          <span className="collection-stat-icon"><Icon name="heart" size={20} /></span>
          <div><strong>{favorites.length}</strong><span>个完整组合</span></div>
        </div>
        <div className="collection-stat">
          <span className="collection-stat-icon"><Icon name="database" size={20} /></span>
          <div><strong>本地</strong><span>无需登录，随时载入</span></div>
        </div>
        <div className="collection-stat collection-stat-wide">
          <span className="collection-stat-icon"><Icon name="info" size={20} /></span>
          <div><strong>图片只存 URL</strong><span>不把图片二进制塞进 localStorage</span></div>
        </div>
      </div>

      {favorites.length ? (
        <div className="saved-grid">
          {favorites.map((favorite) => (
            <SavedCompositionCard
              key={favorite.id}
              entry={favorite}
              variant="favorite"
              onLoad={loadFavorite}
              onDelete={removeFavorite}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="heart"
          title="还没有收藏任何绘画组合"
          description="在随机工作台抽到喜欢的组合后，点击「收藏完整组合」。它会连同场景、天气、时间、动作、互动和特殊事件一起保存。"
          action={(
            <button type="button" className="button button-primary" onClick={() => navigate('workbench')}>
              <Icon name="sparkles" size={17} />
              去随机一轮
            </button>
          )}
        />
      )}

      <ConfirmDialog
        open={clearOpen}
        title="清空全部收藏？"
        description={`将删除 ${favorites.length} 个收藏组合。这个操作无法撤销，但历史记录不会受到影响。`}
        confirmLabel="清空收藏"
        cancelLabel="保留收藏"
        tone="danger"
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          clearFavorites();
          setClearOpen(false);
        }}
      />
    </div>
  );
}
