import React from "react";
import HealthChatBot from "../components/HealthChatBot";
import PatientLayout from "../components/PatientLayout";
import { FaRobot, FaShieldAlt, FaUserMd, FaClock } from "react-icons/fa";

function HealthChatPage() {
  return (
    <PatientLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl shadow-sm border border-blue-100">
              <FaRobot size={36} className="animate-bounce" />
            </div>
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent tracking-tight mb-2">
            AI Health Assistant
          </h1>
          <p className="text-sm text-gray-500 max-w-xl mx-auto font-semibold leading-relaxed">
            Get instant symptom checking, appointment advice, and health guidance from our advanced medical bot.
          </p>
        </div>

        {/* Features row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm text-center">
            <FaShieldAlt className="text-emerald-500 mx-auto mb-3" size={24} />
            <h3 className="font-bold text-gray-800 text-sm mb-1">Secure & Confidential</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-semibold">
              All communications are securely processed and kept completely private.
            </p>
          </div>

          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm text-center">
            <FaUserMd className="text-blue-500 mx-auto mb-3" size={24} />
            <h3 className="font-bold text-gray-800 text-sm mb-1">Specialist Routing</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-semibold">
              Detects symptoms and matches you to cardologists, dermatologists, etc.
            </p>
          </div>

          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm text-center">
            <FaClock className="text-indigo-500 mx-auto mb-3" size={24} />
            <h3 className="font-bold text-gray-800 text-sm mb-1">Instant 24/7 Access</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-semibold">
              Get slot recommendations and answers instantly at any hour of the day.
            </p>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl">
          <div className="flex items-start gap-3">
            <span className="text-lg">🚨</span>
            <div>
              <h3 className="font-bold text-amber-800 text-xs uppercase tracking-wider mb-1">Medical Disclaimer</h3>
              <p className="text-xs text-amber-700 leading-relaxed font-semibold">
                This AI assistant provides general information for booking and guidance purposes. It does not replace professional medical diagnosis or clinical treatment. If you are experiencing an emergency, please contact local emergency medical services immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Chat Interface Container */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden h-[550px]">
          <HealthChatBot isPage={true} />
        </div>

      </div>
    </PatientLayout>
  );
}

export default HealthChatPage;