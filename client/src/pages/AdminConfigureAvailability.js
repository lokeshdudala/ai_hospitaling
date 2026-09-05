import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import API from "../services/api";
import { toast } from "react-toastify";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function AdminConfigureAvailability() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [slotDuration, setSlotDuration] = useState(30);
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [leaveDates, setLeaveDates] = useState([]);
  const [newLeaveDate, setNewLeaveDate] = useState("");

  // Default hospital schedule
  const DEFAULT_HOSPITAL_SCHEDULE = [
    {
      day: "Monday",
      sessions: [
        { startTime: "09:00", endTime: "13:00" },
        { startTime: "14:00", endTime: "18:00" },
      ],
    },
    {
      day: "Tuesday",
      sessions: [
        { startTime: "09:00", endTime: "13:00" },
        { startTime: "14:00", endTime: "18:00" },
      ],
    },
    {
      day: "Wednesday",
      sessions: [
        { startTime: "09:00", endTime: "13:00" },
        { startTime: "14:00", endTime: "18:00" },
      ],
    },
    {
      day: "Thursday",
      sessions: [
        { startTime: "09:00", endTime: "13:00" },
        { startTime: "14:00", endTime: "18:00" },
      ],
    },
    {
      day: "Friday",
      sessions: [
        { startTime: "09:00", endTime: "13:00" },
        { startTime: "14:00", endTime: "18:00" },
      ],
    },
    {
      day: "Saturday",
      sessions: [{ startTime: "10:00", endTime: "14:00" }],
    },
  ];

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await API.get("/doctors", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const doctor = res.data.find((d) => d._id === id);

        if (doctor) {
          setSlotDuration(doctor.slotDuration || 30);
          // If doctor has schedule, use it; otherwise use default hospital schedule
          const schedule =
            doctor.weeklySchedule && doctor.weeklySchedule.length > 0
              ? doctor.weeklySchedule
              : DEFAULT_HOSPITAL_SCHEDULE;
          setWeeklySchedule(schedule);
          setLeaveDates(doctor.leaveDates || []);

          // If doctor had empty schedule, show toast hint
          if (!doctor.weeklySchedule || doctor.weeklySchedule.length === 0) {
            toast.info(
              "ℹ️ This doctor had no schedule. Default hospital hours loaded. Click 'Reset to Default' to confirm."
            );
          }
        }
      } catch {
        toast.error("Failed to load doctor");
      }
    };

       fetchDoctor();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const toggleDay = (day) => {
    const exists = weeklySchedule.find((d) => d.day === day);

    if (exists) {
      setWeeklySchedule(
        weeklySchedule.filter((d) => d.day !== day)
      );
    } else {
      setWeeklySchedule([
        ...weeklySchedule,
        { day, sessions: [{ startTime: "", endTime: "" }] },
      ]);
    }
  };

  const updateSession = (day, index, field, value) => {
    setWeeklySchedule(
      weeklySchedule.map((d) =>
        d.day === day
          ? {
              ...d,
              sessions: d.sessions.map((s, i) =>
                i === index ? { ...s, [field]: value } : s
              ),
            }
          : d
      )
    );
  };

  const addSession = (day) => {
    setWeeklySchedule(
      weeklySchedule.map((d) =>
        d.day === day
          ? {
              ...d,
              sessions: [...d.sessions, { startTime: "", endTime: "" }],
            }
          : d
      )
    );
  };

  const addLeaveDate = () => {
    if (!newLeaveDate) return;
    setLeaveDates([...leaveDates, newLeaveDate]);
    setNewLeaveDate("");
  };

  const removeLeaveDate = (date) => {
    setLeaveDates(leaveDates.filter((d) => d !== date));
  };

  const handleSave = async () => {
    // Validate all configured days have valid sessions
    for (const day of weeklySchedule) {
      for (const session of day.sessions) {
        if (!session.startTime || !session.endTime) {
          toast.error(
            `❌ ${day.day}: All sessions must have start and end times!`
          );
          return;
        }

        // Validate end time is after start time
        if (session.startTime >= session.endTime) {
          toast.error(
            `❌ ${day.day}: End time must be after start time!`
          );
          return;
        }
      }
    }

    if (weeklySchedule.length === 0) {
      toast.error("❌ Please configure at least one working day!");
      return;
    }

    try {
      await API.put(
        `/doctors/${id}/availability`,
        { slotDuration, weeklySchedule, leaveDates },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("✅ Availability updated successfully");
      navigate("/admin");
    } catch {
      toast.error("Failed to update availability");
    }
  };

  const handleResetToDefault = async () => {
    if (
      window.confirm(
        "⚠️ Reset this doctor's schedule to default hospital hours?"
      )
    ) {
      try {
        const res = await API.put(
          `/doctors/${id}/reset-schedule`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setWeeklySchedule(res.data.doctor.weeklySchedule);
        setSlotDuration(res.data.doctor.slotDuration);

        toast.success("✅ Schedule reset to default");
      } catch (error) {
        toast.error("Failed to reset schedule");
      }
    }
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">
        Configure Availability
      </h2>

      {/* Slot Duration */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h3 className="font-semibold mb-3">Slot Duration</h3>
        <select
          value={slotDuration}
          onChange={(e) => setSlotDuration(Number(e.target.value))}
          className="border p-2 rounded"
        >
          <option value={15}>15 Minutes</option>
          <option value={20}>20 Minutes</option>
          <option value={30}>30 Minutes (Standard)</option>
          <option value={45}>45 Minutes</option>
          <option value={60}>60 Minutes</option>
        </select>
      </div>

      {/* Default Schedule Info */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl mb-6">
        <h4 className="font-semibold text-blue-900 mb-2">📋 Default Hospital Schedule</h4>
        <p className="text-sm text-blue-800 mb-2">
          When adding a new doctor, this default schedule is applied:
        </p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>🕘 <strong>Mon-Fri:</strong> 9:00 AM - 1:00 PM, 2:00 PM - 6:00 PM</li>
          <li>🕙 <strong>Saturday:</strong> 10:00 AM - 2:00 PM</li>
          <li>🚫 <strong>Sunday:</strong> Closed</li>
          <li>⏱️ <strong>Slot Duration:</strong> 30 minutes</li>
        </ul>
        <p className="text-xs text-blue-700 mt-2">
          👉 You can modify below and save, or click "Reset to Default Hospital Hours" anytime.
        </p>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Weekly Schedule</h3>
          <button
            onClick={() => setWeeklySchedule(DEFAULT_HOSPITAL_SCHEDULE)}
            className="text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded"
          >
            🔄 Reset to Default Hospital Hours
          </button>
        </div>

        {days.map((day) => {
          const dayData = weeklySchedule.find((d) => d.day === day);

          return (
            <div key={day} className="mb-4 border-b pb-4">
              <label>
                <input
                  type="checkbox"
                  checked={!!dayData}
                  onChange={() => toggleDay(day)}
                  className="mr-2"
                />
                {day}
              </label>

              {dayData &&
                dayData.sessions.map((session, index) => (
                  <div key={index} className="flex gap-4 mt-2 items-center">
                    <input
                      type="time"
                      value={session.startTime}
                      onChange={(e) =>
                        updateSession(
                          day,
                          index,
                          "startTime",
                          e.target.value
                        )
                      }
                      className={`border p-2 rounded ${
                        !session.startTime ? "border-red-500 bg-red-50" : ""
                      }`}
                      placeholder="Start time"
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={session.endTime}
                      onChange={(e) =>
                        updateSession(
                          day,
                          index,
                          "endTime",
                          e.target.value
                        )
                      }
                      className={`border p-2 rounded ${
                        !session.endTime ? "border-red-500 bg-red-50" : ""
                      }`}
                      placeholder="End time"
                    />
                    {(!session.startTime || !session.endTime) && (
                      <span className="text-red-500 text-sm">⚠️ Required</span>
                    )}
                  </div>
                ))}

              {dayData && (
                <button
                  onClick={() => addSession(day)}
                  className="text-blue-600 mt-2 text-sm"
                >
                  + Add Session
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Leave Dates */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h3 className="font-semibold mb-3">Leave Dates</h3>

        <div className="flex gap-4 mb-3">
          <input
            type="date"
            value={newLeaveDate}
            onChange={(e) => setNewLeaveDate(e.target.value)}
            className="border p-2 rounded"
          />
          <button
            onClick={addLeaveDate}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>

        {leaveDates.map((date) => (
          <div key={date} className="flex justify-between mb-2">
            {date}
            <button
              onClick={() => removeLeaveDate(date)}
              className="text-red-500"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
        >
          ✅ Save Availability
        </button>
        <button
          onClick={handleResetToDefault}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl"
        >
          🔄 Reset to Default
        </button>
      </div>
    </Layout>
  );
}

export default AdminConfigureAvailability;