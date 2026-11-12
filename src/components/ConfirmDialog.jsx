import { Modal } from './Modal.jsx';
import { Icon } from './Icon.jsx';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  onConfirm,
  onCancel,
  tone = 'danger',
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      eyebrow="PLEASE CONFIRM"
      icon={tone === 'danger' ? 'alert' : 'info'}
      size="sm"
      footer={(
        <>
          <button type="button" className="button button-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button
            type="button"
            className={`button ${tone === 'danger' ? 'button-danger' : 'button-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      )}
    >
      <p className="confirm-text">{description}</p>
      {tone === 'danger' ? (
        <div className="inline-note inline-note-warning">
          <Icon name="info" size={16} />
          此操作只会影响浏览器中的本地数据。
        </div>
      ) : null}
    </Modal>
  );
}
