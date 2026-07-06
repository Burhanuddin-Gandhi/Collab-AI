import axios from "axios";

import API_BASE_URL from "../config/api";
const API = `${API_BASE_URL}/api/auth`;

export const loginUser = (data) => axios.post(`${API}/login`, data);

export const registerUser = (data) => axios.post(`${API}/register`, data);