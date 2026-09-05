import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/" />;

  try {
    const decoded = JSON.parse(atob(token.split(".")[1]));

    if (decoded.role !== "admin") {
      return <Navigate to="/patient" />;
    }

    return children;
  } catch {
    return <Navigate to="/" />;
  }
}

export default AdminRoute;