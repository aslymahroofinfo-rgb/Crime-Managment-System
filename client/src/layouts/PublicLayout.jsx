import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/common/PublicNavbar';
import PublicFooter from '../components/common/PublicFooter';

export default function PublicLayout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <PublicNavbar />
      <div className="flex-grow-1">
        <Outlet />
      </div>
      <PublicFooter />
    </div>
  );
}

