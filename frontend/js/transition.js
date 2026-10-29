document.addEventListener('DOMContentLoaded', () => {
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'page-transition-overlay';
  
  const container = document.createElement('div');
  container.className = 'transition-content';

  const img = document.createElement('img');
  
  // Determine relative path based on current URL
  let prefix = './';
  if (window.location.pathname.includes('/pages/')) {
    prefix = '../';
  }
  if (window.location.pathname.includes('/admin_related_pages/')) {
    prefix = '../../';
  }
  
  img.src = prefix + 'images/logo_bg_remove.png';
  
  const title = document.createElement('h2');
  title.className = 'transition-title';
  
  // On load, show the current page title
  let pageName = document.title.split('-')[0].trim();
  if (!pageName || pageName.includes('Crime Investigation')) {
    pageName = "Crime Investigation Website";
  }
  title.textContent = pageName;
  
  container.appendChild(img);
  container.appendChild(title);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  // On page load, slide the overlay UP to reveal the page
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add('slide-out-top');
    });
  });

  // Intercept all link clicks for the transition out
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      const target = link.getAttribute('target');
      
      // Filter out links that shouldn't trigger transition
      if (
        href && 
        !href.startsWith('#') && 
        !href.startsWith('tel:') && 
        !href.startsWith('mailto:') && 
        target !== '_blank' &&
        !e.ctrlKey && 
        !e.metaKey
      ) {
        e.preventDefault();
        
        // Update the text for the outgoing transition
        let linkText = link.textContent.trim();
        if (linkText && linkText.length < 30) {
          title.textContent = "Opening " + linkText + "...";
        } else {
          title.textContent = "Loading...";
        }
        
        // Reset overlay to bottom without animation
        overlay.classList.remove('slide-out-top');
        overlay.classList.add('prepare-enter-bottom');
        
        // Animate overlay to center
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            overlay.classList.remove('prepare-enter-bottom');
            overlay.classList.add('enter-center');
          });
        });
        
        // Navigate after animation completes
        setTimeout(() => {
          window.location.href = href;
        }, 1400); // Slower transition for better viewing
      }
    });
  });

  // Global Auth Check for Navbar
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      // Find the login button in the navbar
      const loginBtn = document.querySelector('.nav-btn-login');
      if (loginBtn) {
        const parentLi = loginBtn.parentElement;
        // Point to the correct dashboard based on role
        const dashboardLink = user.role === 'Admin' ? 'admin_dashboard.html' : 'dashboard.html';
        
        // Ensure path resolves correctly if we are in a nested folder
        let linkPrefix = '';
        if (!window.location.pathname.includes('/pages/')) {
          linkPrefix = 'pages/';
        } else if (window.location.pathname.includes('/admin_related_pages/')) {
          linkPrefix = '../';
        }

        // Replace the login button with a personalized dropdown/link
        let displayName = user.fullName;
        if (user.email === 'admin@ccms.com') {
          displayName = 'Super Administrator';
        }
        
        parentLi.innerHTML = `
          <div class="dropdown">
            <a class="nav-link dropdown-toggle btn btn-outline-light px-3 py-1.5 text-white d-flex align-items-center gap-2" href="#" id="globalUserDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false" style="color: var(--gold) !important; font-weight: 600;">
              <i class="bi bi-person-circle fs-5"></i> ${displayName}
            </a>
            <ul class="dropdown-menu dropdown-menu-end border-0 shadow mt-2" aria-labelledby="globalUserDropdown">
              <li><span class="dropdown-item-text small text-muted">Signed in as<br><strong>${user.email}</strong></span></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item py-2" href="${linkPrefix}${dashboardLink}"><i class="bi bi-speedometer2 me-2 text-muted"></i>Dashboard</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item py-2 text-danger" href="#" onclick="localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href='${window.location.pathname.includes('/pages/') ? '../' : './'}index.html';"><i class="bi bi-box-arrow-right me-2"></i>Sign Out</a></li>
            </ul>
          </div>
        `;
      }
      
      // Hide register button if logged in
      const registerBtn = document.querySelector('.nav-btn-register');
      if (registerBtn) {
        registerBtn.parentElement.style.display = 'none';
      }
    } catch(e) {
      console.error('Error parsing user data', e);
    }
  } else {
    // Hide protected links from navbar if not logged in
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.endsWith('complaint.html') || href.endsWith('track.html'))) {
        link.parentElement.style.display = 'none';
      }
    });

    // PROTECT ROUTES: Redirect to login if unauthenticated user tries to access protected pages
    const currentPath = window.location.pathname.toLowerCase();
    const protectedPages = ['/complaint.html', '/track.html', '/dashboard.html', '/complaint_details.html'];
    const isProtected = protectedPages.some(page => currentPath.endsWith(page));
    
    if (isProtected) {
      alert('You must be securely logged in to access this page.');
      // Resolve path to login.html
      let loginPath = 'login.html';
      if (!currentPath.includes('/pages/')) {
        loginPath = 'pages/login.html';
      } else if (currentPath.includes('/admin_related_pages/')) {
        loginPath = '../pages/login.html';
      }
      window.location.href = loginPath;
    }
  }

  // --- Admin Role Dynamic Display ---
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === 'Admin') {
        const isSuper = user.email === 'admin@ccms.com';
        const displayRole = isSuper ? 'Super Administrator' : 'System Administrator';

        // Update Sidebar Role Text
        const sidebarRoleEl = document.querySelector('.admin-sidebar-header .text-white-50');
        if (sidebarRoleEl) {
          sidebarRoleEl.textContent = displayRole;
        }

        // Update Dashboard Welcome Text
        const welcomeTextEls = document.querySelectorAll('.admin-content .text-muted.mb-0.small');
        welcomeTextEls.forEach(el => {
          if (el.textContent.includes('Welcome back')) {
            el.innerHTML = `Welcome back, <strong>${displayRole}</strong>. System operations status report and active complaints.`;
          }
        });
      }
    }
  } catch (e) {
    console.error('Error applying admin role display:', e);
  }
});
