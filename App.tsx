import ServersBoard from "./buttons_menu";
import "./app.module.css"
import axios, { AxiosInstance } from "axios";
import React, { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

const api: AxiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// Function to obtain the token
const fetchToken = async (username: string, password: string) => {
  try {
    const response = await api.post('/token', {
      grant_type: 'password',
      username: username,
      password: password,
      client_id: null,
      client_secret: null,
    }, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching token:', error);
    throw error;
  }
};

// api.interceptors.request.use(
//   async (config) => {
//     const token = await fetchToken('ACoolName', 'Test');
//     config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );


function LoginPage(props: { setApiAuthenticated: (api: boolean) => void }) {
  const [username, setUsername] = useState(null)
  const [password, setPassword] = useState(null)
  const [apiPatched, setApiPatched] = useState(false)
  const handleSubmit = () => {
    fetchToken(username, password).then(
      (token) => {
        api.interceptors.request.use(
          async (config) => {
            config.headers.Authorization = `Bearer ${token}`;
            return config
          }
        );
        setApiPatched(true)
        props.setApiAuthenticated(true)
      },
      (error) => {
        return Promise.reject(error);
      }
    )
  }
  if (apiPatched) {
    return <Navigate to='/' />
  }

  return (
    <div className="login-container">
      <div>
        <form className='text' onSubmit={handleSubmit}>
          <div>
            Username: <input type='text' name='username' onChange={(event) => { setUsername(event.target.value) }} />
          </div>
          <div>
            Password:<input type='password' name='password' onChange={(event) => { setPassword(event.target.value) }} />
          </div>
          <input type="button" value="submit" onClick={handleSubmit}></input>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [apiAuthenticated, setApiAuthenticated] = useState(false)
  console.log(apiAuthenticated)
  return (<div className="container">
    <BrowserRouter>
      <Routes>
        <Route index element={<Navigate to='/servers' />} />
        <Route path='/login' element={<LoginPage setApiAuthenticated={setApiAuthenticated} />} />
        <Route path='/servers' element={ServersBoard(api, apiAuthenticated, () => { return <Navigate to='/login' /> })}> </Route>
      </Routes>
    </BrowserRouter>
  </div >
  )
}
