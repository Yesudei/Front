import React from 'react';
import '../CSS/AuthPage.css'; 

function AuthPage({ children }) {
  return (
    <div className="center-page">
      {children}
    </div>
  );
}

export default AuthPage;
