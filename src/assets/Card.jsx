import React from 'react';
import { Switch } from 'antd';

function Card({ Icon, title, children, status, onToggle, isChecked }) {
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
            <span
              style={{
                fontSize: '1.3 rem', // smaller emoji
              }}
            >
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
        {children}
      </div>
    </div>
  );
}

export default Card;
