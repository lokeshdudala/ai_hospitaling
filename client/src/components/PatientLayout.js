import { useNavigate, useLocation } from "react-router-dom";
import { useState, useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";
import { FaUserCircle, FaRobot, FaFileMedical, FaCalendarPlus, FaHeartbeat, FaSignOutAlt, FaUser, FaHistory, FaGlobe, FaHandsHelping } from "react-icons/fa";

function PatientLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openProfile, setOpenProfile] = useState(false);
  const { language, setLanguage, t } = useContext(LanguageContext);

  const token = localStorage.getItem("token");

  let user = {};
  if (token) {
    try {
      user = JSON.parse(atob(token.split(".")[1]));
    } catch {}
  }

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const isActive = (path) =>
    location.pathname === path
      ? "flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold shadow-sm border border-blue-100 transition-all duration-300"
      : "flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-xl font-medium transition-all duration-300";

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-gray-50 to-blue-50">

      {/* NAVBAR */}
      <nav className="bg-white/85 border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          {/* LEFT: Branding & Links */}
          <div className="flex items-center gap-8">
            <div
              className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-blue-700 cursor-pointer select-none group"
              onClick={() => navigate("/patient")}
            >
              <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-200 group-hover:scale-105 transition-transform duration-300">
                <FaHeartbeat className="animate-pulse" size={20} />
              </div>
              <span className="bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                SmartCare
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => navigate("/patient")}
                className={isActive("/patient")}
              >
                Dashboard
              </button>

              <button
                onClick={() => navigate("/book-appointment")}
                className={isActive("/book-appointment")}
              >
                <FaCalendarPlus size={15} />
                Book Slot
              </button>

              <button
                onClick={() => navigate("/patient/records")}
                className={isActive("/patient/records")}
              >
                <FaFileMedical size={15} />
                Medical Records
              </button>

              <button
                onClick={() => navigate("/patient/rural-assist")}
                className={isActive("/patient/rural-assist")}
              >
                <FaHandsHelping size={15} className="text-amber-500" />
                {t.ruralAssistShort}
              </button>

              <button
                onClick={() => navigate("/patient/health-chat")}
                className={isActive("/patient/health-chat")}
              >
                <FaRobot size={15} />
                AI Health Chat
              </button>

              <button
                onClick={() => navigate("/patient/payments")}
                className={isActive("/patient/payments")}
              >
                <FaHistory size={15} />
                Billing
              </button>
            </div>
          </div>

          {/* RIGHT: Language Selector & User Profile Dropdown */}
          <div className="flex items-center gap-4">
            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 shadow-sm">
              <FaGlobe className="text-blue-500 animate-spin-slow" size={14} />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 outline-none border-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="te">తెలుగు</option>
                <option value="hi">हिंदी</option>
              </select>
            </div>

            <div className="relative">
              <button
                onClick={() => setOpenProfile(!openProfile)}
                className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 border border-transparent hover:border-gray-100 rounded-xl transition duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                  {user.name ? user.name[0].toUpperCase() : <FaUserCircle size={20} />}
                </div>
                <span className="font-semibold text-gray-700 text-sm hidden sm:inline">
                  {user.name || "Patient"}
                </span>
              </button>


            {openProfile && (
              <div className="absolute right-0 mt-3 w-52 bg-white/95 backdrop-blur-md shadow-xl rounded-2xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Patient Portal</p>
                  <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                
                <button
                  onClick={() => {
                    setOpenProfile(false);
                    navigate("/patient/profile");
                  }}
                  className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  <FaUser size={14} className="opacity-70" />
                  My Profile
                </button>

                <button
                  onClick={() => {
                    setOpenProfile(false);
                    navigate("/patient/payments");
                  }}
                  className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  <FaHistory size={14} className="opacity-70" />
                  Billing & Payments
                </button>

                <button
                  onClick={logout}
                  className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <FaSignOutAlt size={14} className="opacity-70" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        </div>
      </nav>

      {/* MOBILE NAV BAR (shows on small screens only) */}
      <div className="md:hidden flex justify-around items-center bg-white border-t border-gray-100 fixed bottom-0 left-0 w-full py-2.5 px-4 shadow-2xl z-40">
        <button
          onClick={() => navigate("/patient")}
          className={`flex flex-col items-center text-xs ${location.pathname === "/patient" ? "text-blue-600 font-bold" : "text-gray-500"}`}
        >
          <span className="text-lg">🏠</span>
          Dashboard
        </button>
        <button
          onClick={() => navigate("/book-appointment")}
          className={`flex flex-col items-center text-xs ${location.pathname === "/book-appointment" ? "text-blue-600 font-bold" : "text-gray-500"}`}
        >
          <FaCalendarPlus className="text-lg mb-0.5" />
          Book Slot
        </button>
        <button
          onClick={() => navigate("/patient/rural-assist")}
          className={`flex flex-col items-center text-xs ${location.pathname === "/patient/rural-assist" ? "text-blue-600 font-bold" : "text-gray-500"}`}
        >
          <FaHandsHelping className="text-lg mb-0.5 text-amber-500" />
          {t.ruralAssistShort || "Rural"}
        </button>
        <button
          onClick={() => navigate("/patient/records")}
          className={`flex flex-col items-center text-xs ${location.pathname === "/patient/records" ? "text-blue-600 font-bold" : "text-gray-500"}`}
        >
          <FaFileMedical className="text-lg mb-0.5" />
          Records
        </button>
        <button
          onClick={() => navigate("/patient/health-chat")}
          className={`flex flex-col items-center text-xs ${location.pathname === "/patient/health-chat" ? "text-blue-600 font-bold" : "text-gray-500"}`}
        >
          <FaRobot className="text-lg mb-0.5" />
          AI Chat
        </button>
      </div>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 pb-24 md:pb-10">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

    </div>
  );
}

export default PatientLayout;