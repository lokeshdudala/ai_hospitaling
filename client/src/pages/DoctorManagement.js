import { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import { FaUserMd, FaTrash, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import API from "../services/api";

function DoctorManagement() {
  const [showModal, setShowModal] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    name: "",
    specialization: "",
    experience: "",
    fee: "",
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(() => () => {});

  const [page, setPage] = useState(1);
  const pageSize = 8; // doctors per page

  const token = localStorage.getItem("token");

  const totalPages = Math.max(1, Math.ceil(doctors.length / pageSize));
  const pagedDoctors = doctors.slice((page - 1) * pageSize, page * pageSize);


  // Fetch Doctors (include inactive for management)
  const fetchDoctors = useCallback(async () => {
    try {
      const res = await API.get("/doctors?includeInactive=true", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDoctors(res.data);
    } catch (error) {
      console.error("Failed to fetch doctors");
    }
  }, [token]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Add Doctor
  const addDoctor = async () => {
    try {
      await API.post("/doctors", form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setShowModal(false);
      setForm({
        name: "",
        specialization: "",
        experience: "",
        fee: "",
      });

      fetchDoctors(); // refresh list
    } catch (error) {
      console.error("Failed to add doctor");
    }
  };

  const openConfirm = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmMessage("");
  };

  const deactivateDoctor = async (id) => {
    try {
      await API.put(
        `/doctors/${id}/deactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDoctors((prev) =>
        prev.map((d) =>
          d._id === id ? { ...d, isActive: false } : d
        )
      );

      // Undo option
      const undo = async () => {
        await restoreDoctor(id);
      };

      toast.success(
        <span>
          Doctor deactivated. <button className="underline" onClick={undo}>Undo</button>
        </span>
      );
    } catch (error) {
      console.error("Failed to deactivate doctor");
    }
  };

  const restoreDoctor = async (id) => {
    try {
      await API.put(
        `/doctors/${id}/restore`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDoctors((prev) =>
        prev.map((d) =>
          d._id === id ? { ...d, isActive: true } : d
        )
      );

      toast.success("Doctor restored");
    } catch (error) {
      console.error("Failed to restore doctor");
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">
          Doctor Management
        </h2>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700"
        >
          <FaPlus />
          Add Doctor
        </button>
      </div>

      {/* Doctor Table */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="pb-3">Name</th>
              <th className="pb-3">Specialization</th>
              <th className="pb-3">Experience</th>
              <th className="pb-3">Fee</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {pagedDoctors.map((doc) => (
              <tr
                key={doc._id}
                className={`border-b hover:bg-gray-50 ${
                  doc.isActive ? "" : "bg-gray-50"
                }`}
              >
                <td className="py-4 font-medium flex items-center gap-2">
                  <FaUserMd className="text-blue-600" />
                  {doc.name}
                </td>
                <td>{doc.specialization}</td>
                <td>{doc.experience}</td>
                <td>₹{doc.fee}</td>
                <td>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      doc.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {doc.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="space-x-2">
                  {doc.isActive ? (
                    <button
                      onClick={() =>
                        openConfirm(
                          `Deactivate ${doc.name}?`,
                          () => deactivateDoctor(doc._id)
                        )
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  ) : (
                    <button
                      onClick={() => restoreDoctor(doc._id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      Restore
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">
          Showing {Math.min((page - 1) * pageSize + 1, doctors.length)} - {Math.min(page * pageSize, doctors.length)} of {doctors.length} doctors
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Add Doctor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 w-96 shadow-xl">
            <h3 className="text-xl font-semibold mb-6">
              Add New Doctor
            </h3>

            <input
              placeholder="Doctor Name"
              className="w-full border p-3 rounded-lg mb-4"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <input
              placeholder="Specialization"
              className="w-full border p-3 rounded-lg mb-4"
              value={form.specialization}
              onChange={(e) =>
                setForm({ ...form, specialization: e.target.value })
              }
            />

            <input
              placeholder="Experience"
              className="w-full border p-3 rounded-lg mb-4"
              value={form.experience}
              onChange={(e) =>
                setForm({ ...form, experience: e.target.value })
              }
            />

            <input
              placeholder="Consultation Fee"
              type="number"
              className="w-full border p-3 rounded-lg mb-6"
              value={form.fee}
              onChange={(e) =>
                setForm({ ...form, fee: e.target.value })
              }
            />

            <div className="flex justify-between">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200"
              >
                Cancel
              </button>

              <button
                onClick={addDoctor}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 w-96 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Confirm action</h3>
            <p className="text-gray-700 mb-6">{confirmMessage}</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeConfirm}
                className="px-4 py-2 rounded-lg bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmAction();
                  closeConfirm();
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default DoctorManagement;