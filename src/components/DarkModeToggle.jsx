import React, { useState, useEffect } from 'react';

function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    // Load preference from localStorage or fallback to false
    const stored = localStorage.getItem('darkMode');
    return stored === 'true';
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem('darkMode', isDark);
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(prev => !prev);

  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={isDark}
        onChange={toggleDarkMode}
        aria-label="Toggle dark mode"
      />
      <span className="slider"></span>
    </label>
  );
}

export default DarkModeToggle;
