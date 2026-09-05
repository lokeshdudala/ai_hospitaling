const Groq = require("groq-sdk");

// Load environment variables (extra safety)
require("dotenv").config();

// Safe debug (DO NOT print full key)
console.log("Groq key loaded:", !!process.env.GROQ_API_KEY);
console.log(
  "Groq key starts with:",
  process.env.GROQ_API_KEY
    ? process.env.GROQ_API_KEY.substring(0, 4)
    : "undefined"
);

// Create Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

module.exports = groq;