import React from 'react';
import { Switch } from 'antd';
import '../CSS/Card.css';

function Card({
  Icon,
  title,
  children,
  status,
  onToggle,
  isChecked,
  onAutomationClick,
}) {
  const statusEmoji = {
    Hot: '🔥',
    Normal: '✅',
    Cold: '❄️',
  };

  const cardClassName = `card ${status ? status.toLowerCase() : ''}`;

  return (
    <div className={cardClassName}>
      <div className="card-top">
        <div className="card-header">
          {Icon && <Icon className="card-icon" />}
          {status && <span className="status-emoji">{statusEmoji[status]}</span>}
        </div>
        <h3 className="card-title">{title}</h3>
        <Switch
          checked={isChecked}
          onChange={onToggle}
          className="antd-switch"
          checkedChildren="ON"
          unCheckedChildren="OFF"
        />
      </div>

      <div className="card-bottom">
        <div className="card-metrics">{children}</div>
        <div className="card-button">
          <button className="automation-btn" onClick={onAutomationClick}>
            Automation
          </button>
        </div>
      </div>
    </div>
  );
}

export default Card;
