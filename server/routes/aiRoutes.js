const express = require("express");
const router = express.Router();
const groq = require("../config/groq");
const { protect } = require("../middleware/authMiddleware");

router.post("/detect", protect, async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3.6-27b",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You are a strict medical classification engine.

Return ONLY ONE exact specialization from this list:

Cardiologist
Dermatologist
Neurologist
General Physician
Orthopedic
Pediatrician
Pulmonologist
ENT Specialist
Endocrinologist
Psychiatrist
None

Classification Rules:

- Chest pain, heart issues, high BP → Cardiologist
- Skin rashes, acne, itching → Dermatologist
- Headache, dizziness, seizures, nerve issues → Neurologist
- Fever, cough, cold, weakness, body pain, infection → General Physician
- Bone pain, joint pain, fracture, leg pain → Orthopedic
- Child health, baby illness → Pediatrician
- Breathing issues, asthma, lung infection → Pulmonologist
- Ear pain, throat pain, sinus → ENT Specialist
- Diabetes, thyroid, hormonal problems → Endocrinologist
- Anxiety, depression, mental health → Psychiatrist
- Greetings, small talk, gibberish, or anything unrelated to physical/mental health symptoms → None

Important:
- If symptoms do not clearly match any of the above categories, return General Physician.
- If the text has no symptoms or is unrelated chat/gibberish, return None.
- Do NOT explain.
- Do NOT add punctuation.
- Do NOT write sentences.
- Return only the specialization name exactly as written above.
`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    let specialization =
      completion.choices[0].message.content.trim();

    // Strip <think>...</think> block if present
    specialization = specialization.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // Safety cleanup
    specialization = specialization
      .replace(".", "")
      .replace("\n", "")
      .trim();

    console.log("FINAL SPECIALIZATION:", specialization);

    res.json({ specialization });
  } catch (error) {
    console.error("GROQ ERROR:", error);
    res.status(500).json({ message: "AI detection failed" });
  }
});

// 🔹 Patient - Explain medical report or prescription text in simple terms and local language
router.post("/explain-report", protect, async (req, res) => {
  try {
    const { reportText, language } = req.body;

    if (!reportText) {
      return res.status(400).json({ message: "Report text or content is required" });
    }

    let targetLanguage = "English";
    if (language === "te") {
      targetLanguage = "Telugu";
    } else if (language === "hi") {
      targetLanguage = "Hindi";
    }

    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3.6-27b",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
You are a highly patient-friendly medical translator and pharmacist. 

You are a highly patient-friendly medical translator and pharmacist. 

Your first task is to evaluate if the raw text provided by the user is indeed a medical report, laboratory test, doctor prescription, clinical summary, or contains relevant health indicators.

If the text is completely unrelated (for example: a job resume, shopping list, recipe, software code, general article, or gibberish), you must output EXACTLY the following message structure and nothing else:

### ⚠️ Unrecognized Document / గుర్తించబడని పత్రం / अपरिचित दस्तावेज़
This document does not appear to contain medical reports or doctor prescriptions. Please upload a valid clinical report, blood test, or prescription slip.

ఈ పత్రం వైద్య నివేదిక లేదా డాక్టర్ ప్రిస్క్రిప్షన్ కాదనిపిస్తోంది. దయచేసి సరైన క్లినికల్ రిపోర్ట్ లేదా ప్రిస్క్రిప్షన్ అప్‌లోడ్ చేయండి.

यह दस्तावेज़ मेडिकल रिपोर्ट या डॉक्टर का पर्चा नहीं लग रहा है। कृपया एक वैध क्लिनिकल रिपोर्ट या डॉक्टर का पर्चा अपलोड करें।

---

If the text is indeed a medical document, translate the entire response into ${targetLanguage} language (using local script/fonts like Telugu script if Telugu is selected, Devanagari script for Hindi). Format your response in structured Markdown as follows:

### 📋 Simple Summary / నివేదిక సారాంశం / रिपोर्ट का संक्षिप्त विवरण
[Explain what the report/prescription is about in 2-3 simple sentences. Avoid medical jargon.]

### 🩺 Key Findings & Diagnoses / కీలక ఫలితాలు / मुख्य निष्कर्ष
[List the main test results, values, or findings and explain if they are normal, high, or low in simple terms.]

### 💊 Medicines & Dosage / మందులు & మోతాదు / दवाएं और खुराक
[List each medicine prescribed (if any), what it does, and how/when to take it, e.g. morning/night, before/after food.]

### ⚠️ Warning Signs & Next Steps / జాగ్రత్తలు / सावधानियां और अगले कदम
[List warning symptoms to watch out for and immediate next steps, such as when to follow up or see a doctor.]

Ensure the tone is supportive, easy to read, and optimized for patients with limited health literacy. Keep the translation accurate.
`,
        },
        {
          role: "user",
          content: reportText,
        },
      ],
    });

    let explanation = completion.choices[0].message.content.trim();
    explanation = explanation.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    console.log(`✅ Medical report explained successfully in ${targetLanguage}`);

    res.json({ explanation });
  } catch (error) {
    console.error("❌ REPORT EXPLAINER ERROR:", error);
    res.status(500).json({ message: "Failed to analyze and explain medical report" });
  }
});

module.exports = router;