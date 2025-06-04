import axios from 'axios'

const axiosInstance = axios.create({
    baseURL: 'https://jsonplaceholder.typicode.com/users',
    timeout: 5000,
    headers:
});

export default axiosInstance;