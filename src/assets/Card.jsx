import React from 'react';
import { Switch } from 'antd';

function Card({
  Icon,
  title,
  children,
  status,
  onToggle,
  isChecked,
  onAutomationClick,
}) {
  // Emoji for temperature status
  const statusEmoji = {
    Hot: '🔥',
    Normal: '✅',
    Cold: '❄️',
  };

  return (
    <div className='card'>
      <div className='card-top'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon className='card-icon' />
          {status && (
            <span style={{ fontSize: '1.3rem' }}>
              {statusEmoji[status]}
            </span>
          )}
        </div>
        <h3 className='card-title'>{title}</h3>
        <Switch
          checked={isChecked}
          onChange={onToggle}
          className='antd-switch'
          checkedChildren="ON"
          unCheckedChildren="OFF"
        />
      </div>

      <div className='card-bottom'>
        <div className='card-metrics'>
          {children}
        </div>
        <div className='card-button'>
          <button
            className='automation-btn'
            onClick={onAutomationClick}
          >
            Automation
          </button>
        </div>
      </div>
    </div> // ✅ This was missing
  );
}

export default Card;
