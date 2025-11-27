import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import authService, { UserData, UserRole } from "../services/auth.service";

interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userData = authService.getUser();
          if (userData) {
            setUser(userData);
          } else {
            // Try to fetch user data if token exists but user data is missing
            await refreshUser();
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await authService.login({ email, password });
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && authService.isAuthenticated(),
    isAdmin: user?.role === UserRole.ADMIN,
    loading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
