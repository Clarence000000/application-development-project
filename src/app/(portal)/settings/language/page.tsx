"use client";
import { useState } from 'react';

export default function LanguageSettingsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const languages = ['English', 'Bahasa Melayu'];

  return (
    <section className="rounded-lg border border-outline-variant bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4 rounded-t-lg">
        <div className="flex items-center gap-2 font-bold text-primary">
          <span className="material-symbols-outlined">language</span>
          <h2>Language</h2>
        </div>
      </div>

      {/* Dropdown Container */}
      <div className="p-6 max-w-sm">
        <div className="relative">
          {/* Dropdown Trigger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex w-full items-center justify-between rounded-lg border border-outline-variant bg-white px-4 py-3 text-left text-sm font-bold text-on-surface hover:bg-gray-50 focus:outline-none focus:border-primary"
          >
            <span>{selectedLanguage}</span>
            <span className={`material-symbols-outlined transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>

          {/* Dropdown Options Box */}
          {isOpen && (
            <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border border-outline-variant bg-white shadow-lg">
              <div className="flex flex-col">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-3 text-left text-sm font-bold transition-colors
                      ${selectedLanguage === lang 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-on-surface hover:bg-gray-50'
                      }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}