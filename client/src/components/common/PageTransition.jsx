import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_TITLES = {
  '/': 'Crime Investigation Website',
  '/about': 'About Us',
  '/contact': 'Contact Support & Helpline',
  '/login': 'Account Login',
  '/register': 'Citizen Registration',
  '/complaint': 'File a Crime Complaint',
  '/track': 'Track Complaint Status',
  '/dashboard': 'Citizen Dashboard',
  '/profile': 'Citizen Profile',
  '/admin': 'Admin Dashboard',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/complaints': 'Complaints Management',
  '/admin/emergencies': 'Emergency Reports',
  '/admin/users': 'Citizens Directory',
  '/admin/contacts': 'Public Contact Inquiries',
  '/admin/inquiries': 'Public Contact Inquiries',
  '/admin/reports': 'Investigation Reports',
  '/admin/settings': 'System Settings'
};

export default function PageTransition() {
  const location = useLocation();
  const [animationClass, setAnimationClass] = useState('slide-out-top');
  const [pageTitle, setPageTitle] = useState('Crime Investigation Website');
  const isFirstRender = useRef(true);

  useEffect(() => {
    const rawTitle = ROUTE_TITLES[location.pathname] || 'Crime Investigation Website';
    setPageTitle(rawTitle);

    if (isFirstRender.current) {
      isFirstRender.current = false;
      const initialTimer = setTimeout(() => {
        setAnimationClass('slide-out-top');
      }, 50);
      return () => clearTimeout(initialTimer);
    }

    // Step 1: Prepare at bottom without animation
    setAnimationClass('prepare-enter-bottom');

    // Step 2: Slide up to center
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setAnimationClass('enter-center');
      });
      return () => cancelAnimationFrame(raf2);
    });

    // Step 3: Slide out towards top
    const outTimer = setTimeout(() => {
      setAnimationClass('slide-out-top');
    }, 450);

    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(outTimer);
    };
  }, [location.pathname]);

  return (
    <div className={`page-transition-overlay ${animationClass}`} aria-hidden="true">
      <div className="transition-content">
        <img src="/images/logo_bg_remove.png" alt="CIW Logo" />
        <h2 className="transition-title">{pageTitle}</h2>
      </div>
    </div>
  );
}

