import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

export default function AdminUsers() {
  const { isSuperAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isViewingAdmins, setIsViewingAdmins] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alertFeedback, setAlertFeedback] = useState(null);

  // Modals State
  const [viewUser, setViewUser] = useState(null);
  const [deleteUserObj, setDeleteUserObj] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // Promote Citizen to Admin
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

  // Suspend/Delete User
  const handleConfirmDelete = async () => {
    if (!deleteUserObj) return;
    setDeleteLoading(true);

    try {
      const res = await adminService.deleteUser(deleteUserObj.dbId || deleteUserObj.id);
      if (res.ok) {
        setAlertFeedback({
          type: 'success',
          message: `User account ${deleteUserObj.name} has been suspended/deleted.`
        });
        setDeleteUserObj(null);
        await fetchUsers(isViewingAdmins);
        await fetchTotalCount();
      } else {
        setAlertFeedback({ type: 'danger', message: res.data?.message || 'Failed to remove user.' });
      }
    } catch (err) {
      console.error('Delete user error:', err);
      setAlertFeedback({ type: 'danger', message: 'Error removing user account.' });
    } finally {
      setDeleteLoading(false);
    }
  };

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
            Review verified accounts, contact registries, and check active file submissions.
          </p>
        </div>
        <div className="bg-white rounded-3 px-3 py-2 shadow-sm border d-none d-sm-block">
          <span className="text-muted small">
            <i className="bi bi-people-fill me-1 text-primary"></i>Total Accounts:
          </span>
          <strong className="text-dark small ms-1">{totalCount}</strong>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="card-header bg-white py-3 border-0 d-flex flex-wrap align-items-center justify-content-between px-4 border-bottom gap-2">
          <h5 className="fw-bold text-dark mb-0">
            <i className="bi bi-people-fill text-primary me-2"></i>
            Active {isViewingAdmins ? 'Administrators' : 'Citizens'}
          </h5>

          <div className="d-flex align-items-center gap-3">
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
              {users.length} {isViewingAdmins ? 'Admins' : 'Citizens'}
            </span>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted small mt-2">Loading user directory...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people text-muted" style={{ fontSize: '3.5rem' }}></i>
              <h5 className="fw-bold text-dark mt-3 mb-1">No Accounts Found</h5>
              <p className="text-muted small">No verified user records exist under this role classification.</p>
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
                    <th>National ID</th>
                    <th>Submitted Files</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.dbId || u.id}>
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
                      <td className="font-monospace">{u.nid || '-'}</td>
                      <td>
                        <span className="badge bg-primary px-2.5 py-1.5">
                          {u.cases || 0} Cases
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <div className="btn-group gap-1">
                          {/* SuperAdmin Promotion Action */}
                          {isSuperAdmin && !isViewingAdmins && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success rounded-2"
                              onClick={() => setPromoteUserObj(u)}
                              title="Promote to Admin"
                            >
                              <i className="bi bi-shield-check"></i>
                              <span className="d-none d-md-inline ms-1">Promote</span>
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

                          {/* Suspend/Delete Action */}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-2"
                            onClick={() => setDeleteUserObj(u)}
                            title="Suspend Account"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                  to an Administrator? They will obtain full administrative authority over cases and logs.
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
           DELETE / SUSPEND MODAL
           ============================================================ */}
      {deleteUserObj && (
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
                <div className="text-danger mb-3" style={{ fontSize: '3.5rem' }}>
                  <i className="bi bi-exclamation-triangle"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Suspend User Account?</h5>
                <p className="text-muted small mb-4">
                  Are you sure you want to suspend account <strong>{deleteUserObj.name}</strong> ({deleteUserObj.id})?
                  This will remove access to citizen portal records.
                </p>

                <div className="d-flex justify-content-center gap-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-2"
                    onClick={() => setDeleteUserObj(null)}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-4 py-2 shadow-sm"
                    onClick={handleConfirmDelete}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Suspending...
                      </>
                    ) : (
                      'Suspend Account'
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
