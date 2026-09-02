import { Outlet } from "react-router-dom";

import Sidebar from "../components/sidebar.jsx";
import Topbar from "../components/topbar.jsx";

function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Topbar />

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;