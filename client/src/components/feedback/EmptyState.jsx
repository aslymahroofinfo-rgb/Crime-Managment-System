export default function EmptyState({
  icon = 'bi-inbox',
  title = 'No Records Found',
  description = 'There are currently no items available to display.',
  action = null
}) {
  return (
    <div className="text-center py-5 px-3">
      <i className={`bi ${icon} text-muted`} style={{ fontSize: '3.5rem' }}></i>
      <h5 className="fw-bold text-dark mt-3 mb-1">{title}</h5>
      <p className="text-muted small mb-3 mx-auto" style={{ maxWidth: '450px' }}>{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

