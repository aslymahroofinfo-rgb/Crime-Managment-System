import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

export default function AdminUsers() {
  const { isSuperAdmin, user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isViewingAdmins, setIsViewingAdmins] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alertFeedback, setAlertFeedback] = useState(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [viewUser, setViewUser] = useState(null);

  // Soft Deactivate / Reactivate Modal
  const [statusToggleUser, setStatusToggleUser] = useState(null);
  const [statusToggleLoading, setStatusToggleLoading] = useState(false);

  // Permanent Cascade Delete Modal
  const [permanentDeleteObj, setPermanentDeleteObj] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [permanentDeleteLoading, setPermanentDeleteLoading] = useState(false);

  // Promote Modal
  const [promoteUserObj, setPromoteUserObj] = useState(null);
  const [promoteLoading, setPromoteLoading] = useState(false);

  useEffect(() => {
    fetchUsers(isViewingAdmins);
    fetchTotalCount();
  }, [isViewingAdmins]);

  const fetchTotalCount = async () => {
    try {
      const res = await adminService.getUserCount();
      if (res.ok && res.data?.total !== undefined) {
        setTotalCount(res.data.total);
      }
    } catch (e) {
      console.error('Failed to fetch user count', e);
    }
  };

  const fetchUsers = async (viewAdmins) => {
    setLoading(true);
    try {
      const res = viewAdmins
        ? await adminService.getAllAdmins()
        : await adminService.getAllUsers();

      if (res.ok && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setUsers([]);
        if (res.status === 403) {
          setAlertFeedback({ type: 'danger', message: 'Access denied: Requires SuperAdmin role to view administrators.' });
        }
      }
    } catch (err) {
      console.error('Failed to load users list:', err);
      setAlertFeedback({ type: 'danger', message: 'Server communication error loading directory.' });
    } finally {
      setLoading(false);
    }
  };

  // 1. Promote Citizen to Admin
  const handleConfirmPromote = async () => {
    if (!promoteUserObj) return;
    setPromoteLoading(true);

    try {
      const res = await adminService.promoteUserToAdmin(promoteUserObj.dbId || promoteUserObj.id);
      if (res.ok) {
        setAlertFeedback({
          type: 'success',
          message: `User ${promoteUserObj.name} has been promoted to Administrator successfully.`
        });
        setPromoteUserObj(null);
        await fetchUsers(isViewingAdmins);
      } else {
        setAlertFeedback({
          type: 'danger',
          message: res.data?.message || 'Promotion failed. Only citizens can be promoted.'
        });
      }
    } catch (err) {
      console.error('Promotion error:', err);
      setAlertFeedback({ type: 'danger', message: 'Error executing promotion.' });
    } finally {
      setPromoteLoading(false);
    }
  };

  // 2. Soft Deactivate / Reactivate
  const handleConfirmToggleStatus = async () => {
    if (!statusToggleUser) return;
    setStatusToggleLoading(true);

    const isCurrentlyActive = statusToggleUser.isActive !== false;
    const targetId = statusToggleUser.dbId || statusToggleUser.id;

    try {
      const res = isCurrentlyActive
        ? await adminService.deactivateUser(targetId)
        : await adminService.reactivateUser(targetId);

      if (res.ok) {
        setAlertFeedback({
          type: 'success',
          message: `User account ${statusToggleUser.name} has been ${isCurrentlyActive ? 'deactivated' : 'reactivated'} successfully.`
        });
        setStatusToggleUser(null);
        await fetchUsers(isViewingAdmins);
      } else {
        setAlertFeedback({
          type: 'danger',
          message: res.data?.message || 'Failed to update account active status.'
        });
      }
    } catch (err) {
      console.error('Status toggle error:', err);
      setAlertFeedback({ type: 'danger', message: 'Error communicating with server.' });
    } finally {
      setStatusToggleLoading(false);
    }
  };

  // 3. Permanent Cascade Delete
  const handleConfirmPermanentDelete = async () => {
    if (!permanentDeleteObj || deleteConfirmText.trim() !== 'DELETE') return;
    setPermanentDeleteLoading(true);

    const targetId = permanentDeleteObj.dbId || permanentDeleteObj.id;

    try {
      const res = await adminService.permanentDeleteUser(targetId);
      if (res.ok) {
        setAlertFeedback({
          type: 'success',
          message: `Account ${permanentDeleteObj.name} and all associated cases & evidence files were permanently deleted.`
        });
        setPermanentDeleteObj(null);
        setDeleteConfirmText('');
        await fetchUsers(isViewingAdmins);
        await fetchTotalCount();
      } else {
        setAlertFeedback({
          type: 'danger',
          message: res.data?.message || 'Failed to permanently delete user account.'
        });
      }
    } catch (err) {
      console.error('Permanent delete error:', err);
      setAlertFeedback({ type: 'danger', message: 'Error removing user account.' });
    } finally {
      setPermanentDeleteLoading(false);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.nid && u.nid.toLowerCase().includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q))
    );
  });

  return (
    <>
      {/* Alert Feedback */}
      {alertFeedback && (
        <div className={`alert alert-${alertFeedback.type} alert-dismissible fade show border-0 shadow-sm rounded-3 mb-4`} role="alert">
          <i className={`bi bi-${alertFeedback.type === 'success' ? 'check-circle' : 'exclamation-octagon'}-fill me-2`}></i>
          {alertFeedback.message}
          <button type="button" className="btn-close" onClick={() => setAlertFeedback(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Header Block */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom g-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Registered Citizens Directory</h2>
          <p className="text-muted mb-0 small">
            Review verified citizen accounts, check case filings, and manage account authorization status.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="bg-white rounded-3 px-3 py-2 shadow-sm border d-none d-sm-block">
            <span className="text-muted small">
              <i className="bi bi-people-fill me-1 text-primary"></i>Total Accounts:
            </span>
            <strong className="text-dark small ms-1">{totalCount}</strong>
          </div>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="card-header bg-white py-3 border-0 d-flex flex-wrap align-items-center justify-content-between px-4 border-bottom gap-2">
          <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-people-fill text-primary"></i>
            {isViewingAdmins ? 'Administrative Staff' : 'Active Citizen Records'}
          </h5>

          <div className="d-flex flex-wrap align-items-center gap-3">
            {/* Search */}
            <div className="input-group input-group-sm" style={{ width: '220px' }}>
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search citizens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* SuperAdmin View Switcher */}
            {isSuperAdmin && (
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${!isViewingAdmins ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setIsViewingAdmins(false)}
                >
                  Citizens
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${isViewingAdmins ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setIsViewingAdmins(true)}
                >
                  Administrators
                </button>
              </div>
            )}
            <span className="badge bg-light text-muted border py-2 px-3 small">
              {filteredUsers.length} {isViewingAdmins ? 'Admins' : 'Citizens'}
            </span>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted small mt-2">Loading user directory...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people text-muted" style={{ fontSize: '3.5rem' }}></i>
              <h5 className="fw-bold text-dark mt-3 mb-1">No Accounts Found</h5>
              <p className="text-muted small">No verified user records match your search parameters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted text-uppercase small">
                  <tr>
                    <th className="ps-4">Citizen ID</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Status</th>
                    <th>Filed Cases</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isActive = u.isActive !== false;
                    const isSelf = currentUser && (
                      String(currentUser.id || currentUser._id) === String(u.dbId || u.id) ||
                      String(currentUser.email).toLowerCase() === String(u.email).toLowerCase()
                    );

                    return (
                      <tr key={u.dbId || u.id} className={!isActive ? 'table-light opacity-75' : ''}>
                        <td className="ps-4 fw-bold text-dark font-monospace">{u.id}</td>
                        <td>
                          <span className="fw-semibold text-dark">{u.name}</span>
                          {u.role && u.role !== 'Citizen' && (
                            <span className="badge bg-primary bg-opacity-10 text-primary ms-2" style={{ fontSize: '0.7rem' }}>
                              {u.role}
                            </span>
                          )}
                        </td>
                        <td>{u.email}</td>
                        <td>{u.phone || '-'}</td>
                        <td>
                          {isActive ? (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                              <i className="bi bi-check-circle-fill me-1"></i>Active
                            </span>
                          ) : (
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">
                              <i className="bi bi-slash-circle-fill me-1"></i>Deactivated
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-primary px-2.5 py-1.5">
                            {u.cases || 0} Cases
                          </span>
                        </td>
                        <td className="text-end pe-4">
                          <div className="btn-group gap-1">
                            {/* SuperAdmin Promotion Action */}
                            {isSuperAdmin && !isViewingAdmins && u.role === 'Citizen' && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success rounded-2"
                                onClick={() => setPromoteUserObj(u)}
                                title="Promote to Admin"
                              >
                                <i className="bi bi-shield-check"></i>
                                <span className="d-none d-lg-inline ms-1">Promote</span>
                              </button>
                            )}

                            {/* View Profile Action */}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary rounded-2"
                              onClick={() => setViewUser(u)}
                              title="View Account Details"
                            >
                              <i className="bi bi-person-lines-fill"></i>
                              <span className="d-none d-md-inline ms-1">View</span>
                            </button>

                            {/* Deactivate / Reactivate Action */}
                            {isActive ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary rounded-2"
                                disabled={isSelf}
                                onClick={() => setStatusToggleUser(u)}
                                title={isSelf ? "Cannot deactivate yourself" : "Deactivate Account (Preserves records)"}
                              >
                                <i className="bi bi-slash-circle"></i>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success rounded-2"
                                onClick={() => setStatusToggleUser(u)}
                                title="Reactivate Account"
                              >
                                <i className="bi bi-check-circle"></i>
                              </button>
                            )}

                            {/* Permanent Cascade Delete Action */}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger rounded-2"
                              disabled={isSelf}
                              onClick={() => {
                                setPermanentDeleteObj(u);
                                setDeleteConfirmText('');
                              }}
                              title={isSelf ? "Cannot delete yourself" : "Permanently Delete Account & Cascade Complaints"}
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
           VIEW USER DETAILS MODAL
           ============================================================ */}
      {viewUser && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header text-white border-0 py-3" style={{ background: 'var(--primary-dark)' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-fill-gear me-2"></i>Citizen Account File
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setViewUser(null)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4 bg-white">
                <div className="text-center mb-4">
                  <i className="bi bi-person-circle text-primary" style={{ fontSize: '4rem' }}></i>
                  <h5 className="fw-bold text-dark mb-0 mt-2">{viewUser.name}</h5>
                  <span className="text-muted small font-monospace">{viewUser.id}</span>
                </div>

                <div className="row g-3 small text-dark">
                  <div className="col-6">
                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Email</span>
                    <strong>{viewUser.email}</strong>
                  </div>
                  <div className="col-6">
                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Phone</span>
                    <strong>{viewUser.phone || 'N/A'}</strong>
                  </div>
                  <div className="col-6">
                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>National ID</span>
                    <strong className="font-monospace">{viewUser.nid || 'N/A'}</strong>
                  </div>
                  <div className="col-6">
                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Account Status</span>
                    <strong>{viewUser.isActive !== false ? 'Active' : 'Deactivated'}</strong>
                  </div>
                  <div className="col-12">
                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Active Filed Cases</span>
                    <strong className="text-primary">{viewUser.cases || 0} Cases</strong>
                  </div>
                  <div className="col-12 pt-2 border-top">
                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Residential Address</span>
                    <p className="mb-0 text-dark">{viewUser.address || 'Address unrecorded'}</p>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 bg-light p-3 rounded-bottom-4">
                <button
                  type="button"
                  className="btn btn-secondary px-4 py-2"
                  onClick={() => setViewUser(null)}
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
           PROMOTE USER MODAL (SuperAdmin Only)
           ============================================================ */}
      {promoteUserObj && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header text-white border-0 py-3 bg-success">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-shield-check me-2"></i>Promote to Administrator
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setPromoteUserObj(null)}
                  disabled={promoteLoading}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4 text-center">
                <div className="text-success mb-3" style={{ fontSize: '3rem' }}>
                  <i className="bi bi-person-fill-up"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Grant Administrative Privileges?</h5>
                <p className="text-muted small mb-4">
                  Are you sure you want to promote citizen <strong>{promoteUserObj.name}</strong> ({promoteUserObj.email})
                  to an Administrator? They will obtain administrative authority to review and update cases.
                </p>

                <div className="d-flex justify-content-center gap-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-2"
                    onClick={() => setPromoteUserObj(null)}
                    disabled={promoteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-success px-4 py-2 shadow-sm"
                    onClick={handleConfirmPromote}
                    disabled={promoteLoading}
                  >
                    {promoteLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Promoting...
                      </>
                    ) : (
                      'Confirm Promotion'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
           DEACTIVATE / REACTIVATE MODAL
           ============================================================ */}
      {statusToggleUser && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-body p-4 text-center">
                <div className={`mb-3 fs-1 ${statusToggleUser.isActive !== false ? 'text-warning' : 'text-success'}`}>
                  <i className={`bi bi-${statusToggleUser.isActive !== false ? 'slash-circle' : 'check-circle'}`}></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">
                  {statusToggleUser.isActive !== false ? 'Deactivate Account?' : 'Reactivate Account?'}
                </h5>
                <p className="text-muted small mb-4">
                  {statusToggleUser.isActive !== false ? (
                    <>
                      Deactivating <strong>{statusToggleUser.name}</strong> will prevent them from signing in to the portal.
                      Their filed complaints, tracking status, and evidence files will remain preserved in the system.
                    </>
                  ) : (
                    <>
                      Reactivating <strong>{statusToggleUser.name}</strong> will restore full login access to their citizen portal account.
                    </>
                  )}
                </p>

                <div className="d-flex justify-content-center gap-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-2"
                    onClick={() => setStatusToggleUser(null)}
                    disabled={statusToggleLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`btn px-4 py-2 shadow-sm ${statusToggleUser.isActive !== false ? 'btn-warning' : 'btn-success'}`}
                    onClick={handleConfirmToggleStatus}
                    disabled={statusToggleLoading}
                  >
                    {statusToggleLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      statusToggleUser.isActive !== false ? 'Deactivate Account' : 'Reactivate Account'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
           PERMANENT CASCADE DELETE MODAL
           ============================================================ */}
      {permanentDeleteObj && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header bg-danger text-white border-0 py-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>Irreversible Permanent Cascade Deletion
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setPermanentDeleteObj(null);
                    setDeleteConfirmText('');
                  }}
                  disabled={permanentDeleteLoading}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="alert alert-danger border-0 small mb-3">
                  <strong className="d-block mb-1">DANGER: THIS CANNOT BE RECOVERED</strong>
                  Permanently deleting <strong>{permanentDeleteObj.name}</strong> ({permanentDeleteObj.email}) will immediately remove:
                  <ul className="mb-0 mt-1 ps-3">
                    <li>The citizen account and profile</li>
                    <li>ALL {permanentDeleteObj.cases || 0} associated complaints filed by this user</li>
                    <li>All physical evidence files stored on disk for those complaints</li>
                  </ul>
                </div>

                <p className="small text-muted mb-3">
                  To confirm permanent cascade deletion, type <code className="fw-bold text-danger">DELETE</code> in the field below:
                </p>

                <input
                  type="text"
                  className="form-control text-center font-monospace fw-bold mb-3"
                  placeholder="Type DELETE to confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  disabled={permanentDeleteLoading}
                />

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-2"
                    onClick={() => {
                      setPermanentDeleteObj(null);
                      setDeleteConfirmText('');
                    }}
                    disabled={permanentDeleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-4 py-2 shadow-sm"
                    onClick={handleConfirmPermanentDelete}
                    disabled={permanentDeleteLoading || deleteConfirmText.trim() !== 'DELETE'}
                  >
                    {permanentDeleteLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Permanently Deleting...
                      </>
                    ) : (
                      'Permanently Delete Account'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
