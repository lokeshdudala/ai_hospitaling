import { useEffect, useState } from "react";
import PatientLayout from "../components/PatientLayout";
import API from "../services/api";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaFilter,
  FaReceipt,
} from "react-icons/fa";

function PaymentHistory() {
  const token = localStorage.getItem("token");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await API.get("/appointments/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(res.data);
      } catch {
        toast.error("Failed to load billing history");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [token]);

  const handlePrintReceipt = (appt) => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    const docName = appt.doctor?.name || "Specialist";
    const docSpec = appt.doctor?.specialization || "Medicine";
    const date = appt.date;
    const time = appt.time;
    const fee = appt.doctor?.fee || 500;
    const problem = appt.problem || "General Consultation";
    const invoiceId = appt._id;
    const dateBooked = new Date(appt.createdAt).toLocaleDateString();
    const isPaid = appt.paymentStatus === "paid";

    const receiptHtml = `
      <html>
        <head>
          <title>SmartCare Receipt - ${invoiceId}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.5; background-color: #fafafa; }
            .receipt-card { border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.05); background-color: #ffffff; }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 24px; margin-bottom: 24px; }
            .hospital-name { font-size: 28px; font-weight: 900; color: #2563eb; margin: 0; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.1em; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
            .info-item label { font-size: 9px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; }
            .info-item p { font-size: 13px; font-weight: 700; color: #1e293b; margin: 4px 0 0 0; }
            .bill-details { border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 20px 0; margin-bottom: 28px; }
            .bill-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #475569; }
            .bill-row.total { font-size: 18px; font-weight: 900; color: ${isPaid ? '#059669' : '#b91c1c'}; border-top: 2px solid #f1f5f9; padding-top: 12px; margin-top: 12px; }
            .footer-notes { text-align: center; font-size: 10px; color: #94a3b8; border-top: 2px dashed #cbd5e1; padding-top: 24px; margin-top: 24px; }
            .paid-badge { display: inline-block; background-color: ${isPaid ? '#ecfdf5' : '#fef2f2'}; border: 1px solid ${isPaid ? '#a7f3d0' : '#fecaca'}; color: ${isPaid ? '#065f46' : '#991b1b'}; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-top: 12px; letter-spacing: 0.05em; }
            @media print {
              body { padding: 0; background-color: #ffffff; }
              .receipt-card { border: none; box-shadow: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-card">
            <div class="header">
              <h1 class="hospital-name">SmartCare Hospital</h1>
              <p class="subtitle">Digital Invoice & Medical Voucher</p>
              <div class="paid-badge">${isPaid ? 'Payment Successful (PAID)' : 'Payment Status: UNPAID'}</div>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <label>Transaction ID / Ref</label>
                <p>REF-${invoiceId.substring(0, 10).toUpperCase()}</p>
              </div>
              <div class="info-item">
                <label>Booking Date</label>
                <p>${dateBooked}</p>
              </div>
              <div class="info-item">
                <label>Assigned Specialist</label>
                <p>${docName} (${docSpec})</p>
              </div>
              <div class="info-item">
                <label>Scheduled Slot</label>
                <p>${date} at ${time}</p>
              </div>
              <div class="info-item" style="grid-column: span 2;">
                <label>Reported Symptom / Reason</label>
                <p>${problem}</p>
              </div>
            </div>

            <div class="bill-details">
              <div class="bill-row">
                <span>Doctor Consultation Charge</span>
                <span>₹${fee}</span>
              </div>
              <div class="bill-row">
                <span>Integrated GST & Hospital Levies (18%)</span>
                <span>Included</span>
              </div>
              <div class="bill-row total">
                <span>${isPaid ? 'Amount Settled' : 'Amount Due'}</span>
                <span>₹${fee}</span>
              </div>
            </div>

            <div class="footer-notes">
              <p>This is a secure system-generated medical billing slip. Validity is backed by digital database records.</p>
              <p>Thank you for choosing SmartCare Medical Center.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const filteredAppointments = appointments.filter((appt) => {
    const docName = appt.doctor?.name || "";
    const docSpec = appt.doctor?.specialization || "";
    const prob = appt.problem || "";
    
    const matchesSearch =
      docName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docSpec.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prob.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "paid" && appt.paymentStatus === "paid") ||
      (statusFilter === "unpaid" && appt.paymentStatus !== "paid");

    return matchesSearch && matchesStatus;
  });

  return (
    <PatientLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              Billing & Payments
            </h2>
            <p className="text-sm text-gray-500 font-semibold mt-1">
              View receipts, check transaction reference codes, and download invoice copies.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <FaSearch size={14} />
            </span>
            <input
              type="text"
              placeholder="Search by doctor, specialization, or symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none text-xs transition focus:border-blue-500 focus:bg-white font-semibold"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <FaFilter /> Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50/50 border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-700 rounded-xl outline-none focus:border-blue-500 transition"
            >
              <option value="all">All Statements</option>
              <option value="paid">Paid Statements</option>
              <option value="unpaid">Unpaid Statements</option>
            </select>
          </div>
        </div>

        {/* Statements List */}
        {loading ? (
          <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl shadow-sm">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-gray-400 font-semibold">Loading statement log...</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-4 pl-6">Invoice details</th>
                    <th className="py-4">Symptom Statement</th>
                    <th className="py-4">Schedule</th>
                    <th className="py-4">Amount Paid</th>
                    <th className="py-4">Status</th>
                    <th className="py-4 pr-6 text-right">Invoice Slip</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {filteredAppointments.map((appt) => {
                    const isPaid = appt.paymentStatus === "paid";
                    return (
                      <tr key={appt._id} className="hover:bg-slate-50/50 transition">
                        <td className="py-5 pl-6">
                          <div>
                            <p className="font-bold text-sm text-slate-700">
                              {appt.doctor?.name || "Consultation Fee"}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                              REF-{appt._id.substring(0, 10).toUpperCase()}
                            </p>
                          </div>
                        </td>

                        <td className="text-slate-500 text-xs max-w-[200px] truncate pr-4 font-semibold">
                          {appt.problem || "General Checkup"}
                        </td>

                        <td className="text-slate-600 text-xs font-bold">
                          <div>
                            <p>{appt.date}</p>
                            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{appt.time}</p>
                          </div>
                        </td>

                        <td className="font-black text-slate-800 text-sm">
                          ₹{appt.doctor?.fee || 500}
                        </td>

                        <td>
                          <span className={`inline-block text-[10px] font-extrabold px-3 py-1 rounded-full border uppercase ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                          }`}>
                            {isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </td>

                        <td className="py-5 pr-6 text-right">
                          <button
                            onClick={() => handlePrintReceipt(appt)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-blue-100 transition inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <FaReceipt size={11} /> Print Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-16 text-center text-gray-400 font-bold text-sm">
                        No transactions or statement records match the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </PatientLayout>
  );
}

export default PaymentHistory;
