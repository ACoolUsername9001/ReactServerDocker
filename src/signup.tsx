import { CssBaseline, Box, Typography, TextField, FormControlLabel, Checkbox, Container, Button } from "@mui/material";
import React, { FormEvent, FormEventHandler, useContext } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { api, apiAuthenticatedContext } from "./common";
import Cookies from 'js-cookie'
import { fetchToken } from "./login";

const signUp = async (username: string, password: string, token: string) => {
    try {
        const response = await api.post(`/signup?token=${token}`, {
            username: username,
            password: password,
        }, {
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching token:', error);
        throw error;
    }
};

export function SignupPage(props: {}) {
    const [apiAuthenticated, setApiAuthenticated] = useContext(apiAuthenticatedContext)
    const [searchParam, setSearchParam] = useSearchParams();
    const token = searchParam.get('token');
    if (token == null){
        return <Navigate to='/' />
    }

    if (apiAuthenticated) {
        return <Navigate to='/' />
    }

    const handleSubmit: FormEventHandler<HTMLFormElement> = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const usernameFormData: FormDataEntryValue | null = data.get('username');
        const passwordFormData: FormDataEntryValue | null = data.get('password');
        if (usernameFormData == null || passwordFormData == null){
            return
        }
        const username: string = usernameFormData.toString();
        const password: string = passwordFormData.toString();


        signUp(username, password, token).then(
            () => {
                fetchToken(username, password, true).then(
                    (token) => {
                        api.defaults.headers.common.Authorization = `Bearer ${token}`;
                        ;
                        Cookies.set('token', token)
                        setApiAuthenticated(true)
                    },
                    (error) => {
                        return Promise.reject(error);
                    }
                )
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
                    Sign up
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
                        autoComplete="new-password"
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Sign Up
                    </Button>
                </Box>
            </Box>
        </Container>
    )
}
