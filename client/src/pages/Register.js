import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaHeartbeat, FaEnvelope, FaLock, FaUser, FaUserTag } from "react-icons/fa";
import API from "../services/api";
import { toast } from "react-toastify";

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
  });

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.warning("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await API.post("/auth/register", form);
      toast.success("Account created successfully! Please login. 🎉");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration Failed. Email might be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 items-center justify-center p-6">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-3xl opacity-20"></div>

      <div className="relative bg-white/95 backdrop-blur-lg shadow-2xl rounded-3xl border border-white/20 p-8 sm:p-10 w-full max-w-md transition-all duration-300 hover:shadow-indigo-500/10">
        
        {/* Brand/Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 text-white p-3.5 rounded-2xl shadow-lg shadow-blue-500/30 mb-3 animate-bounce duration-1000">
            <FaHeartbeat size={32} />
          </div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-blue-800 to-indigo-600 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">
            Join SmartCare Hospital Portal
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister();
          }}
          className="space-y-4"
        >
          {/* Name Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FaUser size={15} />
              </span>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 font-medium"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                value={form.name}
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FaEnvelope size={15} />
              </span>
              <input
                type="email"
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 font-medium"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                value={form.email}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FaLock size={15} />
              </span>
              <input
                type="password"
                placeholder="Min 6 characters"
                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 font-medium"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                value={form.password}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Select Profile Role
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FaUserTag size={15} />
              </span>
              <select
                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 font-medium appearance-none"
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                value={form.role}
              >
                <option value="patient">Patient (Booking & Care)</option>
                <option value="admin">Administrator (Management)</option>
              </select>
            </div>
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-blue-500/25 transition-all duration-300 transform active:scale-[0.98] hover:shadow-indigo-500/30 flex justify-center items-center mt-3"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        {/* Link to Login */}
        <div className="text-center mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-600 font-medium">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-700 font-bold transition duration-200 ml-1 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Register;