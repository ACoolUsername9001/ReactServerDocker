import axios, { AxiosInstance } from "axios";
import React, { Context, Dispatch, createContext, useContext, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import Cookies from 'js-cookie'
import { Box, Button, ButtonGroup, ButtonOwnProps, ButtonPropsVariantOverrides, Modal, createTheme } from "@mui/material";
import { Form } from "@rjsf/mui";
import validator from '@rjsf/validator-ajv8';


export const apiAuthenticatedContext: Context<[boolean, Dispatch<boolean>]> = createContext(null)


export const formModalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '70%',
    bgcolor: '#191919',
    p: 4,
    borderRadius: 3,
}


export const defaultTheme = createTheme({
    palette: {
        mode: 'dark'
    },
    components: {
        MuiTypography: {
            defaultProps: {
                color: '#fff'
            }
        }
    }
});

export const api: AxiosInstance = axios.create({
    baseURL: 'https://api.games.acooldomain.co',
});


export function ApiWrapper({ children }) {
    const token = Cookies.get('token')
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;

    }
    const [apiAuthenticated, setApiAuthenticated] = useState(Boolean(token))
    if (!apiAuthenticated) {
        Cookies.remove('token', { path: '/', domain: 'games.acooldomain.co' })
    }
    const path = useLocation()
    return (<apiAuthenticatedContext.Provider value={[apiAuthenticated, setApiAuthenticated]}>
        {children}
        {!apiAuthenticated && (path.pathname != '/login' && path.pathname != '/signup') && <Navigate to='/login' />}
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


export interface ActionInfo {
    name: string
    requestType: 'post' | 'get' | 'delete'
    endpoint: string
    args: {}
}


export function loadActions(api: AxiosInstance, path_prefix: string): ActionInfo[] {
    const [openapi, setOpenApi] = useState(null)
    let [actions, setActions]: [Record<string, ActionInfo[]>, Dispatch<Record<string, ActionInfo[]>>] = useState({})

    if (actions[path_prefix] && actions[path_prefix].length > 0) {
        return actions[path_prefix]
    }
    if (openapi === null) {
        api.get('/openapi.json').then((value) => {
            setOpenApi(value)
        }
        )
        return []
    }

    let responseActions: ActionInfo[] = []
    let paths: Record<string, any> = openapi.data.paths
    for (let [path, request] of Object.entries(paths)) {
        if (path.startsWith(path_prefix)) {
            for (let [method, schema] of Object.entries(request)) {
                let formSchema = { title: schema.summary, type: 'object', required: [], properties: {}, definitions: openapi.data.components, default: {} }
                if (schema.requestBody) {
                    formSchema = schema.requestBody.content['application/json'].schema
                    formSchema.definitions = openapi.data.components
                }
                responseActions.push({ name: schema.summary, args: JSON.parse(JSON.stringify(formSchema).replaceAll('#/components', '#/definitions')), requestType: method, endpoint: path })
            }
        }
    }

    actions[path_prefix] = responseActions
    setActions(actions)

    if (actions[path_prefix]) {
        return actions[path_prefix]
    }
    else {
        return []
    }
}


export const actionIdentifierContext: Context<string> = createContext('')


export function ActionItem(p: { action: ActionInfo, identifierSubstring?: string, sx?: ButtonOwnProps, variant?: ButtonPropsVariantOverrides, onClick?: Function }) {
    const actionIdentifier: string = useContext(actionIdentifierContext)
    const identifierSubstring = (typeof p.identifierSubstring !== 'undefined') ? p.identifierSubstring : ''

    const [form, setForm] = useState(false);
    const [formData, setFormData] = useState({})



    function handleSubmit() {
        let url = p.action.endpoint.replaceAll(`{${identifierSubstring}}`, actionIdentifier)

        switch (p.action.requestType) {
            case 'post': {
                api.post(url, formData)
                break
            }
            case 'get': {
                api.post(url, formData)
                break
            }
            case 'delete': {
                api.delete(url, formData)
                break
            }
        }
        setForm(false)
        setFormData(null)
    }

    function onFormChange(args) {
        setFormData(args.formData)
    }

    return (<>
        <Button variant={p.variant} onClick={() => { if (p.onClick) { p.onClick() } setForm(true) }} sx={p.sx}>{p.action.name}</Button >
        <Modal
            onClose={() => { setForm(false); setFormData({}); }}
            open={form}
        >
            <Box sx={formModalStyle}>
                <Form validator={validator} schema={p.action.args} onChange={onFormChange} formData={formData} onSubmit={handleSubmit} />
            </Box>
        </Modal>
    </>)
}

export function ActionGroup(p: { actions: ActionInfo[], identifierSubstring?: string, children?}) {
    return (
        <ButtonGroup variant="outlined" aria-label="outlined button group">
            {p.actions.map((action, index, array) => { return <ActionItem action={action} identifierSubstring={p.identifierSubstring} /> })}
            {p.children}
        </ButtonGroup>
    )
}

