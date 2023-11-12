import axios, { AxiosInstance } from "axios";
import React, { Context, Dispatch, createContext, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import Cookies from 'js-cookie'
import { createTheme } from "@mui/material";

export const apiAuthenticatedContext: Context<[boolean, Dispatch<boolean>]> = createContext(null)


export const defaultTheme = createTheme({
    palette:{
      mode: 'dark'
    },
  });

export const api: AxiosInstance = axios.create({
    baseURL: 'https://api.games.acooldomain.co',
});


export function ApiWrapper({ children }) {
    const token = Cookies.get('token')
    if (token){
        api.defaults.headers.common.Authorization =  `Bearer ${token}`;

    }
    const [apiAuthenticated, setApiAuthenticated] = useState(Boolean(token))
    if (!apiAuthenticated){
        Cookies.remove('token', { path: '/', domain: 'games.acooldomain.co' })
        }
    const path = useLocation()
    return (<apiAuthenticatedContext.Provider value={[apiAuthenticated, setApiAuthenticated]}>
        {children}
        {!apiAuthenticated && path.key != '/login' && <Navigate to='/login'/>}
    </apiAuthenticatedContext.Provider>)
}



export function loadApiDoc(api: AxiosInstance, path: string, method: string) {
    const [apiRecord, setApiRecord] = useState(null)
    if (apiRecord) {
        const schema = apiRecord.data.paths[path][method]
        let formSchema = { title: schema.summary, type: 'object', required: [], properties: {}, definitions: apiRecord.data.components, default: {} }
        if (schema.requestBody) {
            formSchema = schema.requestBody.content['application/json'].schema
            formSchema.definitions = apiRecord.data.components
        }

        return JSON.parse(JSON.stringify(formSchema).replaceAll('#/components', '#/definitions'))
    }


    api.get('/openapi.json').then(
        (value) => {
            setApiRecord(value)
        }
    )

}

