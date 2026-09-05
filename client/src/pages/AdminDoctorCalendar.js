import { useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import API from "../services/api";
import { toast } from "react-toastify";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

function AdminDoctorCalendar() {
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const [events, setEvents] = useState([]);

  const fetchEvents = async (start, end) => {
    try {
      const res = await API.get(
        `/doctors/${id}/calendar?start=${start}&end=${end}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEvents(res.data);
    } catch {
      toast.error("Failed to load calendar");
    }
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">
        Doctor Calendar View
      </h2>

      <div className="bg-white p-6 rounded-2xl shadow">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          height="80vh"
          events={events}
          datesSet={(arg) =>
            fetchEvents(
              arg.startStr.split("T")[0],
              arg.endStr.split("T")[0]
            )
          }
        />
      </div>
    </Layout>
  );
}

export default AdminDoctorCalendar;