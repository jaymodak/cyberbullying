import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const FONT_SIZES = { small: "13px", medium: "15px", large: "18px" };

export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(null);
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [isDark,   setIsDark]   = useState(() => localStorage.getItem("theme") !== "light");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("fontSize") || "medium");

  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize);
    document.documentElement.style.fontSize = FONT_SIZES[fontSize];
  }, [fontSize]);

  const adminLogout = () => setIsAdmin(false);

  return (
    <AuthContext.Provider value={{ user, setUser, isAdmin, setIsAdmin, adminLogout, isDark, setIsDark, fontSize, setFontSize }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }