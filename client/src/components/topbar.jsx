import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/authContext.jsx";

function Topbar() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();

    navigate("/login");
  };

  return (
    <header className="topbar">
      <div>
        <p className="topbar-greeting">
          Welcome back, {user?.name}
        </p>

        <p className="topbar-subtitle">
          Manage your workflows and automations.
        </p>
      </div>

      <div className="topbar-actions">
        <span className="topbar-email">
          {user?.email}
        </span>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Topbar;