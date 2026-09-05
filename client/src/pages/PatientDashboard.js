import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import PatientLayout from "../components/PatientLayout";
import { LanguageContext } from "../context/LanguageContext";
import API from "../services/api";
import { toast } from "react-toastify";
import {
  FaCalendarCheck,
  FaCheckCircle,
  FaClock,
  FaCalendarPlus,
  FaUserEdit,
  FaRobot,
  FaFileMedical,
  FaHeartbeat,
  FaChevronRight,
  FaMoneyBillWave,
  FaStethoscope,
  FaHandsHelping
} from "react-icons/fa";

function PatientDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { t } = useContext(LanguageContext);

  const [appointments, setAppointments] = useState([]);
  const [pending, setPending] = useState([]);
  const [confirmed, setConfirmed] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [patientName, setPatientName] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const loadData = async () => {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setPatientName(decoded.name || "Patient");

        const res = await API.get("/appointments/my", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const today = new Date().toISOString().split("T")[0];
        const all = res.data;

        setAppointments(all);
        setPending(all.filter((a) => a.status === "pending"));
        setConfirmed(
          all.filter((a) => a.status === "confirmed" && a.date >= today)
        );
        setCompleted(
          all.filter((a) => a.status === "confirmed" && a.date < today)
        );
      } catch {
        toast.error("Failed to load appointments");
      }
    };

    loadData();
  }, [token, navigate]);

  const bookBlocked = pending.length >= 3;

  const getStatusColor = (status) => {
    if (status === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
    if (status === "confirmed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  const getPaymentBadge = (status) => {
    if (status === "paid") {
      return (
        <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-bold">
          <FaMoneyBillWave size={12} /> Paid
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold">
        <FaMoneyBillWave size={12} /> Unpaid
      </span>
    );
  };

  return (
    <PatientLayout>
      {/* Welcome & Notification Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none transform translate-x-12 -translate-y-12"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black mb-2 tracking-tight">
              Hello, {patientName}!
            </h2>
            <p className="text-blue-100 max-w-xl text-sm font-medium leading-relaxed">
              Welcome back to your healthcare hub. Book a new appointment, review diagnostics, or chat with our AI medical assistant.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => !bookBlocked && navigate("/book-appointment")}
              className={`bg-white hover:bg-blue-50 text-blue-700 font-bold px-6 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 text-sm border border-transparent hover:scale-105 active:scale-95 duration-200 ${
                bookBlocked ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <FaCalendarPlus size={16} />
              Book Appointment
            </button>
          </div>
        </div>
      </div>

      {bookBlocked && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-3.5 rounded-2xl font-bold flex items-center gap-3 mb-8 shadow-sm text-sm">
          <span className="text-lg">⚠️</span>
          You have reached the limit of 3 pending appointments. Please wait for an administrator to review them.
        </div>
      )}

      {/* Appointment Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center gap-4 transition duration-300 hover:shadow-md">
          <div className="bg-amber-100/70 text-amber-700 p-3.5 rounded-xl">
            <FaClock size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Approval</p>
            <p className="text-2xl font-black text-gray-800">{pending.length}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center gap-4 transition duration-300 hover:shadow-md">
          <div className="bg-emerald-100/70 text-emerald-700 p-3.5 rounded-xl">
            <FaCalendarCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Confirmed Slots</p>
            <p className="text-2xl font-black text-gray-800">{confirmed.length}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center gap-4 transition duration-300 hover:shadow-md">
          <div className="bg-blue-100/70 text-blue-700 p-3.5 rounded-xl">
            <FaCheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed Visits</p>
            <p className="text-2xl font-black text-gray-800">{completed.length}</p>
          </div>
        </div>
      </div>

      {/* Rural Care Portal Callout Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-amber-500/10 flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3.5 rounded-2xl border border-white/10 text-white text-2xl animate-bounce">
            🤝
          </div>
          <div>
            <h4 className="font-black text-lg mb-1">{t.ruralAssist || "Rural Care & Voice Assistant"}</h4>
            <p className="text-xs text-amber-50 leading-relaxed font-semibold max-w-xl">
              Easy voice controls, visual symptoms, local language translations, and completely offline queue ticket pass generator for village clinics.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/patient/rural-assist")}
          className="bg-white text-orange-700 hover:bg-orange-50 font-extrabold text-sm px-5 py-3 rounded-2xl shadow-sm transition active:scale-95 duration-200 w-full md:w-auto"
        >
          Open Rural Helper ➡️
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-gray-800">
                Active Appointments
              </h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Total: {appointments.length}
              </span>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                <FaStethoscope className="text-gray-300 mx-auto mb-3" size={42} />
                <p className="text-gray-500 font-bold text-sm">No appointments scheduled</p>
                <p className="text-xs text-gray-400 mt-1">Book your first doctor slot using the wizard button.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt) => (
                  <div
                    key={appt._id}
                    className="border border-gray-100 hover:border-blue-100 hover:bg-blue-50/10 p-5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-50 border border-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 font-black">
                        {appt.doctor?.name ? appt.doctor.name[0] : "Dr."}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-base">
                          {appt.doctor?.name || "Qualified Doctor"}
                        </p>
                        <p className="text-xs text-gray-400 font-semibold mt-0.5">
                          {appt.doctor?.specialization || "General Practitioner"}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded">
                            📅 {appt.date}
                          </p>
                          <p className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded">
                            ⏰ {appt.time}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-50">
                      {getPaymentBadge(appt.paymentStatus)}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusColor(
                          appt.status
                        )}`}
                      >
                        ● {appt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Actions & Health Tips */}
        <div className="space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-gray-800 mb-5">Quick Actions</h3>
            <div className="space-y-3">
              <div
                onClick={() => !bookBlocked && navigate("/book-appointment")}
                className={`flex items-center justify-between p-3.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-2xl cursor-pointer border border-transparent hover:border-blue-100 transition-all duration-200 group ${
                  bookBlocked ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100/50 text-blue-600 p-2 rounded-xl group-hover:scale-105 transition duration-200">
                    <FaCalendarPlus size={16} />
                  </div>
                  <span className="font-bold text-sm">Schedule Visit</span>
                </div>
                <FaChevronRight size={12} className="text-gray-400 group-hover:translate-x-0.5 transition" />
              </div>

              <div
                onClick={() => navigate("/patient/records")}
                className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-2xl cursor-pointer border border-transparent hover:border-emerald-100 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100/50 text-emerald-600 p-2 rounded-xl group-hover:scale-105 transition duration-200">
                    <FaFileMedical size={16} />
                  </div>
                  <span className="font-bold text-sm">Medical History</span>
                </div>
                <FaChevronRight size={12} className="text-gray-400 group-hover:translate-x-0.5 transition" />
              </div>

              <div
                onClick={() => navigate("/patient/rural-assist")}
                className="flex items-center justify-between p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-2xl cursor-pointer border border-amber-200 hover:border-amber-300 transition-all duration-200 group shadow-sm animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-amber-200 text-amber-800 p-2 rounded-xl group-hover:scale-105 transition duration-200">
                    <FaHandsHelping size={16} />
                  </div>
                  <span className="font-bold text-sm">{t.ruralAssistShort || "Rural Assist"}</span>
                </div>
                <FaChevronRight size={12} className="text-amber-700 group-hover:translate-x-0.5 transition" />
              </div>

              <div
                onClick={() => navigate("/patient/health-chat")}
                className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-2xl cursor-pointer border border-transparent hover:border-indigo-100 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100/50 text-indigo-600 p-2 rounded-xl group-hover:scale-105 transition duration-200">
                    <FaRobot size={16} />
                  </div>
                  <span className="font-bold text-sm">Consult AI Bot</span>
                </div>
                <FaChevronRight size={12} className="text-gray-400 group-hover:translate-x-0.5 transition" />
              </div>

              <div
                onClick={() => navigate("/patient/profile")}
                className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-700 rounded-2xl cursor-pointer border border-transparent hover:border-amber-100 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100/50 text-amber-600 p-2 rounded-xl group-hover:scale-105 transition duration-200">
                    <FaUserEdit size={16} />
                  </div>
                  <span className="font-bold text-sm">Update Profile</span>
                </div>
                <FaChevronRight size={12} className="text-gray-400 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          </div>

          {/* Health Tips Widget */}
          <div className="bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg shadow-teal-500/10">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <FaHeartbeat className="text-white animate-pulse" />
              Daily Health Tips
            </h3>
            <div className="space-y-4">
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                <h4 className="font-bold text-sm mb-1 text-teal-50">💧 Stay Hydrated</h4>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Drinking 8-10 glasses of water keeps your organs functioning properly and improves energy levels.
                </p>
              </div>
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                <h4 className="font-bold text-sm mb-1 text-teal-50">🚶‍♂️ Keep Active</h4>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  A daily 30-minute walk significantly boosts cardiovascular health and mental well-being.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </PatientLayout>
  );
}

export default PatientDashboard;