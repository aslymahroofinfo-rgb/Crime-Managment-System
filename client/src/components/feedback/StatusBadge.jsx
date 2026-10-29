export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  switch (status) {
    case 'Pending':
      return (
        <span className={`badge bg-warning text-dark ${className}`}>
          <i className="bi bi-clock-history me-1"></i>Pending
        </span>
      );
    case 'Approved':
      return (
        <span className={`badge bg-primary ${className}`}>
          <i className="bi bi-check2-circle me-1"></i>Approved
        </span>
      );
    case 'Under Investigation':
      return (
        <span className={`badge bg-info text-dark ${className}`}>
          <i className="bi bi-search me-1"></i>Under Investigation
        </span>
      );
    case 'Resolved':
      return (
        <span className={`badge bg-success ${className}`}>
          <i className="bi bi-shield-check me-1"></i>Resolved
        </span>
      );
    case 'Rejected':
      return (
        <span className={`badge bg-danger ${className}`}>
          <i className="bi bi-x-circle me-1"></i>Rejected
        </span>
      );
    case 'New':
      return (
        <span className={`badge bg-warning text-dark ${className}`}>
          <i className="bi bi-bell-fill me-1"></i>New
        </span>
      );
    case 'Read':
      return (
        <span className={`badge bg-info text-dark ${className}`}>
          <i className="bi bi-envelope-open me-1"></i>Read
        </span>
      );
    default:
      return (
        <span className={`badge bg-secondary ${className}`}>
          {status}
        </span>
      );
  }
}

