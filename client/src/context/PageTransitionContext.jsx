import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
  '/admin/settings': 'System Settings',
  '/admin/audit': 'System Audit Logs'
};

function getTitleForPath(path) {
  if (!path) return 'Crime Investigation Website';
  const cleanPath = path.split('?')[0].split('#')[0];
  if (ROUTE_TITLES[cleanPath]) return ROUTE_TITLES[cleanPath];
  if (cleanPath.startsWith('/complaints/')) return 'Incident Case Record';
  return 'Crime Investigation Website';
}

const PageTransitionContext = createContext(null);

export function usePageTransition() {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within a PageTransitionProvider');
  }
  return context;
}

export function PageTransitionProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [transitionClass, setTransitionClass] = useState('is-idle');
  const [pageTitle, setPageTitle] = useState(() => getTitleForPath(location.pathname));
  const [isTransitioning, setIsTransitioning] = useState(false);

  const isTransitioningRef = useRef(false);
  const activeTimersRef = useRef([]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      activeTimersRef.current.forEach(timer => clearTimeout(timer));
      activeTimersRef.current = [];
    };
  }, []);

  /**
   * Coordinated navigation function:
   * 1. Start cover animation immediately
   * 2. Wait until viewport is 100% covered (~360ms)
   * 3. Perform navigate(targetPath) behind the overlay
   * 4. Trigger reveal animation (~360ms)
   * 5. Return to idle state
   */
  const navigateWithTransition = useCallback((targetPath, options = {}) => {
    // Prevent double-click or overlapping navigation triggers
    if (isTransitioningRef.current) return;

    // Check if target is identical to current full URL
    const currentFull = location.pathname + location.search + location.hash;
    if (targetPath === currentFull) return;

    isTransitioningRef.current = true;
    setIsTransitioning(true);

    const nextTitle = getTitleForPath(targetPath);
    setPageTitle(nextTitle);

    // Step 1: Position overlay at bottom (instant, no transition)
    setTransitionClass('is-ready-bottom');

    // Step 2: In next animation frames, start covering viewport
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionClass('is-covering');

        const coverTimer = setTimeout(() => {
          setTransitionClass('is-covered');

          // Step 3: Perform route change while completely covered
          navigate(targetPath, options);

          // Step 4: Next frame, start reveal animation (slide out to top)
          requestAnimationFrame(() => {
            setTransitionClass('is-revealing');

            const revealTimer = setTimeout(() => {
              // Step 5: Reset to idle
              setTransitionClass('is-idle');
              isTransitioningRef.current = false;
              setIsTransitioning(false);
            }, 360);

            activeTimersRef.current.push(revealTimer);
          });
        }, 360);

        activeTimersRef.current.push(coverTimer);
      });
    });
  }, [location.pathname, location.search, location.hash, navigate]);

  /**
   * Global click interception for <Link>, <NavLink>, and <a href="...">
   * Catches user clicks in capture phase before React Router executes instant navigation.
   */
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Find closest anchor
      const anchor = e.target.closest('a');
      if (!anchor) return;

      // Ignore modified clicks (Ctrl+click, Cmd+click, Shift+click, middle click)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      // Ignore links with explicit external target, download attribute, or non-HTTP protocols
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
      if (href.startsWith('#')) return;

      try {
        const url = new URL(href, window.location.origin);
        // Only intercept same-origin internal links
        if (url.origin !== window.location.origin) return;

        const targetPath = url.pathname + url.search + url.hash;
        const currentPath = window.location.pathname + window.location.search + window.location.hash;

        // If clicking link to current exact URL, prevent reload
        if (targetPath === currentPath) {
          e.preventDefault();
          return;
        }

        // Intercept internal route navigation!
        e.preventDefault();
        e.stopPropagation();

        navigateWithTransition(targetPath);
      } catch {
        // Fall back to native behavior on malformed URLs
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [navigateWithTransition]);

  return (
    <PageTransitionContext.Provider
      value={{
        transitionClass,
        pageTitle,
        isTransitioning,
        navigateWithTransition
      }}
    >
      {children}
    </PageTransitionContext.Provider>
  );
}

