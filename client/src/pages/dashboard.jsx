import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/authContext.jsx";

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();

    navigate("/login");
  };

  return (
    <div>
      <h1>FlowForge Dashboard</h1>

      {user && (
        <>
          <p>
            Welcome, {user.name}
          </p>

          <p>
            {user.email}
          </p>

          <button onClick={handleLogout}>
            Logout
          </button>
        </>
      )}
    </div>
  );
}

export default Dashboard;