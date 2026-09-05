import { createContext, useState, useEffect } from "react";
import translations from "../locales/translations";

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // 🔹 Load saved language from localStorage
  const [language, setLanguage] = useState(
    localStorage.getItem("lang") || "en"
  );

  // 🔹 Save language whenever it changes
  useEffect(() => {
    localStorage.setItem("lang", language);
  }, [language]);

  // 🔹 Safe translation fallback
  const t = translations[language] || translations["en"];

  // 🔹 Change language function
  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};