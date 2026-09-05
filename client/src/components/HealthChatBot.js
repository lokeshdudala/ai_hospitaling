import { useState, useEffect, useRef, useContext } from "react";
import { useLocation } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import API from "../services/api";
import { toast } from "react-toastify";
import { FaRobot, FaTimes, FaPaperPlane, FaVolumeUp, FaMicrophone } from "react-icons/fa";

function HealthChatBot({ isPage = false }) {
  const { language, t } = useContext(LanguageContext);
  const token = localStorage.getItem("token");

  const [open, setOpen] = useState(!isPage); // Always open for page mode
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello 👋 I'm your AI Health Assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);

  const [stage, setStage] = useState("idle");
  const [suggestedDoctor, setSuggestedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");

  const speakText = (text) => {
    if (!window.speechSynthesis) {
      toast.warning("Speech synthesis is not supported in this browser");
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (language === "hi") {
      utterance.lang = "hi-IN";
    } else if (language === "te") {
      utterance.lang = "te-IN";
    } else {
      utterance.lang = "en-US";
    }
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.warning("Speech recognition is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    if (language === "hi") {
      recognition.lang = "hi-IN";
    } else if (language === "te") {
      recognition.lang = "te-IN";
    } else {
      recognition.lang = "en-US";
    }

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (event) => {
      console.error(event.error);
      setIsListening(false);
      toast.error("Voice input error: " + event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"];

  const getQuickDates = () => {
    const today = new Date();
    const format = (d) => d.toISOString().split("T")[0];
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);
    
    return [
      { label: "Today", value: format(today) },
      { label: "Tomorrow", value: format(tomorrow) },
      { label: "Day after", value: format(dayAfter) }
    ];
  };

  const detectSpecialization = async (text) => {
    try {
      const res = await API.post(
        "/ai/detect",
        { message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data.specialization;
    } catch {
      return null;
    }
  };

  const handleSend = async (textOverride = null) => {
    const userText = typeof textOverride === "string" ? textOverride.trim() : input.trim();
    if (!userText) return;

    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInput("");

    // Greeting
    if (greetings.includes(userText.toLowerCase())) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Hello! 👋 I'm here to help with your health concerns. Please describe your symptoms or ask me any health-related questions." },
      ]);
      return;
    }

    // YES / NO decision
    if (stage === "askBooking") {
      if (userText.toLowerCase() === "no" || userText.toLowerCase() === "no thanks") {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "No problem! Feel free to ask me anything else about your health. Take care! 😊" },
        ]);
        setStage("idle");
        return;
      }

      if (userText.toLowerCase() === "yes" || userText.toLowerCase() === "sure") {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Great! Please enter your preferred date in YYYY-MM-DD format (e.g., 2026-03-20)." },
        ]);
        setStage("askDate");
        return;
      }
    }

    // Date handling
    if (stage === "askDate") {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      if (!dateRegex.test(userText)) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Please use the correct format: YYYY-MM-DD (e.g., 2026-03-20)" },
        ]);
        return;
      }

      setSelectedDate(userText);

      try {
        const res = await API.get(
          `/appointments/doctor/${suggestedDoctor._id}?date=${userText}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.length === 0) {
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: "No available slots on that date. Please try a different date." },
          ]);
          return;
        }

        setAvailableSlots(res.data);

        let slotMessage = `Available slots on ${userText}:\n`;
        res.data.forEach((slot, i) => {
          slotMessage += `${i + 1}. ${slot}\n`;
        });
        slotMessage += "\nPlease select a slot from the options below or reply with the slot number.";

        setMessages((prev) => [...prev, { sender: "bot", text: slotMessage }]);
        setStage("askSlot");
      } catch {
        toast.error("Failed to check availability");
      }
      return;
    }

    // Slot selection
    if (stage === "askSlot") {
      let selectedSlotIndex = -1;
      const parsedNum = parseInt(userText);
      if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= availableSlots.length) {
        selectedSlotIndex = parsedNum - 1;
      } else {
        // Try fuzzy text matching
        const cleanUserText = userText.toLowerCase().replace(/[^0-9a-z]/g, "");
        selectedSlotIndex = availableSlots.findIndex((slot) => {
          const cleanSlot = slot.toLowerCase().replace(/[^0-9a-z]/g, "");
          return cleanSlot.includes(cleanUserText) || cleanUserText.includes(cleanSlot);
        });
      }

      if (selectedSlotIndex === -1 || !availableSlots[selectedSlotIndex]) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Invalid slot number or timing. Please select from the available options." },
        ]);
        return;
      }

      const slot = availableSlots[selectedSlotIndex];
      setSelectedSlot(slot);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `Perfect! Please confirm your appointment:\n\n👨‍⚕️ Doctor: ${suggestedDoctor.name}\n📅 Date: ${selectedDate}\n⏰ Time: ${slot}\n\nType "CONFIRM" or click below to book this appointment.`,
        },
      ]);

      setStage("confirmBooking");
      return;
    }

    // Final confirmation
    if (stage === "confirmBooking") {
      if (userText.toLowerCase() !== "confirm") {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: 'Please type "CONFIRM" to book the appointment or start over with a new request.' },
        ]);
        return;
      }

      try {
        await API.post(
          "/appointments",
          {
            doctor: suggestedDoctor._id,
            date: selectedDate,
            time: selectedSlot,
            problem: "Booked via AI Health Assistant",
            paymentStatus: "paid",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success("Appointment booked successfully! 🎉");

        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "✅ Your appointment has been successfully booked! The doctor will review and confirm it shortly. You'll receive a notification once confirmed.\n\nIs there anything else I can help you with?",
          },
        ]);

        // Reset state
        setStage("idle");
        setSuggestedDoctor(null);
        setSelectedDate("");
        setSelectedSlot("");
        setAvailableSlots([]);

      } catch {
        toast.error("Sorry, that slot was just booked by someone else");

        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "❌ Sorry, that time slot was just booked by another patient. Please try selecting a different slot.",
          },
        ]);
      }
      return;
    }

    // Symptom detection and general health advice
    const specialization = await detectSpecialization(userText);

    if (!specialization || specialization.toLowerCase() === "none") {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I am here to help you with your health. What symptoms or concerns are you suffering from? Once you describe your symptoms, I will recommend the right doctor and help you book an appointment.",
        },
      ]);
      return;
    }

    const doctorsRes = await API.get("/doctors", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const doctor = doctorsRes.data.find((d) =>
      d.specialization.toLowerCase().includes(specialization.toLowerCase())
    );

    if (!doctor) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "I apologize, but we don't have a specialist available for that concern right now. Our current specialists include Cardiology, Neurology, Orthopedics, and General Medicine.\n\nWould you like to consult with a General Medicine doctor instead?" },
      ]);
      return;
    }

    setSuggestedDoctor(doctor);

    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text: `Based on your description, I recommend consulting Dr. ${doctor.name}, our ${doctor.specialization} specialist.\n\nDr. ${doctor.name} has ${doctor.experience} years of experience and specializes in ${doctor.specialization.toLowerCase()}.\n\nWould you like me to help you book an appointment with Dr. ${doctor.name}? (Yes/No)`,
      },
    ]);

    setStage("askBooking");
  };

  const location = useLocation();

  useEffect(() => {
    if (isPage && location.state?.prefilledQuery) {
      handleSend(location.state.prefilledQuery);
      // Clear location state so it doesn't re-trigger on reload
      window.history.replaceState({}, document.title);
    }
  }, [location, isPage]);

  // Floating chat widget mode
  if (!isPage) {
    return (
      <>
        <div
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition-colors"
          onClick={() => setOpen(!open)}
        >
          <FaRobot size={22} />
        </div>

        {open && (
          <div className="fixed bottom-20 right-6 w-80 bg-white rounded-2xl shadow-2xl flex flex-col max-h-[500px]">
            <div className="bg-blue-600 text-white p-4 rounded-t-2xl font-semibold flex justify-between items-center">
              <span>Health Assistant 🤖</span>
              <FaTimes
                className="cursor-pointer hover:text-gray-200"
                onClick={() => setOpen(false)}
              />
            </div>

            <div className="flex-1 p-3 overflow-y-auto whitespace-pre-line">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-3 flex items-end gap-1.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "bot" && (
                    <button
                      onClick={() => speakText(msg.text)}
                      className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-gray-100 transition shadow-sm"
                      title={t.speakMessage || "Read out loud"}
                    >
                      <FaVolumeUp size={12} />
                    </button>
                  )}
                  <div
                    className={`inline-block px-3 py-2 rounded-xl max-w-[250px] ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {/* Quick Replies for Widget */}
              {stage === "askBooking" && (
                <div className="flex gap-2 justify-start mt-2 mb-2 px-1">
                  <button
                    onClick={() => handleSend("Yes")}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleSend("No")}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  >
                    No
                  </button>
                </div>
              )}

              {stage === "askDate" && (
                <div className="flex flex-wrap gap-2 justify-start mt-2 mb-2 px-1">
                  {getQuickDates().map((d, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(d.value)}
                      className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              )}

              {stage === "askSlot" && availableSlots.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-start mt-2 mb-2 px-1">
                  {availableSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend((idx + 1).toString())}
                      className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}

              {stage === "confirmBooking" && (
                <div className="flex gap-2 justify-start mt-2 mb-2 px-1">
                  <button
                    onClick={() => handleSend("CONFIRM")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-md"
                  >
                    💳 Pay ₹{suggestedDoctor?.fee} & Confirm
                  </button>
                  <button
                    onClick={() => {
                      setStage("idle");
                      setSuggestedDoctor(null);
                      setSelectedDate("");
                      setSelectedSlot("");
                      setAvailableSlots([]);
                      setMessages((prev) => [
                        ...prev,
                        { sender: "bot", text: "Booking cancelled. How else can I assist you?" }
                      ]);
                    }}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div ref={bottomRef}></div>
            </div>

            <div className="flex border-t items-center bg-white rounded-b-2xl pr-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 p-3 outline-none rounded-bl-2xl"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={startListening}
                className={`p-2 rounded-full transition ${
                  isListening ? "bg-red-100 text-red-600 animate-pulse" : "text-gray-400 hover:text-blue-600"
                }`}
                title={t.voiceInput || "Voice Input"}
              >
                <FaMicrophone size={16} />
              </button>
              <button
                onClick={() => handleSend()}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors ml-1 disabled:opacity-50"
                disabled={!input.trim()}
              >
                <FaPaperPlane size={12} />
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Full page chat mode
  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <FaRobot size={32} className="text-white" />
          <div>
            <h2 className="text-xl font-bold">AI Health Assistant</h2>
            <p className="text-sm opacity-90">Available 24/7 for your health concerns</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "bot" && (
                <button
                  onClick={() => speakText(msg.text)}
                  className="bg-white border border-gray-200 text-gray-500 hover:text-blue-600 p-2.5 rounded-2xl shadow-sm transition mt-1"
                  title={t.speakMessage || "Read out loud"}
                >
                  <FaVolumeUp size={14} />
                </button>
              )}
              <div
                className={`max-w-lg px-4 py-3 rounded-2xl ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-800 shadow-md border"
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
            </div>
          ))}
          {/* Quick Replies for Page */}
          {stage === "askBooking" && (
            <div className="flex gap-3 justify-start mt-4 mb-2 max-w-lg pl-12">
              <button
                onClick={() => handleSend("Yes")}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm"
              >
                Yes, book an appointment
              </button>
              <button
                onClick={() => handleSend("No")}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm font-semibold transition"
              >
                No, thanks
              </button>
            </div>
          )}

          {stage === "askDate" && (
            <div className="flex flex-wrap gap-2 justify-start mt-4 mb-2 max-w-lg pl-12">
              {getQuickDates().map((d, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(d.value)}
                  className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-md"
                >
                  {d.label} ({d.value})
                </button>
              ))}
            </div>
          )}

          {stage === "askSlot" && availableSlots.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-start mt-4 mb-2 max-w-lg pl-12">
              {availableSlots.map((slot, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend((idx + 1).toString())}
                  className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-md"
                >
                  {slot}
                </button>
              ))}
            </div>
          )}

          {stage === "confirmBooking" && (
            <div className="flex gap-3 justify-start mt-4 mb-2 max-w-lg pl-12">
              <button
                onClick={() => handleSend("CONFIRM")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-lg flex items-center gap-2"
              >
                💳 Pay ₹{suggestedDoctor?.fee} & Confirm Booking
              </button>
              <button
                onClick={() => {
                  setStage("idle");
                  setSuggestedDoctor(null);
                  setSelectedDate("");
                  setSelectedSlot("");
                  setAvailableSlots([]);
                  setMessages((prev) => [
                    ...prev,
                    { sender: "bot", text: "Booking cancelled. How else can I assist you?" }
                  ]);
                }}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
            </div>
          )}
          <div ref={bottomRef}></div>
        </div>
      </div>

      <div className="border-t bg-white p-4 rounded-b-2xl">
        <div className="max-w-4xl mx-auto flex gap-3 items-center">
          <input
            type="text"
            placeholder={t.describeSymptoms || "Describe your symptoms..."}
            className="flex-1 p-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={startListening}
            className={`p-3.5 rounded-xl border transition ${
              isListening
                ? "bg-red-500 border-red-500 text-white animate-pulse"
                : "bg-gray-50 border-gray-200 text-gray-500 hover:text-blue-600"
            }`}
            title={t.voiceInput || "Voice Dictation"}
          >
            <FaMicrophone size={18} />
          </button>
          <button
            onClick={() => handleSend()}
            className="bg-blue-600 text-white px-6 py-3.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={!input.trim()}
          >
            <FaPaperPlane />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default HealthChatBot;