import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>FlowForge</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className="sidebar-link"
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/workflows"
          className="sidebar-link"
        >
          Workflows
        </NavLink>

        <NavLink
          to="/executions"
          className="sidebar-link"
        >
          Executions
        </NavLink>

        <NavLink
          to="/settings"
          className="sidebar-link"
        >
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;