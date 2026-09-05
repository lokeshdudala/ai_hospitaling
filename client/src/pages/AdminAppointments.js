import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import { toast } from "react-toastify";

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const token = localStorage.getItem("token");

  const fetchAppointments = async () => {
    try {
      const res = await API.get("/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(res.data);
    } catch (error) {
      toast.error("Failed to fetch appointments ❌");
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      setLoadingId(id);

      await API.put(
        `/appointments/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (status === "confirmed") {
        toast.success("Appointment Approved ✅");
      } else {
        toast.warn("Appointment Rejected ❌");
      }

      fetchAppointments();
    } catch (error) {
      toast.error("Failed to update status ❌");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">
        Manage Appointments
      </h2>

      <div className="bg-white rounded-2xl shadow-xl p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="pb-3">Patient</th>
              <th className="pb-3">Doctor</th>
              <th className="pb-3">Date</th>
              <th className="pb-3">Time</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {appointments.map((appt) => (
              <tr key={appt._id} className="border-b hover:bg-gray-50">
                <td className="py-3">
                  {appt.patient?.name}
                </td>

                <td>
                  {appt.doctor?.name}
                </td>

                <td>{appt.date}</td>

                <td>{appt.time}</td>

                <td
                  className={`capitalize font-semibold ${
                    appt.status === "confirmed"
                      ? "text-green-600"
                      : appt.status === "rejected"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {appt.status}
                </td>

                <td className="space-x-2">

                  {appt.status === "pending" ? (
                    <>
                      <button
                        disabled={loadingId === appt._id}
                        onClick={() =>
                          updateStatus(appt._id, "confirmed")
                        }
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        {loadingId === appt._id
                          ? "Processing..."
                          : "Approve"}
                      </button>

                      <button
                        disabled={loadingId === appt._id}
                        onClick={() =>
                          updateStatus(appt._id, "rejected")
                        }
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                      >
                        {loadingId === appt._id
                          ? "Processing..."
                          : "Reject"}
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">
                      No Actions
                    </span>
                  )}

                </td>
              </tr>
            ))}

            {appointments.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No appointments available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default AdminAppointments;