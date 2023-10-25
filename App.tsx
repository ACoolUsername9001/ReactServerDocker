import ServersBoard, { ApiWrapper, LoginPage, UsersPage } from "./buttons_menu";
import "./app.module.css"
import React, { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";


function Menu({children}){
  const location = useLocation();
  const [path, setPath] = useState('');
  const renavigate = ((path!=location.pathname) && (location.pathname!='/login') && (location.pathname !='/') && (location.pathname != ''))
  console.log(`Pathname ${location.pathname} path ${path} renavigate ${renavigate}`)
  return <div>
  <div className="menu-bar">
    <div onClick={()=>{setPath('/servers')}} className={`menu-item ${location.pathname == '/servers'? "menu-item-selected": ''}`}> Servers</div>
    <div onClick={()=>{setPath('/users')}} className={`menu-item ${location.pathname == '/users'? "menu-item-selected": ''}`}> Users</div>
  </div>
  {children}
  {renavigate? <Navigate to={path}/>: <></>}
  </div>
}


// Function to obtain the token

export default function App() {
  return (<div className="container" id='container'>
    
      <ApiWrapper>
        <BrowserRouter>
            <Routes>
              <Route index element={<Navigate to='/servers' />} />
              <Route path='/login' element={<LoginPage />} />
              <Route path='/servers' element={<Menu><ServersBoard onFail={() => { return <Navigate to='/login' /> }} /></Menu>} />
              <Route path='/users' element={<Menu><UsersPage onFail={() => { return <Navigate to='/login' /> }} /></Menu>} />
            </Routes>
        </BrowserRouter>
      </ApiWrapper>
    
  </div >
  )
}
