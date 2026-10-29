export default function ToastAlert({
  type = 'info',
  message,
  icon = null,
  onClose = null,
  className = ''
}) {
  if (!message) return null;

  const defaultIcons = {
    success: 'bi-check-circle-fill',
    danger: 'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill'
  };

  const selectedIcon = icon || defaultIcons[type] || 'bi-info-circle';

  return (
    <div className={`alert alert-${type} d-flex align-items-center justify-content-between shadow-sm rounded-3 ${className}`} role="alert">
      <div className="d-flex align-items-center">
        <i className={`bi ${selectedIcon} me-2 fs-5 flex-shrink-0`}></i>
        <div>{message}</div>
      </div>
      {onClose && (
        <button
          type="button"
          className="btn-close ms-3"
          aria-label="Close"
          onClick={onClose}
        ></button>
      )}
    </div>
  );
}

