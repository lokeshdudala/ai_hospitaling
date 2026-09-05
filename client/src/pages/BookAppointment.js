import { useEffect, useState } from "react";
import PatientLayout from "../components/PatientLayout";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaCalendarAlt,
  FaUserMd,
  FaCreditCard,
  FaCalendarCheck,
  FaUserShield,
  FaArrowLeft,
  FaLock,
  FaMobileAlt,
  FaQrcode,
  FaCheckCircle,
} from "react-icons/fa";

function BookAppointment() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [currentStep, setCurrentStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card' or 'upi'
  const [selectedUpiApp, setSelectedUpiApp] = useState("gpay"); // 'gpay', 'phonepe', 'paytm'
  const [upiId, setUpiId] = useState("");
  const [cardForm, setCardForm] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  
  const [showPinScreen, setShowPinScreen] = useState(false);
  const [paymentPin, setPaymentPin] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccessDone, setPaymentSuccessDone] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await API.get("/doctors", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoctors(res.data);
      } catch {
        toast.error("Failed to load doctors");
      }
    };
    fetchDoctors();
  }, [token]);

  const selectDoctorAndAdvance = (doc) => {
    setSelectedDoctor(doc);
    setSlots([]);
    setSelectedSlot(null);
    setCurrentStep(2);
    toast.info(`Selected ${doc.name}. Now choose a date!`);
  };

  const checkAvailability = async () => {
    if (!selectedDoctor || !date) {
      toast.warning("Please select a doctor and date first");
      return;
    }

    try {
      setLoadingSlots(true);
      const res = await API.get(
        `/appointments/doctor/${selectedDoctor._id}?date=${date}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSlots(res.data);
      setSelectedSlot(null);

      if (res.data.length === 0) {
        toast.info("No slots available on this day. Try another date!");
      } else {
        setCurrentStep(3);
        toast.success("Slots loaded! Choose a timing to confirm.");
      }
    } catch {
      toast.error("Failed to check availability");
    } finally {
      setLoadingSlots(false);
    }
  };

  // Triggered when payment is approved via PIN
  const handlePaymentAndBooking = async () => {
    try {

      await API.post(
        "/appointments",
        {
          doctor: selectedDoctor._id,
          date,
          time: selectedSlot,
          problem: "General Consultation via Portal",
          paymentStatus: "paid",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPaymentSuccessDone(true);
      setTimeout(() => {
        toast.success("Appointment booked successfully 🎉");
        navigate("/patient");
      }, 2500);

    } catch (error) {
      toast.error(error.response?.data?.message || "Booking failed");
      setShowPinScreen(false);
      setProcessingPayment(false);
    }
  };

  const handlePayClick = (e) => {
    e.preventDefault();
    if (paymentMethod === "upi" && !upiId.includes("@")) {
      toast.warning("Please enter a valid UPI ID (e.g. name@okaxis)");
      return;
    }
    if (paymentMethod === "card" && (cardForm.number.length < 16 || cardForm.cvv.length < 3)) {
      toast.warning("Please enter complete card details");
      return;
    }
    setShowPinScreen(true);
  };

  const submitPaymentPin = (e) => {
    e.preventDefault();
    if (paymentPin.length < 4) {
      toast.warning("PIN must be at least 4 digits");
      return;
    }
    setProcessingPayment(true);
    
    // Simulate transaction delay
    setTimeout(() => {
      handlePaymentAndBooking();
    }, 2000);
  };

  return (
    <PatientLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Title */}
        {currentStep < 4 && (
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              Schedule Appointment
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Book an appointment with our specialists in 3 simple steps.
            </p>
          </div>
        )}

        {/* Step Progress Header */}
        {currentStep < 4 && (
          <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              {/* Step 1 */}
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2.5 focus:outline-none group text-left"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition ${
                  currentStep >= 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-400'
                }`}>
                  1
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Step 1</p>
                  <p className={`text-xs font-black transition ${currentStep === 1 ? 'text-blue-600' : 'text-gray-700'}`}>Specialist</p>
                </div>
              </button>

              <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-100'}`}></div>

              {/* Step 2 */}
              <button
                onClick={() => selectedDoctor && setCurrentStep(2)}
                disabled={!selectedDoctor}
                className="flex items-center gap-2.5 focus:outline-none group text-left disabled:opacity-50"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition ${
                  currentStep >= 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-400'
                }`}>
                  2
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Step 2</p>
                  <p className={`text-xs font-black transition ${currentStep === 2 ? 'text-blue-600' : 'text-gray-700'}`}>Pick Date</p>
                </div>
              </button>

              <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-100'}`}></div>

              {/* Step 3 */}
              <button
                onClick={() => selectedDoctor && date && slots.length > 0 && setCurrentStep(3)}
                disabled={!selectedDoctor || !date || slots.length === 0}
                className="flex items-center gap-2.5 focus:outline-none group text-left disabled:opacity-50"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition ${
                  currentStep >= 3 ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-400'
                }`}>
                  3
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Step 3</p>
                  <p className={`text-xs font-black transition ${currentStep === 3 ? 'text-blue-600' : 'text-gray-700'}`}>Checkout</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Select Doctor */}
        {currentStep === 1 && (
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-black text-gray-800 mb-5 flex items-center gap-2">
              Select Specialist Doctor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {doctors.map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => selectDoctorAndAdvance(doc)}
                  className={`group p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                    selectedDoctor?._id === doc._id
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]"
                      : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-md hover:shadow-gray-100 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-4.5 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${
                      selectedDoctor?._id === doc._id
                        ? "bg-white/20 text-white"
                        : "bg-blue-50 text-blue-600"
                    }`}>
                      {doc.name ? doc.name[0] : "Dr."}
                    </div>
                    <div>
                      <h4 className="font-bold text-base leading-snug group-hover:underline">
                        {doc.name}
                      </h4>
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 mt-1 rounded-full ${
                        selectedDoctor?._id === doc._id
                          ? "bg-white/15 text-white border border-white/10"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {doc.specialization}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-50/10 mt-2">
                    <span className="text-xs opacity-75 font-semibold">Consultation Fee</span>
                    <span className="font-black text-lg">₹{doc.fee}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Choose Date */}
        {currentStep === 2 && selectedDoctor && (
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-50">
              <h3 className="text-lg font-black text-gray-800">
                Choose Appointment Date
              </h3>
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 font-bold"
              >
                <FaArrowLeft /> Change Doctor
              </button>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                {selectedDoctor.name[0]}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Selected Specialist</p>
                <p className="font-bold text-sm text-gray-700">{selectedDoctor.name} ({selectedDoctor.specialization})</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <FaCalendarAlt size={16} />
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSlots([]);
                    setSelectedSlot(null);
                  }}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none text-sm transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 font-semibold"
                />
              </div>
              <button
                onClick={checkAvailability}
                disabled={!date || loadingSlots}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl shadow-md shadow-blue-500/10 transition active:scale-95 duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingSlots ? "Checking..." : "Search Available Slots"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Choose Timing & Checkout */}
        {currentStep === 3 && selectedDoctor && date && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                <h3 className="text-lg font-black text-gray-800">
                  Select Time Slot
                </h3>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 font-bold"
                >
                  <FaArrowLeft /> Change Date
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {slots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-3.5 px-4 rounded-2xl font-bold text-sm border transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                      selectedSlot === slot
                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25 scale-[1.02]"
                        : "bg-white text-gray-700 border-gray-100 hover:border-blue-200"
                    }`}
                  >
                    <span className="text-xs opacity-75 uppercase">Slot {index + 1}</span>
                    <span className="text-base">{slot}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Invoice checkout panel */}
            {selectedSlot && (
              <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
                  
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full text-xs font-bold border border-white/10">
                      <FaUserShield size={12} className="text-emerald-400" /> Secure Booking Checkout
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">Booking Invoice Summary</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-400">
                          <FaUserMd />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase">Doctor Assigned</p>
                          <p className="font-bold">{selectedDoctor.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                          <FaCalendarCheck />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase">Date & Timing</p>
                          <p className="font-bold">{date} at {selectedSlot}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-stretch md:items-end w-full md:w-64 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
                    <div className="mb-4 text-left md:text-right">
                      <p className="text-xs text-gray-400 font-semibold uppercase">Total Consultation Fee</p>
                      <p className="text-3xl font-black text-emerald-400">₹{selectedDoctor.fee}</p>
                      <p className="text-[10px] text-gray-400 mt-1">Includes 18% hospital service charges</p>
                    </div>

                    <button
                      onClick={() => setCurrentStep(4)}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm border border-transparent hover:scale-105 active:scale-95 duration-200"
                    >
                      <FaCreditCard size={15} />
                      Proceed to Pay
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Mock Secure Payment Gateway */}
        {currentStep === 4 && selectedDoctor && selectedSlot && (
          <div className="max-w-xl mx-auto bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Payment Header */}
            <div className="bg-slate-900 text-white p-6 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaLock className="text-emerald-400" size={16} />
                  <span className="text-sm font-bold tracking-wider uppercase text-emerald-400">Secure Checkout Gateway</span>
                </div>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-xs text-slate-400 hover:text-white font-bold border border-slate-700 px-3 py-1 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
              <div className="mt-6 flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">SmartCare Billing</p>
                  <p className="text-lg font-bold">Consultation with {selectedDoctor.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Amount Payable</p>
                  <p className="text-2xl font-black text-emerald-400">₹{selectedDoctor.fee}</p>
                </div>
              </div>
            </div>

            {/* Payment Options Grid */}
            {!showPinScreen && !paymentSuccessDone && (
              <div className="p-6 sm:p-8 space-y-6">
                {/* Method selector */}
                <div className="flex border border-slate-100 p-1.5 rounded-2xl bg-slate-50/50">
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition flex justify-center items-center gap-2 ${
                      paymentMethod === "card"
                        ? "bg-white text-blue-600 shadow-sm border border-slate-100"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <FaCreditCard size={14} /> Credit/Debit Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod("upi")}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition flex justify-center items-center gap-2 ${
                      paymentMethod === "upi"
                        ? "bg-white text-blue-600 shadow-sm border border-slate-100"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <FaQrcode size={14} /> UPI Payment App
                  </button>
                </div>

                {/* Card Payment Form */}
                {paymentMethod === "card" && (
                  <form onSubmit={handlePayClick} className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Card Number</label>
                      <input
                        type="text"
                        placeholder="4532 7182 9381 2938"
                        maxLength="16"
                        required
                        value={cardForm.number}
                        onChange={(e) => setCardForm({ ...cardForm, number: e.target.value.replace(/\D/g, "") })}
                        className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm transition focus:border-blue-500 focus:bg-white font-semibold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength="5"
                          required
                          value={cardForm.expiry}
                          onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                          className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm transition focus:border-blue-500 focus:bg-white font-semibold text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">CVV Security Code</label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength="3"
                          required
                          value={cardForm.cvv}
                          onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, "") })}
                          className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm transition focus:border-blue-500 focus:bg-white font-semibold text-center"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="Johnathan Doe"
                        required
                        value={cardForm.name}
                        onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                        className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm transition focus:border-blue-500 focus:bg-white font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg transition active:scale-95 duration-200 text-sm mt-2 flex justify-center items-center gap-2"
                    >
                      <FaLock size={12} /> Pay ₹{selectedDoctor.fee} Securely
                    </button>
                  </form>
                )}

                {/* UPI Payment Form */}
                {paymentMethod === "upi" && (
                  <form onSubmit={handlePayClick} className="space-y-6 animate-in fade-in duration-200">
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedUpiApp("gpay")}
                        className={`p-3.5 border rounded-2xl flex flex-col items-center gap-2.5 transition ${
                          selectedUpiApp === "gpay"
                            ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                            : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                        }`}
                      >
                        <span className="text-xl">🟩</span>
                        <span className="text-xs font-extrabold tracking-tight">Google Pay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedUpiApp("phonepe")}
                        className={`p-3.5 border rounded-2xl flex flex-col items-center gap-2.5 transition ${
                          selectedUpiApp === "phonepe"
                            ? "bg-purple-50 border-purple-500 text-purple-700 font-bold"
                            : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                        }`}
                      >
                        <span className="text-xl">🟪</span>
                        <span className="text-xs font-extrabold tracking-tight">PhonePe</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedUpiApp("paytm")}
                        className={`p-3.5 border rounded-2xl flex flex-col items-center gap-2.5 transition ${
                          selectedUpiApp === "paytm"
                            ? "bg-cyan-50 border-cyan-500 text-cyan-700 font-bold"
                            : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                        }`}
                      >
                        <span className="text-xl">🟦</span>
                        <span className="text-xs font-extrabold tracking-tight">Paytm UPI</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">UPI Address ID</label>
                      <input
                        type="text"
                        placeholder="username@okaxis"
                        required
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm transition focus:border-blue-500 focus:bg-white font-semibold text-center"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg transition active:scale-95 duration-200 text-sm mt-2 flex justify-center items-center gap-2"
                    >
                      <FaLock size={12} /> Proceed to Pay via UPI
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* UPI / TRANSACTION PIN SCREEN OVERLAY */}
            {showPinScreen && !paymentSuccessDone && (
              <div className="p-8 text-center space-y-6 animate-in fade-in duration-300">
                <div className="mx-auto w-14 h-14 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center">
                  <FaMobileAlt size={28} />
                </div>
                
                <div>
                  <h4 className="text-lg font-black text-slate-800">Enter Payment PIN</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Please input your 4-digit UPI or card authentication PIN to approve transaction.
                  </p>
                </div>

                <form onSubmit={submitPaymentPin} className="max-w-xs mx-auto space-y-5">
                  <input
                    type="password"
                    maxLength="6"
                    placeholder="••••"
                    required
                    value={paymentPin}
                    onChange={(e) => setPaymentPin(e.target.value.replace(/\D/g, ""))}
                    disabled={processingPayment}
                    className="w-40 tracking-[1em] text-center text-xl font-bold py-3 border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-500 bg-slate-50"
                  />

                  {processingPayment ? (
                    <div className="py-2.5">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Securing Payment Channel...</p>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => { setShowPinScreen(false); setPaymentPin(""); }}
                        className="flex-1 py-3 px-4 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-2xl text-xs font-bold transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-emerald-500/10"
                      >
                        Submit PIN
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* PAYMENT SUCCESS CARD */}
            {paymentSuccessDone && (
              <div className="p-8 text-center space-y-4 animate-in zoom-in-95 duration-500 py-16">
                <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center animate-bounce">
                  <FaCheckCircle size={36} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800">Transaction Successful!</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">₹{selectedDoctor.fee} transferred to SmartCare Hospital billing accounts.</p>
                </div>
                <div className="pt-4">
                  <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Finalizing appointment booking...</p>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </PatientLayout>
  );
}

export default BookAppointment;