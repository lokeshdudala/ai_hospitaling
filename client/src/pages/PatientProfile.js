import { useEffect, useState } from "react";
import PatientLayout from "../components/PatientLayout";
import API from "../services/api";
import { toast } from "react-toastify";
import { FaUpload, FaSave } from "react-icons/fa";

function PatientProfile() {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    address: "",
    emergencyContact: "",
    profileImage: "",
  });

  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await API.get("/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setForm(res.data);
        setPreview(res.data.profileImage);
      } catch {
        toast.error("Failed to load profile");
      }
    };

    loadProfile();
  }, [token]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setForm({ ...form, profileImage: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await API.put("/users/profile", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Profile updated successfully");
    } catch {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PatientLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center md:text-left mb-6">
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent tracking-tight">
            Patient Profile
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Manage your personal data, emergency contacts, and portal settings.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
          
          {/* Avatar Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
            <div className="relative group w-28 h-28 rounded-full overflow-hidden border-2 border-blue-500 shadow-md">
              <img
                src={preview || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"}
                alt="profile"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
            
            <div className="text-center sm:text-left space-y-2">
              <h4 className="font-bold text-gray-800 text-lg">Profile Avatar</h4>
              <p className="text-xs text-gray-400 font-medium">JPEG or PNG. Max size 5MB.</p>
              
              <label className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition">
                <FaUpload size={12} />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address (Read-only)</label>
              <input
                type="email"
                value={form.email}
                disabled
                className="w-full p-3 bg-gray-100 border border-gray-200 rounded-2xl outline-none text-sm text-gray-400 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone Number</label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 font-medium appearance-none"
              >
                <option value="">Select Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Blood Group</label>
              <input
                type="text"
                placeholder="O+ / A- / AB+"
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Emergency Contact</label>
              <input
                type="text"
                placeholder="Name or Phone number"
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Permanent Address</label>
              <textarea
                placeholder="Street address, city, state, zip code"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={3}
                className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 font-medium resize-none"
              />
            </div>

          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl shadow-md shadow-blue-500/10 transition flex items-center gap-2 text-sm disabled:opacity-50 active:scale-95 duration-200"
            >
              <FaSave size={14} />
              {loading ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>

        </div>

      </div>
    </PatientLayout>
  );
}

export default PatientProfile;