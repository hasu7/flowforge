
import { useAuth } from "../context/authContext.jsx";

function Settings() {
  const { user } = useAuth();

  const email =
    user?.email || "Not available";

  const createdAt =
    user?.createdAt
      ? new Date(
          user.createdAt
        ).toLocaleDateString()
      : "Not available";

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h2 className="dashboard-title">
            Settings
          </h2>

          <p className="dashboard-description">
            Manage your FlowForge account
            and application preferences.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card-header">
            <div>
              <h3>Account</h3>

              <p>
                Your FlowForge account information.
              </p>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <span className="settings-label">
                Email
              </span>

              <span className="settings-value">
                {email}
              </span>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <span className="settings-label">
                Account created
              </span>

              <span className="settings-value">
                {createdAt}
              </span>
            </div>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-header">
            <div>
              <h3>
                Workflow Preferences
              </h3>

              <p>
                Default settings used by
                scheduled workflows.
              </p>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <span className="settings-label">
                Default timezone
              </span>

              <span className="settings-value">
                Asia/Kolkata
              </span>
            </div>

            <span className="settings-badge">
              Current
            </span>
          </div>

          <p className="settings-note">
            Schedule timezones are currently
            configured directly on each
            scheduled workflow.
          </p>
        </section>

        <section className="settings-card">
          <div className="settings-card-header">
            <div>
              <h3>Application</h3>

              <p>
                FlowForge application information.
              </p>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <span className="settings-label">
                Application
              </span>

              <span className="settings-value">
                FlowForge
              </span>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <span className="settings-label">
                Version
              </span>

              <span className="settings-value">
                1.0.0
              </span>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <span className="settings-label">
                Environment
              </span>

              <span className="settings-value">
                Development
              </span>
            </div>

            <span className="settings-badge">
              Local
            </span>
          </div>

          <div className="settings-item">
            <div>
              <span className="settings-label">
                API
              </span>

              <span className="settings-value">
                http://localhost:5000
              </span>
            </div>

            <span className="settings-badge">
              Connected
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Settings;