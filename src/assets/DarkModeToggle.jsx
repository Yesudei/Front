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
    <button
      onClick={toggleDarkMode}
      aria-label="Toggle dark mode"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '20px',
        padding: '0',
        margin: '0',
        lineHeight: '1',
      }}
    >
      {isDark ? '🌞' : '🌙'}
    </button>
  );
}

export default DarkModeToggle;
