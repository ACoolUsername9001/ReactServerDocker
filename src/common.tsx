import axios, { AxiosInstance } from "axios";
import React, { ChangeEvent, Context, Dispatch, ReactNode, createContext, useContext, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import Cookies from 'js-cookie'
import { Box, Button, ButtonGroup, ButtonOwnProps, ButtonPropsVariantOverrides, Modal, PaletteMode, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, createTheme } from "@mui/material";
import { Form } from "@rjsf/mui";
import validator from '@rjsf/validator-ajv8';
import { amber, blue, deepOrange, grey } from "@mui/material/colors";
import { OpenAPISchema, OpenApiMethodSchema, ServerInfo } from "./interfaces";
import { JSONSchema7 } from "json-schema";
import { IChangeEvent } from "@rjsf/core";
import { RJSFSchema } from "@rjsf/utils";

export const apiAuthenticatedContext: Context<[boolean, Dispatch<boolean>]> = createContext([false, (value: boolean) => {}] as [boolean, Dispatch<boolean>])


export const formModalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '70%',
    bgcolor: 'background.paper',
    p: 4,
    borderRadius: 3,
}

export const getDesignTokens = (mode: PaletteMode) => ({
    palette: {
        mode,
        ...(mode === 'light'
            ? {
                // palette values for light mode
                primary: blue,
                divider: blue[200],
                background: {
                    default: grey[200],
                    light: grey[100],
                },
                text: {
                    primary: grey[900],
                    secondary: grey[800],
                },
            }
            : {
                // palette values for dark mode
                primary: grey,
                divider: grey[700],
                background: {
                    default: grey[900],
                    paper: grey[900],
                    light: grey[700],
                },
                text: {
                    primary: '#fff',
                    secondary: grey[500],
                },
            }),
    },
    components: {
        MuiTypography: {
            defaultProps: {
                color: 'text.primary'
            }
        },
    }
});


export const api: AxiosInstance = axios.create({
    baseURL: 'https://api.games.acooldomain.co',
});


export function ApiWrapper(p: { children: ReactNode}) {
    const {children} = p
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



export function useApiDoc(api: AxiosInstance, path: string, method: 'get' | 'post' | 'delete') {
    const [apiRecord, setApiRecord] = useState(null as OpenAPISchema|null)

    if (apiRecord) {
        const schema = apiRecord.data.paths[path][method]
        if (!schema){
            return
        }

        let formSchema: JSONSchema7 = { title: schema.summary, type: 'object', required: [], properties: {}, definitions: apiRecord.data.components, default: {} }
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


export function useActions(api: AxiosInstance, path_prefix: string): ActionInfo[] {
    const [openapi, setOpenApi]: [OpenAPISchema|null, Dispatch<OpenAPISchema>] = useState(null as OpenAPISchema|null)
    let [actions, setActions]: [Record<string, ActionInfo[]>, Dispatch<Record<string, ActionInfo[]>>] = useState({})

    if (actions[path_prefix] && actions[path_prefix].length > 0) {
        return actions[path_prefix]
    }
    if (openapi === null) {
        api.get('/openapi.json').then((value: OpenAPISchema) => {
            setOpenApi(value)
        }
        )
        return []
    }

    let responseActions: ActionInfo[] = []
    let paths = openapi.data.paths
    for (let [path, request] of Object.entries(paths)) {
        if (path.startsWith(path_prefix)) {
            for (let [method, schema] of Object.entries(request)) {
                let formSchema: JSONSchema7 = { title: schema.summary, type: 'object', required: [], properties: {}, definitions: openapi.data.components, default: {} }
                if (schema.requestBody) {
                    formSchema = schema.requestBody.content['application/json'].schema
                    formSchema.definitions = openapi.data.components
                }
                responseActions.push({ name: schema.summary, args: JSON.parse(JSON.stringify(formSchema).replaceAll('#/components', '#/definitions')), requestType: (method as 'get' | 'post' | 'delete'), endpoint: path })
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


export function ActionItem(p: { action: ActionInfo, identifierSubstring?: string, sx?: ButtonOwnProps, variant?: any, onClick?: Function }) {
    const actionIdentifier: string = useContext(actionIdentifierContext)
    const identifierSubstring = (typeof p.identifierSubstring !== 'undefined') ? p.identifierSubstring : ''

    const [form, setForm] = useState(false);
    const [formData, setFormData]: [RJSFSchema, Dispatch<RJSFSchema>] = useState({})



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
                if (formData){
                    console.warn('delete can get no arguments, dropping')
                }
                api.delete(url)
                break
            }
        }
        setForm(false)
        setFormData({})
    }

    function onFormChange(args: IChangeEvent<any, RJSFSchema, any>) {
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

export function ActionGroup(p: { actions: ActionInfo[], identifierSubstring?: string, children?: ReactNode}) {
    return (
        <ButtonGroup variant="outlined" aria-label="outlined button group">
            {p.actions.map((action, index, array) => { return <ActionItem action={action} identifierSubstring={p.identifierSubstring} /> })}
            {p.children}
        </ButtonGroup>
    )
}



export function DataTable(props: { headers: string[], children: ReactNode, actionInfo?: ActionInfo, actionHook?: Function }) {
    const { children, headers, actionInfo, actionHook } = props
    return <Box padding={4} overflow='clip'>
        <TableContainer component={Paper} sx={{maxHeight: '80svh'}}>
            <Table stickyHeader>
                <TableHead>
                    <TableRow sx={{ backgroundColor: 'background.light' }}>
                        {headers.map((value, index, array) => (<TableCell sx={{ backgroundColor: 'background.light' }}>{value}</TableCell>))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {children}
                </TableBody>
            </Table>
        </TableContainer>
        {(actionInfo && <Box marginTop={2} overflow='clip'>
            <ActionItem variant="contained" action={actionInfo} onClick={actionHook} />
        </Box>)}
    </Box>
}
