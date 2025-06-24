import React, { useState, useEffect } from 'react';

function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() =>
    document.body.classList.contains('dark')
  );

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(!isDark);

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
