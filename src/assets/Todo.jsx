import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosTodo';
import axiosUsers from '../axiosTodo';

function Todo() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editIndex, setEditIndex] = useState(null);

  const styles = {
    container: {
      maxWidth: '500px',
      margin: 'auto',
      padding: '50px 500px',
      borderRadius: '10px',
      backgroundColor: '#f9f9f9',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    heading: {
      textAlign: 'center',
      marginBottom: '20px',
      color: 'black',
    },
    inputGroup: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
    },
    input: {
      flex: 1,
      padding: '10px',
      borderRadius: '6px',
      border: '1px solid #ccc',
      fontSize: '14px',
    },
    button: {
      padding: '10px 15px',
      border: 'none',
      borderRadius: '6px',
      backgroundColor: '#2962ff',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '14px',
    },
    listItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      padding: '10px',
      backgroundColor: '#fff',
      borderRadius: '6px',
      border: '1px solid #eee',
      marginBottom: '10px',
      color: 'black',
    },
    taskText: {
      flex: 1,
      wordBreak: 'break-word',
      marginRight: '10px',
    },
    actionButtons: {
      display: 'flex',
      gap: '5px',
    },
    editBtn: {
      backgroundColor: '#ffb300',
      color: '#fff',
      padding: '5px 10px',
    },
    deleteBtn: {
      backgroundColor: '#d32f2f',
      color: '#fff',
      padding: '5px 10px',
    },
  };

  useEffect(() => {
    axiosInstance.get('/todos?_limit=5')
      .then(res => {
        setTasks(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch todos', err);
      });
  }, []);

  const handleAddTask = () => {
    if (newTask.trim() === '') return;

    if (editIndex !== null) {
      const updated = [...tasks];
      updated[editIndex] = {
        ...updated[editIndex],
        title: newTask,
      };
      setTasks(updated);
      setEditIndex(null);
    } else {
      const newTodo = {
        id: Date.now(),
        title: newTask,
      };
      setTasks([...tasks, newTodo]);
    }

    setNewTask('');
  };

  const handleEdit = (index) => {
    setNewTask(tasks[index].title);
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    const updated = tasks.filter((_, i) => i !== index);
    setTasks(updated);
    if (editIndex === index) {
      setEditIndex(null);
      setNewTask('');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>To Do list</h2>

      <div style={styles.inputGroup}>
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddTask();
            }
          }}
          style={styles.input}
          placeholder="Шинэ зүйл бичих..."
        />

        <button onClick={handleAddTask} style={styles.button}>
          {editIndex !== null ? 'Засах' : 'Нэмэх'}
        </button>
      </div>

      {tasks.map((task, index) => (
        <div key={task.id || index} style={styles.listItem}>
          <span style={styles.taskText}>{task.title}</span>
          <div style={styles.actionButtons}>
            <button
              style={{ ...styles.button, ...styles.editBtn }}
              onClick={() => handleEdit(index)}
            >
              Засах
            </button>
            <button
              style={{ ...styles.button, ...styles.deleteBtn }}
              onClick={() => handleDelete(index)}
            >
              Устгах
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Todo;
