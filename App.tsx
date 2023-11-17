import { Box, Typography, Paper, Tabs, Tab, ThemeProvider, Drawer, List, ListItem, ListItemButton, ListItemText, SwipeableDrawer, ListItemIcon, IconButton, FormGroup, FormControlLabel, AppBar, Toolbar, Icon } from "@mui/material";
import React from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { defaultTheme, ApiWrapper } from "./src/common";
import { LoginPage } from "./src/login";
import ServersBoard from "./src/servers";
import MenuIcon from '@mui/icons-material/Menu';
import StorageIcon from '@mui/icons-material/Storage';
import WebIcon from '@mui/icons-material/Web';
import Person3Icon from '@mui/icons-material/Person3';
import { UsersPage } from "./src/users";
import { BrowsersPage } from "./src/browsers";
import { SignupPage } from "./src/signup";


function Menu(props: { children }) {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };
  return (

    <Box component={Paper} width='100%' height='100%'>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => { setOpen(true) }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <SwipeableDrawer
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        disableSwipeToOpen={false}
        ModalProps={
          {
            keepMounted: true,
          }
        }
        open={open}
        sx={{ minWidth: 'max-content' }}
      >
        <List>
          <ListItem key="Servers">
            <ListItemButton href='/servers'>
              <ListItemIcon>
                <StorageIcon />
              </ListItemIcon>
              <ListItemText primary={'Servers'} />
            </ListItemButton>
          </ListItem>
          <ListItem key="Users" >
            <ListItemButton href='/users'>
              <ListItemIcon>
                <Person3Icon />
              </ListItemIcon>
              <ListItemText primary={'Users'} />
            </ListItemButton>
          </ListItem>
          <ListItem key="Browsers">
            <ListItemButton href='/browsers'>
              <ListItemIcon >
                <WebIcon />
              </ListItemIcon>
              <ListItemText primary={'Browsers'} />
            </ListItemButton>
          </ListItem>
        </List>
      </SwipeableDrawer>


      {props.children}
    </Box>

  )
}

// Function to obtain the token

export default function App() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <BrowserRouter>
        <ApiWrapper>
          <Menu>
            <Routes>
              <Route path='login' element={<LoginPage />} />
              <Route path='signup' element={<SignupPage />} />
              <Route path='servers' element={<ServersBoard />} />
              <Route path='users' element={<UsersPage />} />
              <Route path='browsers' element={<BrowsersPage />} />
              <Route index element={<Navigate to='/servers' />} />

            </Routes>
          </Menu>
        </ApiWrapper>
      </BrowserRouter>
    </ThemeProvider>
  )
}
