
import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import api from "../services/api.js";

const AuthContext = createContext();

const TOKEN_KEY =
  "flowforge_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token =
        localStorage.getItem(TOKEN_KEY);

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response =
          await api.get("/auth/me");

        setUser(response.data.user);
      } catch {
        localStorage.removeItem(
          TOKEN_KEY
        );

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const register = async (
    name,
    email,
    password
  ) => {
    const response =
      await api.post(
        "/auth/register",
        {
          name,
          email,
          password
        }
      );

    localStorage.setItem(
      TOKEN_KEY,
      response.data.token
    );

    setUser(response.data.user);

    return response.data;
  };

  const login = async (
    email,
    password
  ) => {
    const response =
      await api.post(
        "/auth/login",
        {
          email,
          password
        }
      );

    localStorage.setItem(
      TOKEN_KEY,
      response.data.token
    );

    setUser(response.data.user);

    return response.data;
  };

  const logout = async () => {
    try {
      await api.post(
        "/auth/logout"
      );
    } finally {
      localStorage.removeItem(
        TOKEN_KEY
      );

      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

