import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/common/AdminSidebar';
import PageTransition from '../components/common/PageTransition';

export default function AdminLayout() {
  return (
    <div className="admin-container">
      <PageTransition />
      <AdminSidebar />
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

