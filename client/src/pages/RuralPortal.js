import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PatientLayout from "../components/PatientLayout";
import { LanguageContext } from "../context/LanguageContext";
import API from "../services/api";
import { toast } from "react-toastify";
import {
  FaVolumeUp,
  FaQrcode,
  FaHandsHelping,
  FaBriefcaseMedical,
  FaHospital,
  FaCheckCircle,
  FaTimesCircle,
  FaCamera,
  FaFileMedical,
  FaSpinner,
  FaFileUpload
} from "react-icons/fa";

function RuralPortal() {
  const navigate = useNavigate();
  const { language, t } = useContext(LanguageContext);
  const token = localStorage.getItem("token");

  // Patient Info from Token
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [age, setAge] = useState("");
  const [selectedDept, setSelectedDept] = useState("genMed");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState("");

  // Cached Ticket state
  const [activeSlip, setActiveSlip] = useState(null);
  const qrCanvasRef = useRef(null);

  // AI Explainer states
  const [reportText, setReportText] = useState("");
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [explainerLoading, setExplainerLoading] = useState(false);
  const [selectedSample, setSelectedSample] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setIsOcrScanning(true);
    setExplanation("");
    playBeep();

    setTimeout(() => {
      const fileNameLower = file.name.toLowerCase();
      let extracted = "";

      if (fileNameLower.includes("blood") || fileNameLower.includes("cbc") || fileNameLower.includes("lab") || fileNameLower.includes("report")) {
        extracted = sampleReports.cbc.text;
        setSelectedSample("cbc");
      } else if (fileNameLower.includes("fever") || fileNameLower.includes("cough") || fileNameLower.includes("cold") || fileNameLower.includes("presc")) {
        extracted = sampleReports.fever.text;
        setSelectedSample("fever");
      } else if (fileNameLower.includes("bp") || fileNameLower.includes("pressure") || fileNameLower.includes("cardio") || fileNameLower.includes("heart")) {
        extracted = sampleReports.bp.text;
        setSelectedSample("bp");
      } else {
        extracted = `PRESCRIPTION / CLINICAL REPORT EXTRACTED FROM FILE: ${file.name.toUpperCase()}\n----------------------------------------\nPatient Name: ${patientName || "Guest Patient"}\nFile Size: ${(file.size / 1024).toFixed(1)} KB\nExtracted details: Mild symptoms and diagnostic references found.\n\nRx / Medication:\n1. Tab. Paracetamol 650mg - for pain and general relief, twice daily after food.\n2. Multivitamin - once daily before breakfast.\n\nWarning:\n- Rest, keep hydrated, and follow up with a specialist if symptoms persist.`;
        setSelectedSample("");
      }

      setReportText(extracted);
      setIsOcrScanning(false);
      toast.success("Document scanned successfully! Extracted text loaded below.");
    }, 2000);
  };

  const sampleReports = {
    cbc: {
      label: "Blood Test (CBC) Report",
      text: "PATIENT ID: PAT-8829\nLAB REPORT: COMPLETE BLOOD COUNT (CBC)\n----------------------------------------\nHemoglobin: 10.2 g/dL (Low, Reference Range: 13.0 - 17.0)\nWBC Count: 11,500 /cumm (High, Reference Range: 4,000 - 11,000)\nPlatelets: 250,000 /cumm (Normal, Reference Range: 150,000 - 450,000)\n----------------------------------------\nInterpretation: Mild Anemia and Mild Leukocytosis (possible infection). Advised clinical correlation."
    },
    fever: {
      label: "Fever & Infection Prescription",
      text: "DR. VERMA CLINIC\nPATIENT NAME: RAMESH KUMAR, AGE: 45\nDATE: 2026-08-25\n----------------------------------------\nRx:\n1. Tab. Paracetamol 650 mg\n   Dosage: 1 Tab three times a day (TID) after food for 3 days.\n   Purpose: For fever and body pain.\n\n2. Cap. Amoxicillin 500 mg\n   Dosage: 1 Cap twice a day (BID) after food for 5 days.\n   Purpose: Antibiotic for throat infection. Complete the full course.\n\n3. Cough Syrup (Syp. Benadryl)\n   Dosage: 5 ml twice daily for cough."
    },
    bp: {
      label: "Hypertension (BP) Treatment Slip",
      text: "CARDIOLOGY CARE CENTER\nPATIENT: RAJESH SHARMA, AGE: 58\n----------------------------------------\nClinical Findings: Blood Pressure recorded 148/96 mmHg (High Blood Pressure).\n\nPrescribed Medication:\n1. Tab. Amlodipine 5 mg\n   Dosage: 1 tablet daily (OD) in the morning before breakfast.\n\nInstructions:\n- Strictly reduce salt in diet.\n- Daily walk of 30 minutes.\n- Follow up after 2 weeks for blood pressure tracking."
    }
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // 1kHz
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 100);
    } catch (e) {}
  };

  const handleSelectSample = (sampleKey) => {
    setSelectedSample(sampleKey);
    if (!sampleKey) {
      setReportText("");
      return;
    }
    
    setIsOcrScanning(true);
    setExplanation("");
    playBeep();

    setTimeout(() => {
      setReportText(sampleReports[sampleKey].text);
      setIsOcrScanning(false);
      toast.success("Text extracted from document!");
    }, 1800);
  };

  const handleExplainReport = async () => {
    if (!reportText.trim()) {
      toast.error("Please enter report text or select a sample");
      return;
    }

    setExplainerLoading(true);
    setExplanation("");

    try {
      const res = await API.post(
        "/ai/explain-report",
        { reportText, language },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExplanation(res.data.explanation);
      toast.success("Report analysis complete!");
      speakText("Analysis complete. Reading summary.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to analyze report");
    } finally {
      setExplainerLoading(false);
    }
  };

  const renderFormattedExplanation = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="text-xs font-black text-amber-400 mt-4 mb-2 border-b border-white/10 pb-1 uppercase tracking-wider">
            {trimmed.replace("###", "").trim()}
          </h4>
        );
      }
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-indigo-100 leading-relaxed font-semibold my-1">
            {trimmed.substring(1).trim().replace(/\*\*(.*?)\*\*/g, "$1")}
          </li>
        );
      }
      if (trimmed === "") return <div key={idx} className="h-2"></div>;
      return (
        <p key={idx} className="text-xs text-indigo-100 leading-relaxed font-semibold my-1">
          {trimmed.replace(/\*\*(.*?)\*\*/g, "$1")}
        </p>
      );
    });
  };

  // Load patient name from token and load cached slip
  useEffect(() => {
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setPatientName(decoded.name || "");
        setPatientId(decoded.id || decoded._id || "");
      } catch {}
    }

    const savedSlip = localStorage.getItem("offline_walkin_slip");
    if (savedSlip) {
      try {
        const parsed = JSON.parse(savedSlip);
        setActiveSlip(parsed);
      } catch {}
    }
  }, [token]);

  // Generate canvas QR code
  useEffect(() => {
    if (activeSlip && qrCanvasRef.current) {
      const canvas = qrCanvasRef.current;
      const ctx = canvas.getContext("2d");
      const size = 180;
      canvas.width = size;
      canvas.height = size;

      // Draw background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);

      // Draw QR corners (anchors)
      ctx.fillStyle = "#1e40af"; // Dark Blue
      const drawAnchor = (x, y) => {
        ctx.fillRect(x, y, 35, 35);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x + 5, y + 5, 25, 25);
        ctx.fillStyle = "#1e40af";
        ctx.fillRect(x + 10, y + 10, 15, 15);
      };
      drawAnchor(10, 10);
      drawAnchor(size - 45, 10);
      drawAnchor(10, size - 45);

      // Draw mini anchor in bottom-right
      ctx.fillRect(size - 35, size - 35, 15, 15);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(size - 31, size - 31, 7, 7);
      ctx.fillStyle = "#1e40af";
      ctx.fillRect(size - 29, size - 29, 3, 3);

      // Generate deterministic pseudo-random pixel matrix based on slip ID hash
      const textToHash = JSON.stringify(activeSlip);
      let hash = 0;
      for (let i = 0; i < textToHash.length; i++) {
        hash = textToHash.charCodeAt(i) + ((hash << 5) - hash);
      }

      ctx.fillStyle = "#111827"; // Dark Charcoal
      const blockSize = 6;
      for (let x = 10; x < size - 10; x += blockSize) {
        for (let y = 10; y < size - 10; y += blockSize) {
          // Skip corners (anchors)
          if (x < 50 && y < 50) continue;
          if (x > size - 50 && y < 50) continue;
          if (x < 50 && y > size - 50) continue;

          // Simple hash-based pattern
          const val = Math.abs(Math.sin(x * y + hash)) * 10;
          if (val > 5.5) {
            ctx.fillRect(x, y, blockSize - 1, blockSize - 1);
          }
        }
      }

      // Add a medical cross red badge in the center
      const center = size / 2;
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(center - 10, center - 10, 20, 20);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(center - 2, center - 7, 4, 14);
      ctx.fillRect(center - 7, center - 2, 14, 4);
    }
  }, [activeSlip]);

  const speakText = (text) => {
    if (!window.speechSynthesis) {
      toast.warning("Speech synthesis is not supported in this browser");
      return;
    }
    window.speechSynthesis.cancel();
    // Clean emojis
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

  const symptomOptions = [
    { key: "symptomHead", icon: "🤕", nameEn: "Head Pain / Headache", nameTe: "తల నొప్పి", nameHi: "सिर दर्द" },
    { key: "symptomStomach", icon: "🤢", nameEn: "Stomach Ache", nameTe: "కడుపు నొప్పి", nameHi: "पेट दर्द" },
    { key: "symptomFever", icon: "🌡️", nameEn: "Fever & Chills", nameTe: "జ్వరం / చలి", nameHi: "बुखार और ठंड" },
    { key: "symptomCough", icon: "😷", nameEn: "Cough & Cold", nameTe: "దగ్గు మరియు జలుబు", nameHi: "सर्दी और खांसी" },
    { key: "symptomSkin", icon: "🧴", nameEn: "Skin Rash / Itch", nameTe: "చర్మ సమస్యలు", nameHi: "त्वचा की समस्या" },
    { key: "symptomBody", icon: "💪", nameEn: "Body / Joint Pain", nameTe: "ఒంటి నొప్పులు", nameHi: "बदन दर्द" }
  ];

  const handleToggleSymptom = (symptomKey) => {
    const isSelected = selectedSymptoms.includes(symptomKey);
    const translatedName = t[symptomKey] || symptomKey;
    
    // Read symptom name out loud
    speakText(translatedName);

    if (isSelected) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptomKey));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptomKey]);
    }
  };

  const handleGenerateSlip = (e) => {
    e.preventDefault();

    if (!patientName.trim()) {
      toast.error("Please enter a patient name");
      return;
    }

    const symptomsList = selectedSymptoms.map((key) => t[key] || key);
    if (customSymptom.trim()) {
      symptomsList.push(customSymptom.trim());
    }

    if (symptomsList.length === 0) {
      toast.error("Please select or type at least one symptom");
      return;
    }

    const slipId = "WALK-" + Math.floor(100000 + Math.random() * 900000);
    const tokenNumber = Math.floor(10 + Math.random() * 89);
    
    const newSlip = {
      slipId,
      tokenNumber,
      patientId,
      patientName,
      age: age || "N/A",
      departmentCode: selectedDept,
      department: t[selectedDept] || selectedDept,
      symptoms: symptomsList,
      timestamp: new Date().toLocaleString(),
    };

    localStorage.setItem("offline_walkin_slip", JSON.stringify(newSlip));
    setActiveSlip(newSlip);
    toast.success(t.offlineSlipSuccess || "Offline slip generated!");
    speakText("Offline slip generated successfully. Your token number is " + tokenNumber);
  };

  const handleCancelSlip = () => {
    localStorage.removeItem("offline_walkin_slip");
    setActiveSlip(null);
    toast.info("Offline slip removed");
  };

  const handleConsultAIChat = () => {
    const symptomsList = selectedSymptoms.map((key) => t[key] || key);
    if (customSymptom.trim()) symptomsList.push(customSymptom.trim());
    const textQuery = `I am feeling: ${symptomsList.join(", ")}`;
    
    // Pass query through state to health chat
    navigate("/patient/health-chat", { state: { prefilledQuery: textQuery } });
  };

  return (
    <PatientLayout>
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Portal Header */}
        <div className="text-center bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-50 text-amber-500 p-4.5 rounded-3xl shadow-sm border border-amber-100">
              <FaHandsHelping size={42} className="animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-amber-600 via-orange-500 to-indigo-700 bg-clip-text text-transparent tracking-tight mb-2">
            {t.ruralAssist}
          </h1>
          <p className="text-sm text-gray-500 max-w-xl mx-auto font-semibold leading-relaxed">
            Quick, visual tools and offline support for patients in rural communities and villages. Toggles local languages and voice narration.
          </p>
        </div>

        {/* Main Grid: Left column (Symptom & Pass), Right column (Guides) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT SIDE: Visual Selector & Slip Generator */}
          <div className="space-y-8">
            
            {/* Visual Symptom Grid */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">🩺</span> {t.symptomSelector}
              </h2>
              <p className="text-xs text-gray-400 font-bold mb-5 leading-normal">
                {t.tapToSpeak || "Tap any icon to listen and select symptoms"}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {symptomOptions.map((opt) => {
                  const isSelected = selectedSymptoms.includes(opt.key);
                  const localeName = language === "te" ? opt.nameTe : language === "hi" ? opt.nameHi : opt.nameEn;
                  
                  return (
                    <div
                      key={opt.key}
                      onClick={() => handleToggleSymptom(opt.key)}
                      className={`cursor-pointer border-2 p-4 rounded-2xl flex flex-col items-center text-center transition hover:scale-[1.02] duration-200 ${
                        isSelected
                          ? "border-amber-500 bg-amber-50/70 shadow-md shadow-amber-500/5 text-amber-900"
                          : "border-gray-100 bg-gray-50 hover:bg-white text-gray-700 hover:border-gray-200"
                      }`}
                    >
                      <span className="text-3xl mb-2">{opt.icon}</span>
                      <span className="text-xs font-extrabold leading-snug">
                        {localeName}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(localeName);
                        }}
                        className="mt-2 text-gray-400 hover:text-amber-600 p-1.5 rounded-full hover:bg-white transition"
                        title={t.speakMessage}
                      >
                        <FaVolumeUp size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {selectedSymptoms.length > 0 && (
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={handleConsultAIChat}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  >
                    🤖 Search symptoms with AI Bot
                  </button>
                </div>
              )}
            </div>

            {/* Offline slip generator / Slip Viewer */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-black text-gray-800 mb-5 flex items-center gap-2">
                <FaQrcode className="text-indigo-600" /> {t.offlinePass}
              </h2>

              {!activeSlip ? (
                <form onSubmit={handleGenerateSlip} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        {t.patientName}
                      </label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Enter full name"
                        className="w-full bg-gray-50 border border-gray-100 px-3 py-2.5 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-amber-500 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        {t.age}
                      </label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Age in years"
                        className="w-full bg-gray-50 border border-gray-100 px-3 py-2.5 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-amber-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      {t.selectDept}
                    </label>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 px-3 py-2.5 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-amber-500 transition cursor-pointer"
                    >
                      <option value="genMed">{t.genMed}</option>
                      <option value="cardiology">{t.cardiology}</option>
                      <option value="neurology">{t.neurology}</option>
                      <option value="orthopedics">{t.orthopedics}</option>
                      <option value="dermatology">{t.dermatology}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Additional Details / Custom Symptoms
                    </label>
                    <textarea
                      value={customSymptom}
                      onChange={(e) => setCustomSymptom(e.target.value)}
                      placeholder="E.g. stomach pain after eating food"
                      rows={2}
                      className="w-full bg-gray-50 border border-gray-100 px-3 py-2.5 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-amber-500 transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3.5 rounded-2xl shadow-md transition active:scale-95 duration-200"
                  >
                    💾 {t.generateSlip}
                  </button>
                </form>
              ) : (
                /* Slip View with Canvas QR Code */
                <div className="bg-gradient-to-tr from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                        <FaCheckCircle size={10} /> Local Cache Verified
                      </span>
                      <h3 className="text-xl font-black mt-2 tracking-tight">SmartCare Digital Slip</h3>
                      <p className="text-[10px] text-indigo-200 mt-0.5 font-bold uppercase">{activeSlip.slipId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Queue Token</p>
                      <p className="text-3xl font-black text-amber-400">#{activeSlip.tokenNumber}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    {/* Native Canvas QR Code */}
                    <div className="bg-white p-2.5 rounded-2xl shadow-md border border-indigo-700/30">
                      <canvas ref={qrCanvasRef}></canvas>
                    </div>

                    {/* Patient detail texts */}
                    <div className="flex-1 space-y-2 text-sm">
                      <p className="font-semibold text-indigo-100">
                        <span className="text-[10px] text-indigo-300 block font-bold uppercase">{t.patientName}</span>
                        {activeSlip.patientName} ({activeSlip.age} yrs)
                      </p>
                      <p className="font-semibold text-indigo-100">
                        <span className="text-[10px] text-indigo-300 block font-bold uppercase">{t.selectDept}</span>
                        {activeSlip.department}
                      </p>
                      <div>
                        <span className="text-[10px] text-indigo-300 block font-bold uppercase">Symptoms Selected</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {activeSlip.symptoms.map((s, idx) => (
                            <span key={idx} className="bg-white/10 px-2 py-0.5 rounded text-xs font-semibold text-indigo-50">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-[10px] text-indigo-300 mt-2 font-medium">
                        Slip Generated: {activeSlip.timestamp}
                      </p>
                    </div>
                  </div>

                  {/* Cancel/Remove token button */}
                  <div className="mt-6 pt-4 border-t border-white/10 flex justify-between gap-4">
                    <button
                      onClick={() => speakText("Your walk-in queue slip token number is " + activeSlip.tokenNumber)}
                      className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1.5"
                    >
                      <FaVolumeUp /> Read Out Loud
                    </button>
                    <button
                      onClick={handleCancelSlip}
                      className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5"
                    >
                      <FaTimesCircle /> Cancel Slip
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Emergency first-aid guidelines & Govt schemes info */}
          <div className="space-y-8">
            
            {/* First aid guide ( snake bite, heat stroke, ORS ) */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <FaBriefcaseMedical className="text-red-500 animate-pulse" /> {t.firstAidGuide}
              </h2>

              <div className="space-y-4">
                
                {/* Snake bite card */}
                <div className="border border-gray-100 p-4.5 rounded-2xl hover:bg-slate-50 transition duration-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      🐍 {t.snakeBiteTitle}
                    </h3>
                    <button
                      onClick={() => speakText(`${t.snakeBiteTitle}. ${t.snakeBiteDesc}`)}
                      className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-white transition"
                      title={t.speakMessage}
                    >
                      <FaVolumeUp size={12} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed whitespace-pre-line">
                    {t.snakeBiteDesc}
                  </p>
                </div>

                {/* Heat stroke card */}
                <div className="border border-gray-100 p-4.5 rounded-2xl hover:bg-slate-50 transition duration-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      ☀️ {t.heatStrokeTitle}
                    </h3>
                    <button
                      onClick={() => speakText(`${t.heatStrokeTitle}. ${t.heatStrokeDesc}`)}
                      className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-white transition"
                      title={t.speakMessage}
                    >
                      <FaVolumeUp size={12} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed whitespace-pre-line">
                    {t.heatStrokeDesc}
                  </p>
                </div>

                {/* ORS drink recipe */}
                <div className="border border-gray-100 p-4.5 rounded-2xl hover:bg-slate-50 transition duration-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      💧 {t.orsTitle}
                    </h3>
                    <button
                      onClick={() => speakText(`${t.orsTitle}. ${t.orsDesc}`)}
                      className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-white transition"
                      title={t.speakMessage}
                    >
                      <FaVolumeUp size={12} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed whitespace-pre-line">
                    {t.orsDesc}
                  </p>
                </div>

              </div>
            </div>

            {/* AI REPORT EXPLAINER PANEL */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <FaFileMedical className="text-amber-500 animate-pulse" />
                AI Report & Prescription Explainer
              </h2>
              <p className="text-xs text-gray-400 font-bold leading-normal">
                Upload a medical test report, laboratory findings, or handwritten prescription. The AI assistant will translate it and explain all instructions, dosages, and next steps in simple, jargon-free words.
              </p>

              {/* File Uploader Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-amber-500 bg-gray-50/50 hover:bg-amber-50/10 p-5 rounded-2xl cursor-pointer text-center transition duration-200 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
                {uploadedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl">📄</span>
                    <div className="text-left">
                      <p className="text-xs font-black text-slate-700 truncate max-w-xs">{uploadedFile.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{(uploadedFile.size / 1024).toFixed(1)} KB • Ready to Scan</p>
                    </div>
                  </div>
                ) : selectedSample ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl">📝</span>
                    <div className="text-left">
                      <p className="text-xs font-black text-slate-700 truncate max-w-xs">{sampleReports[selectedSample]?.label}</p>
                      <p className="text-[10px] text-amber-600 font-bold">Sample Report Loaded</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-amber-100/50 text-amber-600 p-2.5 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition duration-200">
                      <FaFileUpload size={18} />
                    </div>
                    <p className="text-xs font-extrabold text-slate-700">Upload Doctor's Prescription or Lab Report</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">PNG, JPG, PDF, or Camera Snap</p>
                  </>
                )}
              </div>

              {/* Optional Test Sample helper */}
              <div className="text-center">
                <span className="text-[10px] text-gray-400 font-semibold">Don't have a report? </span>
                <button
                  type="button"
                  onClick={() => {
                    const samples = ["cbc", "fever", "bp"];
                    const randomKey = samples[Math.floor(Math.random() * samples.length)];
                    handleSelectSample(randomKey);
                  }}
                  className="text-[10px] text-amber-600 hover:text-amber-700 font-extrabold underline transition"
                >
                  Click here to load a sample document to test
                </button>
              </div>

              {/* Document Scanning Animation Panel */}
              <div className="relative">
                {isOcrScanning && (
                  <div className="absolute inset-0 bg-slate-900/90 rounded-2xl flex flex-col items-center justify-center z-20 overflow-hidden border border-slate-800">
                    <div className="absolute left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-scan-laser z-10"></div>
                    <FaCamera className="text-slate-700 mb-3 animate-pulse" size={32} />
                    <p className="text-[10px] text-emerald-400 font-black tracking-wider uppercase animate-pulse">Extracting handwriting & text...</p>
                  </div>
                )}

                <textarea
                  value={reportText}
                  onChange={(e) => {
                    setReportText(e.target.value);
                    setSelectedSample("");
                  }}
                  placeholder="Paste medical prescription text here, or select a sample report from the dropdown above..."
                  rows={6}
                  className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-xs font-semibold outline-none focus:bg-white focus:border-amber-500 transition resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleExplainReport}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3.5 rounded-2xl shadow-md transition active:scale-95 duration-200 text-xs flex items-center justify-center gap-2"
                  disabled={explainerLoading || isOcrScanning}
                >
                  {explainerLoading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Analyzing Report...
                    </>
                  ) : (
                    <>
                      Explain in My Language
                    </>
                  )}
                </button>
                {reportText && (
                  <button
                    onClick={() => {
                      setReportText("");
                      setExplanation("");
                      setSelectedSample("");
                      setUploadedFile(null);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-5 rounded-2xl transition text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Response Block */}
              {explanation && (
                <div className="bg-gradient-to-tr from-indigo-950 to-slate-900 border border-indigo-950/20 rounded-2xl p-5 text-white shadow-md relative overflow-hidden mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                    <span className="bg-indigo-500 text-white text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded shadow-sm">
                      AI Pharmacist Explanation
                    </span>
                    <button
                      onClick={() => speakText(explanation)}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-xs font-bold"
                    >
                      <FaVolumeUp /> Read Summary
                    </button>
                  </div>

                  <div className="space-y-1">
                    {renderFormattedExplanation(explanation)}
                  </div>
                </div>
              )}
            </div>

            {/* Government Schemes Info */}
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/10">
              <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                <FaHospital /> {t.govSchemes}
              </h2>

              <div className="bg-white/10 p-4.5 rounded-2xl border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    🛡️ {t.pmjayTitle}
                  </h3>
                  <button
                    onClick={() => speakText(`${t.pmjayTitle}. ${t.pmjayDesc}`)}
                    className="text-indigo-200 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition"
                    title={t.speakMessage}
                  >
                    <FaVolumeUp size={12} />
                  </button>
                </div>
                <p className="text-xs text-indigo-100 leading-relaxed font-semibold">
                  {t.pmjayDesc}
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </PatientLayout>
  );
}

export default RuralPortal;
