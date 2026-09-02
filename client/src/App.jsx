import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import Dashboard from "./pages/dashboard.jsx";
import NewWorkflow from "./pages/newWorkflow.jsx";
import Editor from "./pages/editor.jsx";
import Executions from "./pages/executions.jsx";
import ExecutionDetail from "./pages/executionDetail.jsx";

import DashboardLayout from "./layouts/dashboard.layout.jsx";

import { useAuth } from "./context/authContext.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<Dashboard />}
          />

          <Route
            path="new"
            element={<NewWorkflow />}
          />

          <Route
            path="executions"
            element={<Executions />}
          />

          <Route
            path="executions/:id"
            element={<ExecutionDetail />}
          />

          <Route
            path="editor/:id"
            element={<Editor />}
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;