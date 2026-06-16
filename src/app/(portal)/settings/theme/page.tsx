'use client';

import { useState } from 'react';

export default function ThemeSettingsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('Light');

  const themes = ['Light', 'Dark', 'System'];

  return (
    <section className="rounded-lg border border-outline-variant bg-white shadow-sm">
      {/* Header Container - rounded-t-lg avoids corner bleed */}
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4 rounded-t-lg">
        <div className="flex items-center gap-2 font-bold text-primary">
          <span className="material-symbols-outlined">palette</span>
          <h2>Theme</h2>
        </div>
      </div>

      {/* Dropdown Wrapper Container */}
      <div className="p-6 max-w-sm">
        <div className="relative">
          {/* Dropdown Trigger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex w-full items-center justify-between rounded-lg border border-outline-variant bg-white px-4 py-3 text-left text-sm font-bold text-on-surface hover:bg-gray-50 focus:outline-none"
          >
            <span>{selectedTheme}</span>
            <span className={`material-symbols-outlined transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>

          {/* Dropdown Options Box */}
          {isOpen && (
            <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border border-outline-variant bg-white shadow-lg">
              <div className="flex flex-col">
                {themes.map((theme) => (
                  <button
                    key={theme}
                    onClick={() => {
                      setSelectedTheme(theme);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-bold transition-colors
                      ${selectedTheme === theme 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-on-surface hover:bg-gray-50'
                      }`}
                  >
                    {theme}
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