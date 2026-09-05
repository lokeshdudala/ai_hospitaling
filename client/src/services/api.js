import axios from "axios";

const API = axios.create({
  baseURL: "https://ai-hospital-server.onrender.com/api",
});

export default API;