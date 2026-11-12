import { Icon } from './Icon.jsx';
import { useLab } from '../context/LabContext.jsx';

const toastIcons = {
  success: 'check',
  error: 'alert',
  warning: 'alert',
  info: 'info',
};

export function ToastStack() {
  const { toasts, dismissToast } = useLab();
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span className="toast-icon"><Icon name={toastIcons[toast.type] || 'info'} size={18} /></span>
          <p>{toast.message}</p>
          <button
            type="button"
            className="toast-close"
            onClick={() => dismissToast(toast.id)}
            aria-label="关闭提示"
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
