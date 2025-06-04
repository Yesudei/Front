import React from 'react'

function Card({ Icon, title, value }) {
  return (
    <div className='card'>
      <div className='card-top'>
        <Icon className='card-icon' />
        <label className="switch">
          <input type="checkbox" />
          <span className="slider round"></span>
        </label>
      </div>
      <div className='card-bottom'>
        <h3>{title}</h3>
        <h1>{value}</h1>
      </div>
    </div>
  )
}

export default Card
