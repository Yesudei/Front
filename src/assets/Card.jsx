import React from 'react';
import { Switch } from 'antd';

function Card({ Icon, title, value, status, onToggle, isChecked }) {
  // Map status to colors
  const statusColor = {
    Hot: 'red',
    Cold: 'blue',
    Normal: 'green',
  };

  return (
    <div className='card'>
      <div className='card-top'>
        <Icon className='card-icon' />
        <Switch
          checked={isChecked}
          onChange={onToggle}
          className='antd-switch'
        />
      </div>
      <div className='card-bottom'>
        <h3>{title}</h3>
        <h1>{value}</h1>
        {status && (
          <p style={{ color: statusColor[status], fontWeight: 'bold', marginTop: '5px' }}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}

export default Card;
