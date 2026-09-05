import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import BookAppointment from "./pages/BookAppointment";
import DoctorManagement from "./pages/DoctorManagement";
import AdminAppointments from "./pages/AdminAppointments";
import AdminPatients from "./pages/AdminPatients";
import AdminConfigureAvailability from "./pages/AdminConfigureAvailability";
import AdminDoctorCalendar from "./pages/AdminDoctorCalendar";
import AdminRoute from "./components/AdminRoute";
import PatientProfile from "./pages/PatientProfile";
import HealthChatPage from "./pages/HealthChatPage";
import MedicalRecords from "./pages/MedicalRecords";
import PaymentHistory from "./pages/PaymentHistory";
import RuralPortal from "./pages/RuralPortal";

function App() {
  return (
    <Router>
      <Routes>

        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Patient */}
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/book-appointment" element={<BookAppointment />} />
        <Route path="/patient/profile" element={<PatientProfile />} />
        <Route path="/patient/health-chat" element={<HealthChatPage />} />
        <Route path="/patient/records" element={<MedicalRecords />} />
        <Route path="/patient/payments" element={<PaymentHistory />} />
        <Route path="/patient/rural-assist" element={<RuralPortal />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/doctors"
          element={
            <AdminRoute>
              <DoctorManagement />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/appointments"
          element={
            <AdminRoute>
              <AdminAppointments />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/patients"
          element={
            <AdminRoute>
              <AdminPatients />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/doctor/:id/availability"
          element={
            <AdminRoute>
              <AdminConfigureAvailability />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/doctor/:id/calendar"
          element={
            <AdminRoute>
              <AdminDoctorCalendar />
            </AdminRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;