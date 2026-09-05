import { useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";
import HealthChatBot from "../components/HealthChatBot";
import { FaUserMd, FaCalendarCheck, FaUsers, FaChartPie, FaSignOutAlt, FaGlobe, FaHeartbeat, FaHandsHelping } from "react-icons/fa";

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useContext(LanguageContext);

  const token = localStorage.getItem("token");

  let role = null;
  if (token) {
    try {
      role = JSON.parse(atob(token.split(".")[1])).role;
    } catch {}
  }

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const isActive = (path) =>
    location.pathname === path
      ? "flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-500/10 transition-all duration-200"
      : "flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl font-semibold transition-all duration-200";

  return (
    <div className="flex min-h-screen bg-slate-50/50">

      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between h-screen sticky top-0">

        <div>
          {/* Brand Logo */}
          <div
            className="p-6 flex items-center gap-2.5 text-2xl font-black tracking-tight text-blue-700 cursor-pointer select-none group"
            onClick={() =>
              role === "admin" ? navigate("/admin") : navigate("/patient")
            }
          >
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-200 group-hover:scale-105 transition-transform duration-300">
              <FaHeartbeat className="animate-pulse" size={20} />
            </div>
            <span className="bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
              SmartCare
            </span>
          </div>

          {/* Navigation Links */}
          <div className="px-4 mt-6 space-y-1.5">

            {role === "admin" && (
              <>
                <button
                  onClick={() => navigate("/admin")}
                  className={isActive("/admin")}
                >
                  <FaChartPie size={16} />
                  Dashboard
                </button>

                <button
                  onClick={() => navigate("/admin/doctors")}
                  className={isActive("/admin/doctors")}
                >
                  <FaUserMd size={16} />
                  Doctors
                </button>

                <button
                  onClick={() => navigate("/admin/appointments")}
                  className={isActive("/admin/appointments")}
                >
                  <FaCalendarCheck size={16} />
                  Appointments
                </button>

                <button
                  onClick={() => navigate("/admin/patients")}
                  className={isActive("/admin/patients")}
                >
                  <FaUsers size={16} />
                  Patients
                </button>
              </>
            )}

            {role === "patient" && (
              <>
                <button
                  onClick={() => navigate("/patient")}
                  className={isActive("/patient")}
                >
                  <FaChartPie size={16} />
                  Dashboard
                </button>

                <button
                  onClick={() => navigate("/book-appointment")}
                  className={isActive("/book-appointment")}
                >
                  <FaCalendarCheck size={16} />
                  Book Appointment
                </button>

                <button
                  onClick={() => navigate("/patient/rural-assist")}
                  className={isActive("/patient/rural-assist")}
                >
                  <FaHandsHelping size={16} className="text-amber-500" />
                  {t.ruralAssistShort || "Rural Assist"}
                </button>
              </>
            )}

          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-6 border-t border-slate-100 space-y-5 bg-slate-50/50">

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <FaGlobe /> Select Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-white border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 rounded-xl outline-none focus:border-blue-500 transition"
            >
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2.5 rounded-xl transition duration-200 text-sm"
          >
            <FaSignOutAlt size={14} />
            Logout
          </button>

        </div>

      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8 overflow-y-auto max-h-screen relative">
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
          {children}
        </div>

        {/* Chatbot only for patient */}
        {role === "patient" && <HealthChatBot />}
      </div>

    </div>
  );
}

export default Layout;