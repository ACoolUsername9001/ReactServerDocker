import { CssBaseline, Box, Typography, TextField, FormControlLabel, Checkbox, Container, Button } from "@mui/material";
import React, { FormEventHandler, useContext } from "react";
import { Navigate } from "react-router-dom";
import { api, apiAuthenticatedContext } from "./common";
import Cookies from 'js-cookie'

export const fetchToken = async (username: string, password: string, remember: boolean) => {
    try {
        const response = await api.post('/token', {
            username: username,
            password: password,
            remember: remember,
        }, {
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching token:', error);
        throw error;
    }
};

export function LoginPage(props: {}) {
    const [apiAuthenticated, setApiAuthenticated] = useContext(apiAuthenticatedContext)

    if (apiAuthenticated) {
        return <Navigate to='/' />
    }

    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const usernameFormData: FormDataEntryValue | null = data.get('username');
        const passwordFormData: FormDataEntryValue | null = data.get('password');
        if (usernameFormData === null || passwordFormData === null){
            return
        }
        const username: string = usernameFormData.toString();
        const password: string = passwordFormData.toString();

        fetchToken(username, password, Boolean(data.get('remember'))).then(
            (token) => {
                api.defaults.headers.common.Authorization = `Bearer ${token}`;
                Cookies.set('token', token)
                setApiAuthenticated(true)
            },
            (error) => {
                return Promise.reject(error);
            }
        )
    }

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    Sign in
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="User Name"
                        name="username"
                        autoFocus
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                    />
                    <FormControlLabel
                        control={<Checkbox value={true} name='remember' color="primary" />}
                        label="Remember me"
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Sign In
                    </Button>
                </Box>
            </Box>
        </Container>
    )
}

