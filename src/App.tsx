import { Box, Paper, ThemeProvider, List, ListItem, ListItemButton, ListItemText, SwipeableDrawer, ListItemIcon, IconButton, AppBar, Toolbar, PaletteMode, createTheme, useMediaQuery, useTheme } from "@mui/material";
import React, { Dispatch, ReactNode, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ApiWrapper, getDesignTokens, GlobalOpenApi, GlobalUserInfo } from "./common";
import { LoginPage } from "./login";
import ServersBoard from "./servers";
import MenuIcon from '@mui/icons-material/Menu';
import StorageIcon from '@mui/icons-material/Storage';
import WebIcon from '@mui/icons-material/Web';
import Person3Icon from '@mui/icons-material/Person3';
import { UsersPage } from "./users";
import { BrowsersPage } from "./browsers";
import { SignupPage } from "./signup";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Cookies from 'js-cookie'

const ColorModeContext = React.createContext({ toggleColorMode: () => { } });

function Menu(props: { children: ReactNode, setMode: Dispatch<PaletteMode> }) {
  const [open, setOpen] = React.useState(false);
  const theme = useTheme();
  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };
  const colorMode = React.useContext(ColorModeContext);

  return (

    <Box component={Paper} width='100vw' height='100vh' overflow={'clip'} maxHeight='-webkit-fill-available'>
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
          <Box component="div" sx={{ flexGrow: 1 }} />
          <IconButton size='large' edge='end' color='inherit' aria-label="menu" sx={{ mr: 2 }} onClick={colorMode.toggleColorMode}>
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
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

export default function App() {
  let themeName = Cookies.get('theme')
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  if (!themeName) {
    themeName = prefersDarkMode ? 'dark' : 'light'
  }
  const [mode, setMode] = React.useState<PaletteMode>(themeName as PaletteMode);
  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const mode = prevMode === 'light' ? 'dark' : 'light'
          Cookies.set('theme', mode)
          return mode
        });


      },
    }),
    [],
  );

  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <Box height={'100vh'} width={'100vw'} overflow='clip' maxHeight='-webkit-fill-available'>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <ApiWrapper>
          <GlobalOpenApi>
            <GlobalUserInfo>
                <Menu setMode={setMode}>
                  <Routes>
                    <Route path='login' element={<LoginPage />} />
                    <Route path='signup' element={<SignupPage />} />
                    <Route path='servers' element={<ServersBoard />} />
                    <Route path='users' element={<UsersPage />} />
                    <Route path='browsers' element={<BrowsersPage />} />
                    <Route index element={<Navigate to='/servers' />} />
                  </Routes>
                </Menu>
              </GlobalUserInfo>
          </GlobalOpenApi>
          </ApiWrapper>
        </BrowserRouter>
      </ThemeProvider>
  </Box>
    </ColorModeContext.Provider>
  )
}
