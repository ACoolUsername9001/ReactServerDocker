import ServersBoard, { ApiWrapper, LoginPage, UsersPage } from "./buttons_menu";
import React, { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";

import '@mui/material';
import { Box, Paper, Tab, Tabs, ThemeProvider, Typography, createTheme} from "@mui/material";

const defaultTheme = createTheme({
  palette:{
    mode: 'dark'
  }
});

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function Menu() {
  const [value, setValue] = React.useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
      <Box sx={{ width: '100%' }} component={Paper} >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }} >
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example" sx={{ width: '100%', alignItems: 'center' }} >
            <Tab label="Servers" {...a11yProps(0)} sx={{ width: '100%', justifyContent: 'center', alignSelf: 'center' }} />
            <Tab label="Users" {...a11yProps(1)} sx={{ width: '100%', justifyContent: 'center', alignSelf: 'center' }} />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
          <ServersBoard onFail={() => { return <Navigate to='/login' /> }} />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          <UsersPage onFail={() => { return <Navigate to='/login' /> }} />
        </CustomTabPanel>
      </Box>

  )
}
// Function to obtain the token

export default function App() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <ApiWrapper>
        <BrowserRouter>
          <Routes>
            <Route index element={<Menu />} />
            <Route path='/login' element={<LoginPage />} />
          </Routes>
        </BrowserRouter>
      </ApiWrapper>
    </ThemeProvider>
  )
}
