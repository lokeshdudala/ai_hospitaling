import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientLayout from "../components/PatientLayout";
import API from "../services/api";
import { toast } from "react-toastify";
import {
  FaCalendarAlt,
  FaUserMd,
  FaClock,
  FaReceipt,
  FaNotesMedical,
  FaFolderOpen,
} from "react-icons/fa";

function MedicalRecords() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const loadRecords = async () => {
      try {
        const res = await API.get("/appointments/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(res.data);
      } catch (error) {
        toast.error("Failed to load medical records");
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, [token, navigate]);

  const getStatusColor = (status) => {
    if (status === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
    if (status === "confirmed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-bold text-sm">Retrieving electronic health records...</p>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center md:text-left mb-6">
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent tracking-tight">
            Medical Records
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Access your full consultation history, physician notes, and billing receipts.
          </p>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white border border-gray-100 p-10 rounded-3xl text-center shadow-sm max-w-xl mx-auto mt-8">
            <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <FaFolderOpen size={28} />
            </div>
            <h3 className="text-lg font-black text-gray-800 mb-1">No Diagnostic Files</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6 leading-relaxed">
              Your electronic records will compile here as you complete hospital sessions.
            </p>
            <button
              onClick={() => navigate("/book-appointment")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-2xl shadow-md transition active:scale-95 duration-200 text-sm"
            >
              Book First Appointment
            </button>
          </div>
        ) : (
          <div className="relative border-l-2 border-blue-100 ml-4 pl-6 sm:pl-8 space-y-8 py-2">
            {appointments.map((appt) => (
              <div key={appt._id} className="relative bg-white border border-gray-100 rounded-3xl p-6 shadow-sm transition duration-200 hover:shadow-md hover:border-gray-200">
                
                {/* Timeline Dot Indicator */}
                <div className="absolute -left-[35px] sm:-left-[43px] top-7 w-5 h-5 rounded-full bg-blue-600 border-4 border-white shadow shadow-blue-500/30"></div>

                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5 pb-4 border-b border-gray-50">
                  <div>
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                      <FaUserMd className="text-blue-600" size={18} />
                      Consultation with {appt.doctor?.name}
                    </h3>
                    <span className="inline-block text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 mt-1 rounded border">
                      {appt.doctor?.specialization || "General Practitioner"}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusColor(
                      appt.status
                    )}`}
                  >
                    ● {appt.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2.5 text-gray-600">
                    <div className="text-blue-500 bg-blue-50 p-2 rounded-xl border border-blue-100/50">
                      <FaCalendarAlt size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Date</p>
                      <p className="text-xs font-bold text-gray-700">{appt.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-gray-600">
                    <div className="text-indigo-500 bg-indigo-50 p-2 rounded-xl border border-indigo-100/50">
                      <FaClock size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Timing</p>
                      <p className="text-xs font-bold text-gray-700">{appt.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-gray-600 col-span-2 md:col-span-1">
                    <div className="text-emerald-500 bg-emerald-50 p-2 rounded-xl border border-emerald-100/50">
                      <FaReceipt size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Billing Fee</p>
                      <p className="text-xs font-black text-emerald-600">₹{appt.doctor?.fee || 0} ({appt.paymentStatus})</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex gap-3.5">
                  <div className="text-blue-600 mt-0.5">
                    <FaNotesMedical size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Clinical Remarks</h4>
                    <p className="text-sm font-semibold text-gray-600 leading-relaxed">
                      {appt.notes || "No patient diagnosis notes recorded for this session. A follow-up consult can be scheduled if symptoms persist."}
                    </p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}

export default MedicalRecords;