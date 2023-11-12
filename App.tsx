import { Box, Typography, Paper, Tabs, Tab, ThemeProvider} from "@mui/material";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { defaultTheme, ApiWrapper } from "./src/common";
import { LoginPage } from "./src/login";
import ServersBoard from "./src/servers";
import { UsersPage } from "./src/users";
import { BrowsersPage } from "./src/browsers";

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
            <Tab label="Browsers" {...a11yProps(2)} sx={{ width: '100%', justifyContent: 'center', alignSelf: 'center' }} />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
          <ServersBoard/>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          <UsersPage/>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
          <BrowsersPage/>
        </CustomTabPanel>
      </Box>

  )
}
// Function to obtain the token

export default function App() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <BrowserRouter>
        <ApiWrapper>

            <Routes>
              <Route index element={<Menu />} />
              <Route path='/login' element={<LoginPage />} />
            </Routes>
          </ApiWrapper>
      </BrowserRouter>
      
    </ThemeProvider>
  )
}
