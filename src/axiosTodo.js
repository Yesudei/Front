import axios from 'axios';

const axiosUsers = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
});

export default axiosUsers;
