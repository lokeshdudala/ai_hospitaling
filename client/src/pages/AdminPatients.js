import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

function AdminPatients() {
  const token = localStorage.getItem("token");

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await API.get("/users/patients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients(res.data);
    } catch {
      toast.error("Failed to fetch patients");
    }
  }, [token]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleAction = async (type, id) => {
    try {
      await API.put(
        `/users/${type}/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(`User ${type} successful`);
      fetchPatients();
      setConfirmAction(null);

    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (patient) => {
    if (!patient.isActive)
      return "bg-gray-200 text-gray-600";
    if (patient.isBlocked)
      return "bg-red-100 text-red-600";
    return "bg-green-100 text-green-600";
  };

  const getStatusText = (patient) => {
    if (!patient.isActive) return "Deactivated";
    if (patient.isBlocked) return "Blocked";
    return "Active";
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">

      <h2 className="text-2xl font-bold mb-6 text-blue-600">
        Patient Management
      </h2>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search patient by name or email..."
          className="w-full md:w-1/3 p-3 rounded-xl border"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="p-4">Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th className="text-right pr-6">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredPatients.map((patient) => (
              <tr key={patient._id} className="border-b hover:bg-gray-50">

                <td className="p-4 font-medium">
                  {patient.name}
                </td>

                <td>{patient.email}</td>

                <td>{patient.phone || "—"}</td>

                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(
                      patient
                    )}`}
                  >
                    {getStatusText(patient)}
                  </span>
                </td>

                <td className="text-right pr-6 space-x-2">

                  {/* Block / Unblock */}
                  {patient.isBlocked ? (
                    <button
                      onClick={() =>
                        setConfirmAction({
                          type: "unblock",
                          id: patient._id,
                        })
                      }
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        setConfirmAction({
                          type: "block",
                          id: patient._id,
                        })
                      }
                      className="bg-yellow-500 text-white px-3 py-1 rounded"
                    >
                      Block
                    </button>
                  )}

                  {/* Soft Delete */}
                  {patient.isActive && (
                    <button
                      onClick={() =>
                        setConfirmAction({
                          type: "deactivate",
                          id: patient._id,
                        })
                      }
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Deactivate
                    </button>
                  )}

                </td>
              </tr>
            ))}

            {filteredPatients.length === 0 && (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">
                  No patients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">

          <div className="bg-white p-6 rounded-2xl shadow-xl w-96">
            <h3 className="text-lg font-semibold mb-4">
              Are you sure?
            </h3>

            <p className="text-gray-600 mb-6">
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl border"
              >
                Cancel
              </button>

              <button
                onClick={() =>
                  handleAction(confirmAction.type, confirmAction.id)
                }
                className="px-4 py-2 rounded-xl bg-red-600 text-white"
              >
                Confirm
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default AdminPatients;