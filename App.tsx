import ServersBoard, { ApiWrapper, LoginPage } from "./buttons_menu";
import "./app.module.css"
import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";



// Function to obtain the token

export default function App() {
  return (<div className="container" id='container'>
    <ApiWrapper>
      <BrowserRouter>
        <Routes>
          <Route index element={<Navigate to='/servers' />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/servers' element={<ServersBoard onFail={() => { return <Navigate to='/login' /> }} />} />
        </Routes>
      </BrowserRouter>
    </ApiWrapper>
  </div >
  )
}
