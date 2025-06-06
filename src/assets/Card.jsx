import React from 'react'
import { Switch } from 'antd'

function Card({ Icon, title, value, onToggle, isChecked}) {
  return (
    <div className='card'>
      <div className='card-top'>
        <Icon className='card-icon' />
        <Switch
          checked={isChecked}
          onChange={onToggle}
          className='antd-switch'
        ></Switch>
      </div>
      <div className='card-bottom'>
        <h3>{title}</h3>
        <h1>{value}</h1>
      </div>
    </div>
  )
}

export default Card
