import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

function isTokenExpired(jwtToken) {
  if (!jwtToken || typeof jwtToken !== 'string') return true;
  try {
    const parts = jwtToken.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('token');
    if (stored && !isTokenExpired(stored)) {
      return stored;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  });

  const [user, setUser] = useState(() => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken || isTokenExpired(storedToken)) return null;
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Restore session & setup expiry listener
  useEffect(() => {
    const handleSessionExpired = () => {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    };

    window.addEventListener('auth:session_expired', handleSessionExpired);
    setIsLoading(false);

    return () => {
      window.removeEventListener('auth:session_expired', handleSessionExpired);
    };
  }, []);

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  };

  const role = user?.role || null;
  const roleLower = String(user?.role || '').toLowerCase();
  const isAuthenticated = Boolean(token && user && !isTokenExpired(token));
  const isAdmin = user ? (roleLower === 'admin' || roleLower === 'superadmin') : false;
  const isSuperAdmin = user ? (roleLower === 'superadmin') : false;

  const value = {
    token,
    user,
    role,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isLoading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
