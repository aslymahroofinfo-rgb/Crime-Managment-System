import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';

const PERMISSION_CONFIG = [
  { key: 'manageComplaints', label: 'Manage Complaints', desc: 'View, update status, and manage filed crime complaints' },
  { key: 'manageEmergencies', label: 'Emergency Response', desc: 'Triage, prioritize, and manage emergency incident filings' },
  { key: 'manageUsers', label: 'Citizen Directory', desc: 'Browse citizen accounts, review submissions, and manage citizen access' },
  { key: 'manageInquiries', label: 'Manage Inquiries', desc: 'Review, reply to, and resolve public contact inquiries' },
  { key: 'viewReports', label: 'Analytics & Reports', desc: 'Access crime trend reports, charts, and intelligence analytics' },
  { key: 'manageSettings', label: 'System Settings', desc: 'Modify portal preferences, category lists, and operational options' },
  { key: 'viewAuditLogs', label: 'Security Audit Trail', desc: 'View immutable system security audit logs and administrative activity' },
  { key: 'viewSecurityMetadata', label: 'Technical Security Metadata', desc: 'Inspect unmasked IP addresses, network headers, and forensic logs' },
  { key: 'manageAdministrators', label: 'Administrator Management', desc: 'Provision admin accounts and manage staff permission profiles' }
];

const DEFAULT_ADMIN_PERMS = {
  manageComplaints: true,
  manageEmergencies: true,
  manageUsers: true,
  manageInquiries: true,
  viewReports: true,
  manageSettings: true,
  viewAuditLogs: false,
  viewSecurityMetadata: false,
  manageAdministrators: false
};

const FULL_SUPERADMIN_PERMS = {
  manageComplaints: true,
  manageEmergencies: true,
  manageUsers: true,
  manageInquiries: true,
  viewReports: true,
  manageSettings: true,
  viewAuditLogs: true,
  viewSecurityMetadata: true,
  manageAdministrators: true
};

export default function AdminAdministrators() {
  const { user: currentUser, isSuperAdmin } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertFeedback, setAlertFeedback] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Admin',
    phoneNumber: '',
    permissions: { ...DEFAULT_ADMIN_PERMS }
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Privilege Editor Modal
  const [privilegeUser, setPrivilegeUser] = useState(null);
  const [privilegeForm, setPrivilegeForm] = useState({});
  const [privilegeLoading, setPrivilegeLoading] = useState(false);

  // Promote / Demote Modal
  const [roleChangeModal, setRoleChangeModal] = useState(null); // { user, targetRole, actionType: 'promote' | 'demote' }
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);

  // Deactivate / Reactivate Modal
  const [toggleStatusUser, setToggleStatusUser] = useState(null);
  const [toggleStatusLoading, setToggleStatusLoading] = useState(false);

  // Permanent Delete Modal
  const [deleteUserObj, setDeleteUserObj] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      loadAdmins();
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllAdmins();
      if (res.ok && Array.isArray(res.data)) {
        setAdmins(res.data);
      } else {
        setAdmins([]);
        if (res.status === 403) {
          setAlertFeedback({ type: 'danger', message: 'Forbidden: SuperAdmin privileges required to view administrators.' });
        }
      }
    } catch (err) {
      console.error('Failed to load administrators:', err);
      setAlertFeedback({ type: 'danger', message: 'Error communicating with server to fetch administrators.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="card border-0 shadow-sm rounded-4 bg-white p-5 text-center my-4">
        <div className="text-danger mb-3">
          <i className="bi bi-shield-slash-fill fs-1"></i>
        </div>
        <h4 className="fw-bold text-dark mb-2">SuperAdmin Privileges Required</h4>
        <p className="text-muted small col-md-6 mx-auto mb-0">
          Access to administrative staff provisioning and permission matrix is strictly restricted to designated SuperAdmin supervisors.
        </p>
      </div>
    );
  }

  // Derived Counts
  const totalAdmins = admins.length;
  const activeAdmins = admins.filter(a => a.isActive !== false).length;
  const superAdminCount = admins.filter(a => a.role === 'SuperAdmin' && a.isActive !== false).length;
  const inactiveCount = admins.filter(a => a.isActive === false).length;

  // Filtered List
  const filteredAdmins = admins.filter(a => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.id && a.id.toLowerCase().includes(q));

    const matchesRole = roleFilter === 'ALL' || a.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && a.isActive !== false) ||
      (statusFilter === 'INACTIVE' && a.isActive === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // ============================================================
  // HANDLERS
  // ============================================================

  // 1. Create Admin
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setAlertFeedback({ type: 'danger', message: 'Full name, email, and temporary password are required.' });
      return;
    }

    setCreateLoading(true);
    try {
      const res = await adminService.createAdmin({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
        phoneNumber: createForm.phoneNumber.trim(),
        permissions: createForm.role === 'SuperAdmin' ? FULL_SUPERADMIN_PERMS : createForm.permissions
      });

      if (res.ok) {
        setAlertFeedback({
          type: 'success',
          message: `${createForm.role} account created successfully. The user must change password upon first login.`
        });
        setShowCreateModal(false);
        setCreateForm({
          fullName: '',
          email: '',
          password: '',
          role: 'Admin',
          phoneNumber: '',
          permissions: { ...DEFAULT_ADMIN_PERMS }
        });
        await loadAdmins();
      } else {
        setAlertFeedback({ type: 'danger', message: res.data?.message || 'Failed to create administrator account.' });
      }
    } catch (err) {
      console.error('Create admin error:', err);
      setAlertFeedback({ type: 'danger', message: 'Network error creating administrator.' });
    } finally {
      setCreateLoading(false);
    }
  };

  // 2. Open Privilege Modal
  const openPrivilegeModal = (admin) => {
    setPrivilegeUser(admin);
    const existing = admin.permissions || (admin.role === 'SuperAdmin' ? FULL_SUPERADMIN_PERMS : DEFAULT_ADMIN_PERMS);
    setPrivilegeForm({ ...existing });
  };

  // Save Privileges
  const handleSavePrivileges = async () => {
    if (!privilegeUser) return;
    setPrivilegeLoading(true);

    try {
      const targetId = privilegeUser.dbId || privilegeUser.id;
      const res = await adminService.updateAdminPermissions(targetId, privilegeForm);
      if (res.ok) {
        setAlertFeedback({
          type: 'success',
          message: `Privileges for ${privilegeUser.name} updated successfully.`
        });
        setPrivilegeUser(null);
        await loadAdmins();
      } else {
        setAlertFeedback({ type: 'danger', message: res.data?.message || 'Failed to update privileges.' });
      }
    } catch (err) {
      console.error('Update privileges error:', err);
      setAlertFeedback({ type: 'danger', message: 'Network error updating administrator privileges.' });
    } finally {
      setPrivilegeLoading(false);
    }
  };

  // 3. Promote / Demote
  const handleExecuteRoleChange = async () => {
    if (!roleChangeModal) return;
    const { user, targetRole, actionType } = roleChangeModal;
    setRoleChangeLoading(true);

    try {
      const targetId = user.dbId || user.id;
      const res = actionType === 'promote'
        ? await adminService.promoteUser(targetId, targetRole)
        : await adminService.demoteUser(targetId, targetRole);

      if (res.ok) {
        setAlertFeedback({
          type: 'success',
          message: `Account ${user.name} successfully updated to role ${targetRole}.`
        });
        setRoleChangeModal(null);
        await loadAdmins();
      } else {
        setAlertFeedback({ type: 'danger', message: res.data?.message || `Failed to ${actionType} user.` });
      }
    } catch (err) {
      console.error('Role change error:', err);
      setAlertFeedback({ type: 'danger', message: `Network error executing ${actionType}.` });
    } finally {
      setRoleChangeLoading(false);
    }
  };

  // 4. Toggle Deactivate / Reactivate
  const handleToggleStatus = async () => {
    if (!toggleStatusUser) return;
    setToggleStatusLoading(true);

    try {
      const targetId = toggleStatusUser.dbId || toggleStatusUser.id;
      const isCurrentlyActive = toggleStatusUser.isActive !== false;
      const res = isCurrentlyActive
        ? await adminService.deactivateUser(targetId)
        : await adminService.reactivateUser(targetId);

      if (res.ok) {
        setAlertFeedback({
          type: 'success',
          message: `Administrator account ${toggleStatusUser.name} has been ${isCurrentlyActive ? 'deactivated' : 'reactivated'}.`
        });
        setToggleStatusUser(null);
        await loadAdmins();
      } else {
        setAlertFeedback({ type: 'danger', message: res.data?.message || 'Failed to update account status.' });
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      setAlertFeedback({ type: 'danger', message: 'Network error updating account status.' });
    } finally {
      setToggleStatusLoading(false);
    }
  };

  // 5. Permanent Cascade Delete
  const handlePermanentDelete = async () => {
    if (!deleteUserObj || deleteConfirmText.trim() !== 'DELETE') return;
    setDeleteLoading(true);

    try {
      const targetId = deleteUserObj.dbId || deleteUserObj.id;
      const res = await adminService.permanentDeleteUser(targetId);
      if (res.ok) {
        setAlertFeedback({
          type: 'success',
          message: `Administrator account ${deleteUserObj.name} and all associated records permanently removed.`
        });
        setDeleteUserObj(null);
        setDeleteConfirmText('');
        await loadAdmins();
      } else {
        setAlertFeedback({ type: 'danger', message: res.data?.message || 'Failed to delete administrator account.' });
      }
    } catch (err) {
      console.error('Delete error:', err);
      setAlertFeedback({ type: 'danger', message: 'Network error during permanent deletion.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Helper: check if target is the logged-in SuperAdmin
  const isSelf = (target) => {
    if (!currentUser) return false;
    const currentId = String(currentUser.id || currentUser._id);
    const targetId = String(target.dbId || target.id);
    const currentEmail = String(currentUser.email || '').toLowerCase();
    const targetEmail = String(target.email || '').toLowerCase();
    return currentId === targetId || currentEmail === targetEmail;
  };

  // Helper: check if target is last active SuperAdmin
  const isLastSuperAdmin = (target) => {
    return target.role === 'SuperAdmin' && target.isActive !== false && superAdminCount <= 1;
  };

  // Helper: count enabled permissions
  const countPerms = (perms) => {
    if (!perms || typeof perms !== 'object') return 0;
    return Object.values(perms).filter(Boolean).length;
  };

  return (
    <div className="container-fluid px-0">
      {/* Alert Feedback */}
      {alertFeedback && (
        <div className={`alert alert-${alertFeedback.type} alert-dismissible fade show border-0 shadow-sm rounded-3 mb-4`} role="alert">
          <i className={`bi bi-${alertFeedback.type === 'success' ? 'check-circle' : 'exclamation-octagon'}-fill me-2`}></i>
          {alertFeedback.message}
          <button type="button" className="btn-close" onClick={() => setAlertFeedback(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Header Block */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-purple bg-opacity-10 text-dark border border-purple border-opacity-25 px-2.5 py-1.5" style={{ background: '#f3e8ff' }}>
              <i className="bi bi-shield-lock-fill text-purple me-1" style={{ color: '#7e22ce' }}></i>
              SuperAdmin Control Center
            </span>
          </div>
          <h2 className="fw-bold text-dark mb-1">Administrator & Privilege Management</h2>
          <p className="text-muted mb-0 small">
            Supervise administrative staff, grant or revoke granular security permissions, and provision administrative credentials.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm px-3.5 py-2"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-person-plus-fill"></i>
            <span>Create Administrator</span>
          </button>
        </div>
      </div>

      {/* 4 Metrics Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block">Total Staff</span>
                <h3 className="fw-bold text-dark mb-0">{totalAdmins}</h3>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Provisioned Personnel</small>
              </div>
              <div className="rounded-3 p-3 bg-primary bg-opacity-10 text-primary">
                <i className="bi bi-people-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block">Active Administrators</span>
                <h3 className="fw-bold text-success mb-0">{activeAdmins}</h3>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Operational Status</small>
              </div>
              <div className="rounded-3 p-3 bg-success bg-opacity-10 text-success">
                <i className="bi bi-check-circle-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block">Super Administrators</span>
                <h3 className="fw-bold mb-0" style={{ color: '#7e22ce' }}>{superAdminCount}</h3>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Full System Access</small>
              </div>
              <div className="rounded-3 p-3" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                <i className="bi bi-shield-shaded fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block">Inactive / Suspended</span>
                <h3 className="fw-bold text-danger mb-0">{inactiveCount}</h3>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Access Disabled</small>
              </div>
              <div className="rounded-3 p-3 bg-danger bg-opacity-10 text-danger">
                <i className="bi bi-slash-circle-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Staff Directory Card */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
        <div className="card-header bg-white py-3 border-0 d-flex flex-wrap align-items-center justify-content-between px-4 border-bottom gap-2">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-person-gear text-primary fs-5"></i>
            <h5 className="fw-bold text-dark mb-0">Authorized Staff Directory</h5>
            <span className="badge bg-light text-muted border ms-2">
              {filteredAdmins.length} of {totalAdmins}
            </span>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Search */}
            <div className="input-group input-group-sm" style={{ width: '220px' }}>
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Role Filter */}
            <select
              className="form-select form-select-sm"
              style={{ width: '135px' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="SuperAdmin">SuperAdmin</option>
              <option value="Admin">Admin</option>
            </select>

            {/* Status Filter */}
            <select
              className="form-select form-select-sm"
              style={{ width: '125px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Deactivated</option>
            </select>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted small mt-2">Loading administrative staff directory...</p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people text-muted" style={{ fontSize: '3rem' }}></i>
              <h5 className="fw-bold text-dark mt-2 mb-1">No Administrators Found</h5>
              <p className="text-muted small">No staff accounts match your current filter parameters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted text-uppercase small">
                  <tr>
                    <th className="ps-4">Administrator</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Privileges</th>
                    <th>Provisioned</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.map((admin) => {
                    const isTargetSelf = isSelf(admin);
                    const isTargetLastSuper = isLastSuperAdmin(admin);
                    const isSuper = admin.role === 'SuperAdmin';
                    const isActive = admin.isActive !== false;
                    const permsCount = isSuper ? 9 : countPerms(admin.permissions);

                    return (
                      <tr key={admin.dbId || admin.id} className={!isActive ? 'table-light opacity-75' : ''}>
                        {/* Name & Email */}
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-2.5">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                              style={{
                                width: '38px',
                                height: '38px',
                                background: isSuper ? 'linear-gradient(135deg, #7e22ce, #4c1d95)' : 'linear-gradient(135deg, #1d4ed8, #1e40af)',
                                fontSize: '0.85rem'
                              }}
                            >
                              {(admin.name || 'A').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="d-flex align-items-center gap-1.5">
                                <span className="fw-semibold text-dark">{admin.name}</span>
                                {isTargetSelf && (
                                  <span className="badge bg-secondary bg-opacity-10 text-secondary border" style={{ fontSize: '0.65rem' }}>
                                    You
                                  </span>
                                )}
                              </div>
                              <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                                {admin.email}
                              </small>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td>
                          {isSuper ? (
                            <span className="badge rounded-pill border px-2.5 py-1.5" style={{ background: '#f3e8ff', color: '#7e22ce', borderColor: '#e9d5ff' }}>
                              <i className="bi bi-shield-fill-check me-1"></i>SuperAdmin
                            </span>
                          ) : (
                            <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1.5">
                              <i className="bi bi-person-badge me-1"></i>Admin
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td>
                          {isActive ? (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1">
                              <i className="bi bi-check-circle-fill me-1"></i>Active
                            </span>
                          ) : (
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1">
                              <i className="bi bi-slash-circle-fill me-1"></i>Deactivated
                            </span>
                          )}
                        </td>

                        {/* Privileges */}
                        <td>
                          {isSuper ? (
                            <span className="text-muted small d-inline-flex align-items-center gap-1">
                              <i className="bi bi-lock-fill" style={{ color: '#7e22ce' }}></i>
                              <span className="fw-medium">Full System Authority</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-light border py-1 px-2.5 d-inline-flex align-items-center gap-1 text-dark"
                              onClick={() => openPrivilegeModal(admin)}
                              title="Inspect & Adjust Privileges"
                            >
                              <i className="bi bi-sliders text-primary"></i>
                              <span className="small fw-semibold">{permsCount} of 9 Privileges</span>
                            </button>
                          )}
                        </td>

                        {/* Created Date */}
                        <td>
                          <span className="text-muted small">
                            {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="text-end pe-4">
                          <div className="btn-group gap-1">
                            {/* Privileges Modal trigger (regular admin only) */}
                            {!isSuper && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary rounded-2"
                                onClick={() => openPrivilegeModal(admin)}
                                title="Edit Security Privileges"
                              >
                                <i className="bi bi-sliders"></i>
                              </button>
                            )}

                            {/* Promote / Demote Button */}
                            {admin.role === 'Admin' ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary rounded-2"
                                onClick={() => setRoleChangeModal({ user: admin, targetRole: 'SuperAdmin', actionType: 'promote' })}
                                title="Promote to SuperAdmin"
                              >
                                <i className="bi bi-arrow-up-circle"></i>
                                <span className="d-none d-lg-inline ms-1">Promote</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-warning rounded-2"
                                disabled={isTargetSelf || isTargetLastSuper}
                                onClick={() => setRoleChangeModal({ user: admin, targetRole: 'Admin', actionType: 'demote' })}
                                title={isTargetSelf ? "Cannot demote your own account" : isTargetLastSuper ? "Cannot demote last active SuperAdmin" : "Demote to Admin"}
                              >
                                <i className="bi bi-arrow-down-circle"></i>
                                <span className="d-none d-lg-inline ms-1">Demote</span>
                              </button>
                            )}

                            {/* Deactivate / Reactivate */}
                            {isActive ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary rounded-2"
                                disabled={isTargetSelf || isTargetLastSuper}
                                onClick={() => setToggleStatusUser(admin)}
                                title={isTargetSelf ? "Cannot deactivate yourself" : isTargetLastSuper ? "Cannot deactivate last active SuperAdmin" : "Deactivate Account"}
                              >
                                <i className="bi bi-slash-circle"></i>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success rounded-2"
                                onClick={() => setToggleStatusUser(admin)}
                                title="Reactivate Account"
                              >
                                <i className="bi bi-check-circle"></i>
                              </button>
                            )}

                            {/* Delete Permanently */}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger rounded-2"
                              disabled={isTargetSelf || isTargetLastSuper}
                              onClick={() => {
                                setDeleteUserObj(admin);
                                setDeleteConfirmText('');
                              }}
                              title={isTargetSelf ? "Cannot delete yourself" : isTargetLastSuper ? "Cannot delete last active SuperAdmin" : "Permanently Delete"}
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
           MODAL 1: CREATE ADMINISTRATOR
           ============================================================ */}
      {showCreateModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} role="dialog" aria-modal="true">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header text-white border-0 py-3" style={{ background: 'var(--primary-dark)' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-plus-fill me-2"></i>Provision New Administrator
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                  aria-label="Close"
                ></button>
              </div>

              <form onSubmit={handleCreateAdmin}>
                <div className="modal-body p-4 bg-white">
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Officer Alex Perera"
                        required
                        value={createForm.fullName}
                        onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark">Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="officer@police.gov.lk"
                        required
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark">Temporary Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Initial access password"
                        required
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      />
                      <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                        User will be flagged with <code>mustChangePassword</code> upon first sign-in.
                      </small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 0771234567"
                        value={createForm.phoneNumber}
                        onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold text-dark">Role Classification *</label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="adminRoleRadio"
                          id="roleAdmin"
                          value="Admin"
                          checked={createForm.role === 'Admin'}
                          onChange={() => setCreateForm({ ...createForm, role: 'Admin' })}
                        />
                        <label className="form-check-label small fw-semibold" htmlFor="roleAdmin">
                          Admin <span className="text-muted fw-normal">(Standard administrative staff)</span>
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="adminRoleRadio"
                          id="roleSuperAdmin"
                          value="SuperAdmin"
                          checked={createForm.role === 'SuperAdmin'}
                          onChange={() => setCreateForm({ ...createForm, role: 'SuperAdmin' })}
                        />
                        <label className="form-check-label small fw-semibold" htmlFor="roleSuperAdmin">
                          SuperAdmin <span className="text-muted fw-normal">(Full unconstrained system authority)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Granular Permissions Section */}
                  <div className="border rounded-3 p-3 bg-light">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="fw-bold text-dark mb-0 small">
                        <i className="bi bi-shield-check text-primary me-1"></i>Granular Security Privileges
                      </h6>
                      {createForm.role === 'SuperAdmin' && (
                        <span className="badge bg-purple text-dark border small" style={{ background: '#f3e8ff' }}>
                          Inherently All Enabled
                        </span>
                      )}
                    </div>
                    <p className="text-muted small mb-3" style={{ fontSize: '0.78rem' }}>
                      Configure the specific functional permissions granted to this administrator profile.
                    </p>

                    <div className="row g-2">
                      {PERMISSION_CONFIG.map(({ key, label, desc }) => (
                        <div key={key} className="col-md-6">
                          <div className="form-check form-switch p-2 bg-white rounded-2 border">
                            <input
                              className="form-check-input ms-0 me-2"
                              type="checkbox"
                              role="switch"
                              id={`create_perm_${key}`}
                              disabled={createForm.role === 'SuperAdmin'}
                              checked={createForm.role === 'SuperAdmin' ? true : Boolean(createForm.permissions[key])}
                              onChange={(e) => {
                                setCreateForm({
                                  ...createForm,
                                  permissions: {
                                    ...createForm.permissions,
                                    [key]: e.target.checked
                                  }
                                });
                              }}
                            />
                            <label className="form-check-label small fw-semibold d-block text-dark" htmlFor={`create_perm_${key}`}>
                              {label}
                            </label>
                            <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>
                              {desc}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 bg-light p-3 rounded-bottom-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-2"
                    onClick={() => setShowCreateModal(false)}
                    disabled={createLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 py-2 shadow-sm"
                    disabled={createLoading}
                  >
                    {createLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Provisioning...
                      </>
                    ) : (
                      'Provision Administrator'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
           MODAL 2: PRIVILEGE EDITOR MODAL
           ============================================================ */}
      {privilegeUser && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} role="dialog" aria-modal="true">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header text-white border-0 py-3" style={{ background: 'var(--primary-dark)' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-sliders me-2"></i>Security Privilege Matrix
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setPrivilegeUser(null)}
                  disabled={privilegeLoading}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4 bg-white">
                <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-4 border">
                  <div className="rounded-circle bg-primary text-white p-2.5 px-3 fw-bold">
                    {(privilegeUser.name || 'A').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0">{privilegeUser.name}</h6>
                    <small className="text-muted">{privilegeUser.email}</small>
                    <div className="mt-1">
                      <span className="badge bg-primary bg-opacity-10 text-primary border" style={{ fontSize: '0.7rem' }}>
                        {privilegeUser.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="row g-2">
                  {PERMISSION_CONFIG.map(({ key, label, desc }) => (
                    <div key={key} className="col-md-6">
                      <div className="form-check form-switch p-2.5 bg-white rounded-2 border h-100">
                        <input
                          className="form-check-input ms-0 me-2"
                          type="checkbox"
                          role="switch"
                          id={`edit_perm_${key}`}
                          checked={Boolean(privilegeForm[key])}
                          onChange={(e) => {
                            setPrivilegeForm({
                              ...privilegeForm,
                              [key]: e.target.checked
                            });
                          }}
                        />
                        <label className="form-check-label small fw-semibold d-block text-dark" htmlFor={`edit_perm_${key}`}>
                          {label}
                        </label>
                        <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>
                          {desc}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer border-0 bg-light p-3 rounded-bottom-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4 py-2"
                  onClick={() => setPrivilegeUser(null)}
                  disabled={privilegeLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary px-4 py-2 shadow-sm"
                  onClick={handleSavePrivileges}
                  disabled={privilegeLoading}
                >
                  {privilegeLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Privileges'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
           MODAL 3: PROMOTE / DEMOTE MODAL
           ============================================================ */}
      {roleChangeModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className={`modal-header text-white border-0 py-3 ${roleChangeModal.actionType === 'promote' ? 'bg-primary' : 'bg-warning'}`}>
                <h5 className="modal-title fw-bold text-dark">
                  <i className={`bi bi-${roleChangeModal.actionType === 'promote' ? 'arrow-up-circle' : 'arrow-down-circle'} me-2`}></i>
                  {roleChangeModal.actionType === 'promote' ? 'Promote Staff Member' : 'Demote Staff Member'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setRoleChangeModal(null)}
                  disabled={roleChangeLoading}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4 text-center">
                <div className={`mb-3 fs-1 ${roleChangeModal.actionType === 'promote' ? 'text-primary' : 'text-warning'}`}>
                  <i className={`bi bi-${roleChangeModal.actionType === 'promote' ? 'shield-fill-check' : 'shield-exclamation'}`}></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">
                  Change role to <strong>{roleChangeModal.targetRole}</strong>?
                </h5>
                <p className="text-muted small mb-3">
                  Are you sure you want to change the role of <strong>{roleChangeModal.user.name}</strong> ({roleChangeModal.user.email}) from <strong>{roleChangeModal.user.role}</strong> to <strong>{roleChangeModal.targetRole}</strong>?
                </p>

                {roleChangeModal.targetRole === 'SuperAdmin' && (
                  <div className="alert alert-warning text-start small mb-3 p-2.5">
                    <i className="bi bi-info-circle-fill me-1"></i>
                    SuperAdmins possess full administrative powers, can manage other admins, and view unmasked security forensic data.
                  </div>
                )}

                <div className="d-flex justify-content-center gap-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-2"
                    onClick={() => setRoleChangeModal(null)}
                    disabled={roleChangeLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`btn px-4 py-2 shadow-sm ${roleChangeModal.actionType === 'promote' ? 'btn-primary' : 'btn-warning'}`}
                    onClick={handleExecuteRoleChange}
                    disabled={roleChangeLoading}
                  >
                    {roleChangeLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Executing...
                      </>
                    ) : (
                      `Confirm ${roleChangeModal.actionType === 'promote' ? 'Promotion' : 'Demotion'}`
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
           MODAL 4: DEACTIVATE / REACTIVATE MODAL
           ============================================================ */}
      {toggleStatusUser && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-body p-4 text-center">
                <div className={`mb-3 fs-1 ${toggleStatusUser.isActive !== false ? 'text-warning' : 'text-success'}`}>
                  <i className={`bi bi-${toggleStatusUser.isActive !== false ? 'slash-circle' : 'check-circle'}`}></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">
                  {toggleStatusUser.isActive !== false ? 'Deactivate Account?' : 'Reactivate Account?'}
                </h5>
                <p className="text-muted small mb-3">
                  {toggleStatusUser.isActive !== false ? (
                    <>
                      Deactivating <strong>{toggleStatusUser.name}</strong> will instantly prevent login access and revoke portal sessions. Their complaints, records, and evidence will remain intact and can be restored at any time.
                    </>
                  ) : (
                    <>
                      Reactivating <strong>{toggleStatusUser.name}</strong> will restore their administrative login and grant access to the portal again.
                    </>
                  )}
                </p>

                <div className="d-flex justify-content-center gap-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-2"
                    onClick={() => setToggleStatusUser(null)}
                    disabled={toggleStatusLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`btn px-4 py-2 shadow-sm ${toggleStatusUser.isActive !== false ? 'btn-warning' : 'btn-success'}`}
                    onClick={handleToggleStatus}
                    disabled={toggleStatusLoading}
                  >
                    {toggleStatusLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      toggleStatusUser.isActive !== false ? 'Deactivate Account' : 'Reactivate Account'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
           MODAL 5: PERMANENT CASCADE DELETE MODAL
           ============================================================ */}
      {deleteUserObj && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} role="dialog" aria-modal="true">
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
                    setDeleteUserObj(null);
                    setDeleteConfirmText('');
                  }}
                  disabled={deleteLoading}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="alert alert-danger border-0 small mb-3">
                  <strong className="d-block mb-1">DANGER: THIS ACTION CANNOT BE UNDONE</strong>
                  Permanently deleting <strong>{deleteUserObj.name}</strong> ({deleteUserObj.email}) will immediately execute:
                  <ul className="mb-0 mt-1 ps-3">
                    <li>Permanent deletion of the administrator user document</li>
                    <li>Cascade deletion of all complaints filed by this user</li>
                    <li>Safe physical deletion of all associated evidence files stored on disk</li>
                  </ul>
                </div>

                <p className="small text-muted mb-3">
                  To confirm this catastrophic deletion, please type <code className="fw-bold text-danger">DELETE</code> in the field below:
                </p>

                <input
                  type="text"
                  className="form-control text-center font-monospace fw-bold mb-3"
                  placeholder="Type DELETE to confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  disabled={deleteLoading}
                />

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-2"
                    onClick={() => {
                      setDeleteUserObj(null);
                      setDeleteConfirmText('');
                    }}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-4 py-2 shadow-sm"
                    onClick={handlePermanentDelete}
                    disabled={deleteLoading || deleteConfirmText.trim() !== 'DELETE'}
                  >
                    {deleteLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Deleting Permanently...
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
    </div>
  );
}

