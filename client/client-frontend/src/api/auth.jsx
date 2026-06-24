import axios from "axios";

const API = "http://localhost:5000/api/auth";

export const loginUser = (data) => axios.post(`${API}/login`, data);

export const registerUser = (data) => axios.post(`${API}/register`, data);