import { useEffect, useState, useCallback } from "react";
import { useNavigate as useNav } from "react-router-dom";
import Layout from "../components/Layout";
import API from "../services/api";
import { toast } from "react-toastify";
import {
  FaUserMd,
  FaUsers,
  FaCalendarCheck,
  FaPlus,
  FaTrashAlt,
  FaCalendarAlt,
  FaSlidersH,
  FaStethoscope,
  FaClock,
  FaMoneyBillWave,
  FaQrcode,
  FaCamera,
} from "react-icons/fa";

function AdminDashboard() {
  const navigate = useNav();
  const token = localStorage.getItem("token");

  const [doctors, setDoctors] = useState([]);
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [patientsCount, setPatientsCount] = useState(0);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [scannedSlip, setScannedSlip] = useState(null);
  const [assignDoctorId, setAssignDoctorId] = useState("");

  const [form, setForm] = useState({
    name: "",
    specialization: "",
    experience: "",
    fee: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [doctorsRes, patientsRes, apptsRes] = await Promise.all([
        API.get("/doctors", { headers: { Authorization: `Bearer ${token}` } }),
        API.get("/users/patients", { headers: { Authorization: `Bearer ${token}` } }),
        API.get("/appointments", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setDoctors(doctorsRes.data);
      setDoctorsCount(doctorsRes.data.length);
      setPatientsCount(patientsRes.data.length);
      setAppointmentsCount(apptsRes.data.length);

      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch dashboard stats");
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 150);
    } catch (e) {
      console.warn("AudioContext beep failed:", e);
    }
  };

  const handleScanQR = () => {
    setIsScanning(true);
    setScannedSlip(null);
    setAssignDoctorId("");

    setTimeout(() => {
      const savedSlip = localStorage.getItem("offline_walkin_slip");
      if (savedSlip) {
        try {
          const parsed = JSON.parse(savedSlip);
          playBeep();
          setScannedSlip(parsed);
          
          // Match default doctor for the department code
          const dept = parsed.departmentCode || parsed.department || "";
          const matched = doctors.find(d => 
            d.specialization.toLowerCase().includes(dept.toLowerCase()) ||
            d.specialization.toLowerCase().includes("medicine")
          );
          if (matched) {
            setAssignDoctorId(matched._id);
          } else if (doctors.length > 0) {
            setAssignDoctorId(doctors[0]._id);
          }
          
          toast.success("QR Code scanned successfully!");
        } catch {
          toast.error("Invalid QR Code content");
        }
      } else {
        toast.error("No active offline walk-in slip detected. Generate a slip on the Patient Portal first.");
      }
      setIsScanning(false);
    }, 2000);
  };

  const handleCheckInWalkIn = async () => {
    if (!scannedSlip) return;

    try {
      await API.post(
        "/appointments/walkin-checkin",
        {
          patientId: scannedSlip.patientId,
          patientName: scannedSlip.patientName,
          age: scannedSlip.age,
          department: scannedSlip.departmentCode || scannedSlip.department,
          symptoms: scannedSlip.symptoms,
          walkinId: scannedSlip.slipId,
          doctorId: assignDoctorId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Walk-in patient checked in and assigned to doctor! 🎉");
      
      // Clear the local slip to simulate checking in
      localStorage.removeItem("offline_walkin_slip");
      setScannedSlip(null);
      
      // Refresh dashboard numbers
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to check in walk-in patient");
    }
  };

  const handleAddDoctor = async () => {
    if (!form.name || !form.specialization || !form.fee) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await API.post("/doctors", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Doctor added successfully");

      setForm({
        name: "",
        specialization: "",
        experience: "",
        fee: "",
      });

      // Fetch the updated doctor list to ensure DB consistency
      const doctorsRes = await API.get("/doctors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDoctors(doctorsRes.data);
      setDoctorsCount(doctorsRes.data.length);
    } catch (error) {
      toast.error("Failed to add doctor");
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm("⚠️ Are you sure you want to deactivate/delete this doctor?")) {
      return;
    }

    try {
      await API.delete(`/doctors/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Doctor deleted");
      setDoctors((prev) => prev.filter((d) => d._id !== id));
      setDoctorsCount((c) => Math.max(0, c - 1));
    } catch (error) {
      toast.error("Failed to delete doctor");
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* PAGE TITLE */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              Hospital Admin Dashboard
            </h2>
            <p className="text-sm text-gray-500 font-semibold mt-1">
              Real-time monitoring of medical staff, patients, and slot schedules.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 mt-4 md:mt-0">
            <button
              onClick={() => navigate("/admin/doctors")}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-blue-100 transition"
            >
              Staff Directory
            </button>
            <button
              onClick={() => navigate("/admin/appointments")}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-100 transition"
            >
              All Appointments
            </button>
            <button
              onClick={() => navigate("/admin/patients")}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-indigo-100 transition"
            >
              Patient List
            </button>
          </div>
        </div>

        {/* DASHBOARD STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex items-center gap-5 transition duration-300 hover:shadow-md">
            <div className="bg-blue-50 border border-blue-100 text-blue-600 p-4 rounded-2xl">
              <FaUserMd size={26} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Doctors</p>
              <p className="text-3xl font-black text-gray-800 mt-1">{loading ? "—" : doctorsCount}</p>
              <p className="text-[11px] text-gray-400 font-semibold mt-1">Registered medical professionals</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex items-center gap-5 transition duration-300 hover:shadow-md">
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl">
              <FaUsers size={26} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Patients</p>
              <p className="text-3xl font-black text-gray-800 mt-1">{loading ? "—" : patientsCount}</p>
              <p className="text-[11px] text-gray-400 font-semibold mt-1">Patients admitted in system</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex items-center gap-5 transition duration-300 hover:shadow-md">
            <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 p-4 rounded-2xl">
              <FaCalendarCheck size={26} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Appointments</p>
              <p className="text-3xl font-black text-gray-800 mt-1">{loading ? "—" : appointmentsCount}</p>
              <p className="text-[11px] text-gray-400 font-semibold mt-1">Total pending and confirmed logs</p>
            </div>
          </div>
        </div>

        {/* ACTION GRID: Add Doctor & QR Slip Check-In */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ONBOARD NEW DOCTOR */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-800 mb-5 flex items-center gap-2">
                <FaPlus className="text-blue-600" size={16} />
                Onboard New Doctor
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Doctor Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <FaUserMd size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Dr. Alexander"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none text-xs transition focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Specialization</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <FaStethoscope size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Cardiologist"
                      value={form.specialization}
                      onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none text-xs transition focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Years of Experience</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <FaClock size={14} />
                      </span>
                      <input
                        type="text"
                        placeholder="8"
                        value={form.experience}
                        onChange={(e) => setForm({ ...form, experience: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none text-xs transition focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Consultation Fee (₹)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <FaMoneyBillWave size={14} />
                      </span>
                      <input
                        type="number"
                        placeholder="600"
                        value={form.fee}
                        onChange={(e) => setForm({ ...form, fee: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none text-xs transition focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleAddDoctor}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-2xl shadow-md shadow-blue-500/10 transition active:scale-95 duration-200"
              >
                Add Doctor Directory
              </button>
            </div>
          </div>

          {/* WALKIN QUEUE TRIAGE CHECK-IN SCANNER */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-800 mb-5 flex items-center gap-2">
                <FaQrcode className="text-indigo-600" size={16} />
                Walk-In Triage Check-In
              </h3>

              {isScanning ? (
                /* Simulated Scanner Feed */
                <div className="bg-slate-900 border border-slate-800 rounded-2xl h-56 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-scan-laser z-10"></div>
                  <FaCamera className="text-slate-700 mb-3 animate-pulse" size={42} />
                  <p className="text-xs text-emerald-400 font-bold tracking-widest uppercase animate-pulse">Aligning QR code slip...</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">Reading digital pass matrix</p>
                </div>
              ) : scannedSlip ? (
                /* Scanned Ticket Triage card */
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-950/20 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="bg-emerald-500 text-white text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded shadow-sm">
                        Scanned WALK ticket
                      </span>
                      <h4 className="font-black text-base mt-2">{scannedSlip.patientName}</h4>
                      <p className="text-[10px] text-indigo-300 font-bold uppercase">{scannedSlip.slipId} (Age: {scannedSlip.age})</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-indigo-300 font-bold uppercase">Slip Token</p>
                      <p className="text-2xl font-black text-amber-400">#{scannedSlip.tokenNumber}</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <span className="text-[9px] text-indigo-300 block font-bold uppercase">Requested Department</span>
                      <span className="font-bold text-white text-sm bg-white/10 px-2 py-0.5 rounded inline-block mt-0.5">{scannedSlip.department}</span>
                    </div>

                    <div>
                      <span className="text-[9px] text-indigo-300 block font-bold uppercase">Reported Symptoms</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {scannedSlip.symptoms.map((s, idx) => (
                          <span key={idx} className="bg-white/10 px-2 py-0.5 rounded text-[11px] font-semibold text-indigo-50">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Doctor Assignment dropdown */}
                    <div className="pt-2 border-t border-white/10">
                      <label className="block text-[9px] text-indigo-300 font-bold uppercase mb-1.5">Assign to Medical Staff</label>
                      <select
                        value={assignDoctorId}
                        onChange={(e) => setAssignDoctorId(e.target.value)}
                        className="w-full bg-slate-800 text-white border border-indigo-700/30 px-3 py-2 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-amber-500"
                      >
                        <option value="">-- Choose Doctor --</option>
                        {doctors.map(d => (
                          <option key={d._id} value={d._id}>
                            Dr. {d.name} ({d.specialization})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                /* Scanner Ready/Prompt */
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl h-56 flex flex-col items-center justify-center p-6 text-center">
                  <FaQrcode className="text-slate-300 mb-3" size={48} />
                  <p className="text-xs text-slate-600 font-extrabold mb-1">Queue Scanner Offline Ready</p>
                  <p className="text-[10px] text-gray-400 font-semibold max-w-xs leading-normal">
                    Click scan to activate mock camera reader. Scanner will detect the generated slip dynamically from proximity (browser storage).
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              {scannedSlip ? (
                <>
                  <button
                    onClick={handleCheckInWalkIn}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-2xl shadow-md transition active:scale-95 duration-200 text-xs"
                    disabled={!assignDoctorId}
                  >
                    Confirm Walk-In Check-In
                  </button>
                  <button
                    onClick={() => setScannedSlip(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-5 rounded-2xl transition text-xs"
                  >
                    Reset
                  </button>
                </>
              ) : (
                <button
                  onClick={handleScanQR}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-2xl shadow-md transition active:scale-95 duration-200 flex items-center justify-center gap-2 text-xs"
                  disabled={isScanning}
                >
                  <FaCamera size={14} /> Scan Triage QR Code
                </button>
              )}
            </div>
          </div>

        </div>

        {/* DOCTOR LIST */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-black text-gray-800 mb-6">
            Staff Directory
          </h3>

          {loading ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-gray-400 font-semibold">Loading doctor data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3.5 pl-4">Name</th>
                    <th className="pb-3.5">Specialization</th>
                    <th className="pb-3.5">Experience</th>
                    <th className="pb-3.5">Fee</th>
                    <th className="pb-3.5 pr-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {doctors.map((doctor) => (
                    <tr key={doctor._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 pl-4 font-bold text-slate-700 text-sm">
                        {doctor.name}
                      </td>
                      <td className="text-slate-600 text-xs font-semibold">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200/50">
                          {doctor.specialization}
                        </span>
                      </td>
                      <td className="text-slate-500 text-xs font-semibold">{doctor.experience} Years</td>
                      <td className="text-emerald-600 font-bold text-sm">₹{doctor.fee}</td>

                      <td className="py-4 pr-4 text-right space-x-2">
                        {/* CONFIGURE AVAILABILITY */}
                        <button
                          onClick={() => navigate(`/admin/doctor/${doctor._id}/availability`)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-100 transition"
                        >
                          <FaSlidersH className="inline mr-1" />
                          Hours
                        </button>

                        {/* VIEW CALENDAR */}
                        <button
                          onClick={() => navigate(`/admin/doctor/${doctor._id}/calendar`)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-100 transition"
                        >
                          <FaCalendarAlt className="inline mr-1" />
                          Calendar
                        </button>

                        {/* DELETE DOCTOR */}
                        <button
                          onClick={() => handleDeleteDoctor(doctor._id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-100 transition"
                        >
                          <FaTrashAlt />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {doctors.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-gray-400 font-bold text-sm">
                        No doctors added yet. Use the onboard form above to begin.
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}

export default AdminDashboard;