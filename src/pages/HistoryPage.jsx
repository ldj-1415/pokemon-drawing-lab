import { useState } from 'react';
import { useLab } from '../context/LabContext.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { SavedCompositionCard } from '../components/SavedCompositionCard.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { Icon } from '../components/Icon.jsx';

export function HistoryPage() {
  const {
    history,
    loadHistory,
    addHistoryToFavorites,
    deleteHistory,
    clearHistory,
    navigate,
  } = useLab();
  const [clearOpen, setClearOpen] = useState(false);

  return (
    <div className="page page-history">
      <PageHeader
        eyebrow="DRAWING HISTORY"
        title="抽取历史"
        description="每次成功随机都会自动记录。可以重新载入任意一轮，或把历史组合加入收藏。最多保留最近 80 条。"
        actions={history.length ? (
          <button type="button" className="button button-ghost button-danger-text" onClick={() => setClearOpen(true)}>
            <Icon name="trash" size={16} />
            清空历史
          </button>
        ) : null}
      />

      <div className="collection-stats">
        <div className="collection-stat">
          <span className="collection-stat-icon"><Icon name="history" size={20} /></span>
          <div><strong>{history.length}</strong><span>条本地记录</span></div>
        </div>
        <div className="collection-stat">
          <span className="collection-stat-icon"><Icon name="clock" size={20} /></span>
          <div><strong>自动</strong><span>每次成功随机后写入</span></div>
        </div>
        <div className="collection-stat collection-stat-wide">
          <span className="collection-stat-icon"><Icon name="refresh" size={20} /></span>
          <div><strong>可重新载入</strong><span>恢复宝可梦与全部场景条件</span></div>
        </div>
      </div>

      {history.length ? (
        <div className="saved-grid">
          {history.map((entry) => (
            <SavedCompositionCard
              key={entry.id}
              entry={entry}
              variant="history"
              onLoad={loadHistory}
              onDelete={deleteHistory}
              onFavorite={addHistoryToFavorites}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="history"
          title="还没有抽取记录"
          description="在随机工作台完成一次随机后，完整组合会自动出现在这里。你可以随时载入它继续调整，或加入收藏。"
          action={(
            <button type="button" className="button button-primary" onClick={() => navigate('workbench')}>
              <Icon name="sparkles" size={17} />
              去工作台抽取
            </button>
          )}
        />
      )}

      <ConfirmDialog
        open={clearOpen}
        title="清空全部抽取历史？"
        description={`将删除 ${history.length} 条历史记录。收藏和当前工作台不会受到影响。`}
        confirmLabel="清空历史"
        cancelLabel="保留记录"
        tone="danger"
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          clearHistory();
          setClearOpen(false);
        }}
      />
    </div>
  );
}
