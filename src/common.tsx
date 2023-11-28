import axios, { AxiosInstance } from "axios";
import React, { Context, Dispatch, ReactNode, createContext, useContext, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import Cookies from 'js-cookie'
import { Box, Button, ButtonGroup, ButtonOwnProps, ButtonPropsVariantOverrides, Modal, PaletteMode, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, createTheme, TextField } from "@mui/material";
import { Form } from "@rjsf/mui";
import validator from '@rjsf/validator-ajv8';
import { blue, grey } from "@mui/material/colors";
import { OpenAPISchema } from "./interfaces";
import { JSONSchema7 } from "json-schema";
import { IChangeEvent } from "@rjsf/core";
import { RJSFSchema, WidgetProps } from "@rjsf/utils";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';


// import TextWidget from '@rjsf/core/src/components/widgets/TextWidget';

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

interface Options{
    label: string
    const: string
    }

export const actionIdentifierContext: Context<string> = createContext('')

function FetcherField(props: WidgetProps){
    const jp = require('jsonpath')
    const [options2, setOptions]: [Options[], Dispatch<Options[]>] = useState([] as Options[])
    const {schema, registry, options, ...newProps} = props
    const {SelectWidget} = registry.widgets

    if (!schema.fetch_url){
        return <TextField onChange={(event)=>(props.onChange(event.target.value))} value={props.value} label={props.label}/>
    }
    
    if (options2.length == 0){
        api.get(schema.fetch_url as string).then((event)=>{
            let newOptions: Options[] = []
            for (let response of event.data){
                newOptions.push({
                    const: jp.query(response, `$.${schema.fetch_key_path}`)[0], 
                    label: jp.query(response, `$.${schema.fetch_display_path}`)[0],
                })
            }

            setOptions(newOptions)
        })
    }
    return <SelectWidget {...newProps} schema={{oneOf: options2}} registry={registry} options={{enumOptions: options2.map((value: Options)=>({label: value.label, value: value.const}))}}/>
}


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
                <Form validator={validator} widgets={{TextWidget: FetcherField}} schema={p.action.args} onChange={onFormChange} formData={formData} onSubmit={handleSubmit} />
            </Box>
        </Modal>
    </>)
}

export function ActionGroup(p: { actions: ActionInfo[], identifierSubstring?: string, children?: ReactNode}) {
    const actionItems: any[] = p.actions.map((action, index, array) => (<ActionItem action={action} identifierSubstring={p.identifierSubstring} /> ))
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    
    for (let child in React.Children.toArray(p.children)){
        actionItems.push(child)
    }
    console.log(actionItems)

    const handleMenuItemClick = (
        event: React.MouseEvent<HTMLLIElement, MouseEvent>,
        index: number,
      ) => {
        setSelectedIndex(index);
        setOpen(false);
    };

    const handleToggle = () => {
      setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event: Event) => {
      if (
        anchorRef.current &&
        anchorRef.current.contains(event.target as HTMLElement)
      ) {
        return;
      }
  
      setOpen(false);
    }
    return (
        <React.Fragment>
          <ButtonGroup variant="outlined" ref={anchorRef} aria-label="split button">
            {actionItems[selectedIndex]}
            <Button
          size="small"
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label="select merge strategy"
          aria-haspopup="menu"
          onClick={handleToggle}
        >
          <ArrowDropDownIcon />
        </Button>
          </ButtonGroup>
          <Popper
            sx={{
              zIndex: 1,
            }}
            open={open}
            anchorEl={anchorRef.current}
            role={undefined}
            transition
            disablePortal
          >
            {({ TransitionProps, placement }) => (
              <Grow
                {...TransitionProps}
                style={{
                  transformOrigin:
                    placement === 'bottom' ? 'center top' : 'center bottom',
                }}
              >
                <Paper>
                  <ClickAwayListener onClickAway={handleClose}>
                    <MenuList id="split-button-menu" autoFocusItem>
                      {actionItems.map((option, index) => (
                        <MenuItem
                          key={option.props.action.name}
                          selected={index === selectedIndex}
                          onClick={(event) => handleMenuItemClick(event, index)}
                        >
                          {option.props.action.name}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </ClickAwayListener>
                </Paper>
              </Grow>
            )}
          </Popper>
        </React.Fragment>
      );
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
