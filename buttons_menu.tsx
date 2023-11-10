import React, { Context, Dispatch, createContext, useContext, useEffect, useState } from "react"
import axios, { AxiosInstance } from 'axios';
import { createPortal } from 'react-dom';
import { Navigate, useLocation } from "react-router-dom";
import Button from "@mui/material/Button"
import ButtonGroup from "@mui/material/ButtonGroup";
import { Box, Checkbox, Chip, Container, CssBaseline, FormControlLabel, Paper, Popover, Table, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import Cookies from 'js-cookie'

const apiAuthenticatedContext: Context<[boolean, Dispatch<boolean>]> = createContext(null)
const serverIdContext: Context<string> = createContext('')
const serverCommandsContext: Context<CommandInfo[]> = createContext([])


export class CommandInfo {
    name: string
    requestType: 'post' | 'get' | 'delete'
    endpoint: string
    args: {}
    constructor(name: string, args: {} | null, requestType: 'post' | 'get' | 'delete', endpoint: string) {
        this.name = name
        this.args = args
        this.requestType = requestType
        this.endpoint = endpoint
    }
}


function StatusRow(props: { text: string, on: boolean }) {
    return (<div className="statusBar">
        <div className={`statusIcon  ${props.on ? "statusIconOn" : "statusIconOff"}`} />
        <span className='text'>{props.text}</span>
    </div>)
}


function Command(p: { command: CommandInfo }) {
    const server_id: string = useContext(serverIdContext)
    const [form, setForm] = useState(false);
    const [formData, setFormData] = useState({})

    const [args, setArgs]: [Record<string, any>, Dispatch<Record<string, any>>] = useState({})


    function handleSubmit() {
        let url = `servers/${server_id}`
        if (p.command.endpoint != "") {
            url = `${url}/${p.command.endpoint}`
        }
        switch (p.command.requestType) {
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
        setArgs({})
        setForm(false)
        setFormData(null)
    }

    function onFormChange(args) {
        setFormData(args.formData)
    }

    return (<>
        <Button onClick={() => { setForm(true) }}>{p.command.name}</Button >
        <Popover 
            onClose={() => { setForm(false); setFormData({}); setArgs({}) }}
            id='root'
            open={form}
        >
            <Form validator={validator} schema={p.command.args} onChange={onFormChange} formData={formData} onSubmit={handleSubmit} />
        </Popover>
    </>)
}


function ServerItem(props: { server_info: ServerInfo }) {
    const commands = useContext(serverCommandsContext)
    const name = `${props.server_info.user_id}'s ${props.server_info.image.name} ${props.server_info.image.version} Server`
    if (props.server_info.ports === null) {
        props.server_info.ports = []
    }
    return (
        <serverIdContext.Provider value={props.server_info.id_}>
            <TableRow>
                <TableCell>{props.server_info.user_id}</TableCell>
                <TableCell>{props.server_info.image.name}</TableCell>
                <TableCell>{props.server_info.image.version}</TableCell>
                <TableCell>{props.server_info.domain}</TableCell>
                <TableCell>{props.server_info.ports.map((port, index, array) => { return <Chip label={`${port.number}/${port.protocol}`} /> })}</TableCell>
                <TableCell>
                    <ButtonGroup variant="outlined" aria-label="outlined button group">
                        {commands.map((command, index, array) => { return <Command command={command} /> })}
                    </ButtonGroup>
                </TableCell>
            </TableRow>
        </serverIdContext.Provider>
    )
}

class Port {
    number: number
    protocol: 'tcp' | 'udp'
}


class ImageInfo {
    name: string
    version: string
    ports: Port[]
}


class ServerInfo {
    id_: string
    name: string
    on: boolean
    user_id: string
    image: ImageInfo
    ports: Port[] | null
    domain: string
}

async function loadServers(api: AxiosInstance): Promise<{ status: number, data: ServerInfo[] }> {
    let response = await api.get('/servers')
    return {
        status: response.status,
        data: response.data
    }

}

const api: AxiosInstance = axios.create({
    baseURL: 'https://api.games.acooldomain.co',
});


export function ApiWrapper({ children }) {
    const token = Cookies.get('token')
    if (token){
        api.interceptors.request.use(
            async (config) => {
                config.headers.Authorization = `Bearer ${token}`;
                return config
            }
        );
    }
    const [apiAuthenticated, setApiAuthenticated] = useState(Boolean(token))
    if (!apiAuthenticated){
        Cookies.set('token', null)
    }
    const path = useLocation()
    return (<apiAuthenticatedContext.Provider value={[apiAuthenticated, setApiAuthenticated]}>
        {children}
        {!apiAuthenticated && path.key != '/login' && <Navigate to='/login'/>}
    </apiAuthenticatedContext.Provider>)
}


function loadApiDoc(api: AxiosInstance, path: string, method: string) {
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

function loadCommands(api: AxiosInstance): CommandInfo[] {
    const [commands, setCommands] = useState([])
    if (commands.length > 0) {
        return commands
    }

    api.get('/openapi.json').then(
        (value) => {
            let responseCommands = []
            let paths: Record<string, any> = value.data.paths
            for (let [path, request] of Object.entries(paths)) {
                if (path.startsWith('/servers/{server_id}')) {
                    for (let [method, schema] of Object.entries(request)) {
                        let formSchema = { title: schema.summary, type: 'object', required: [], properties: {}, definitions: value.data.components, default: {} }
                        if (schema.requestBody) {
                            formSchema = schema.requestBody.content['application/json'].schema
                            formSchema.definitions = value.data.components
                        }
                        responseCommands.push(new CommandInfo(schema.summary, JSON.parse(JSON.stringify(formSchema).replaceAll('#/components', '#/definitions')), method, path.slice('/servers/{server_id}/'.length)))
                    }
                }
            }
            setCommands(responseCommands)
        }
    )
    return commands
}

export default function ServersBoard() {
    const [servers, setServers] = useState([]);
    const [apiAuthenticated, setApiAuthenticated] = useContext(apiAuthenticatedContext)
    const [form, setForm] = useState(false);
    const [formData, setFormData] = useState({})
    const [images, setImages] = useState([])

    let schema = {
        "properties": {
            "image_id": {
                "type": "string",
                "oneOf": images.map((value, index, array) => { return { "const": value.id_, "title": `${value.name} ${value.version}` } }),
                "title": "Image Id"
            }
        },
        "type": "object",
        "required": [
            "image_id"
        ],
        "title": "CreateServer"
    }


    const [args, setArgs]: [Record<string, any>, Dispatch<Record<string, any>>] = useState({})

    function handleServers() {
        if (apiAuthenticated) {
            let servers_promised = loadServers(api)
            servers_promised.then((response) => {
                setServers(response.data)
            })
                .catch(
                    (error) => {
                        console.log('Failed to get servers: ' + error);
                        if (error.response) {
                            if (error.response.status == 401) {
                                setApiAuthenticated(false)
                            }
                            else if (error.response.status == 403) {
                                setApiAuthenticated(false)
                            }
                        }
                    }
                )
        }
    }

    useEffect(() => {
        handleServers()
        api.get('/images').then((value) => {
            setImages(value.data)
        }).catch(
            (error) => {
                console.log('Failed to get images: ' + error);
                if (error.response) {
                    if (error.response.status == 401) {
                        setApiAuthenticated(false)
                    }
                    else if (error.response.status == 403) {
                        setApiAuthenticated(false)
                    }
                }
            }
        )

        const interval = setInterval(() => {
            handleServers()
        }, 5000
        );
        return () => { clearInterval(interval) }
    }, [apiAuthenticated])

    if (!apiAuthenticated) {
        setApiAuthenticated(false)
    }

    function handleSubmit() {
        let url = `servers`
        api.post(url, formData)

        setArgs({})
        setForm(false)
        setFormData(null)
    }

    function onFormChange(args) {
        setFormData(args.formData)
    }


    return (<>
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Owner</TableCell>
                        <TableCell>Server</TableCell>
                        <TableCell>Version</TableCell>
                        <TableCell>Domain</TableCell>
                        <TableCell>Ports</TableCell>
                        <TableCell>Commands</TableCell>
                    </TableRow>
                </TableHead>
                <serverCommandsContext.Provider value={loadCommands(api)}>
                    {
                        servers.sort((s1: ServerInfo, s2: ServerInfo) => { return s1.id_ < s2.id_ ? 0 : 1 }).map(
                            (value: ServerInfo, index: number, array) => {
                                return <ServerItem server_info={value} />
                            }
                        )
                    }
                </serverCommandsContext.Provider>
            </Table>
            <Popover 
            onClose={() => { setForm(false); setFormData({}); setArgs({}) }}
            id='root'
            open={form}
        >
            <Form validator={validator} schema={schema} onChange={onFormChange} formData={formData} onSubmit={handleSubmit} />
        </Popover>
        </TableContainer>
        <Button variant="contained" onClick={() => { setForm(true) }}>Create Server</Button>
    </>
    );
}

const fetchToken = async (username: string, password: string) => {
    try {
        const response = await api.post('/token', {
            grant_type: 'password',
            username: username,
            password: password,
            client_id: null,
            client_secret: null,
        }, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
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

    const handleSubmit = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        fetchToken(data.get('username').toString(), data.get('password').toString()).then(
            (token) => {
                api.interceptors.request.use(
                    async (config) => {
                        config.headers.Authorization = `Bearer ${token}`;
                        return config
                    }
                );
                setApiAuthenticated(true)
                if (data.get('remember')){
                    Cookies.set('token', token)
                }
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


interface User {
    username: string
    email: string
    permissions: string[]
}

export function UsersPage({}) {
    const [apiAuthenticated, setApiAuthenticated] = useContext(apiAuthenticatedContext)
    const [users, setUsers]: [User[], Dispatch<User[]>] = useState([])

    const [form, setForm] = useState(false);
    const [formData, setFormData] = useState({})

    const [args, setArgs]: [Record<string, any>, Dispatch<Record<string, any>>] = useState({})

    const schema = loadApiDoc(api, '/users', 'post')

    function handleSubmit() {
        let url = `users`
        api.post(url, formData)

        setArgs({})
        setForm(false)
        setFormData(null)
    }

    function onFormChange(args) {
        setFormData(args.formData)
    }

    useEffect(() => {
        if (!apiAuthenticated) {
            return
        }
        api.get('/users').then((response) => { setUsers(response.data) }).catch(
            (error) => {
                console.log('Failed to get servers: ' + error);
                if (error.response) {
                    if (error.response.status == 401) {
                        setApiAuthenticated(false)
                    }
                    else if (error.response.status == 403) {
                        setApiAuthenticated(false)
                    }
                }
            }
        )

        const interval = setInterval(() => {
            api.get('/users').then((response) => { setUsers(response.data) }).catch(
                (error) => {
                    console.log('Failed to get users: ' + error);
                    if (error.response) {
                        if (error.response.status == 401) {
                            setApiAuthenticated(false)
                        }
                        else if (error.response.status == 403) {
                            setApiAuthenticated(false)
                        }
                    }
                }
            )

        }, 5000
        );
        return () => { clearInterval(interval) }
    }, [apiAuthenticated])

    let userComponents = []

    for (let user of users) {
        userComponents.push(<TableRow className='users-row'><TableCell className="users-column">{user.username}</TableCell><TableCell className="users-column">{user.email}</TableCell><TableCell className="users-column">{user.permissions}</TableCell></TableRow>)
    }
    return <TableContainer >
        <Table>
            <TableHead>
                <TableRow className="users-headers-row users-headers">
                    <TableCell className="users-column  users-headers">Username</TableCell><TableCell className="users-column users-headers">Email</TableCell><TableCell className="users-column users-headers">Permissions</TableCell>
                </TableRow>
            </TableHead>
            {userComponents}
        </Table>
        <Button variant="contained" onClick={() => { setForm(true) }}>
            Create User
        </Button>
        <Popover 
            onClose={() => { setForm(false); setFormData({}); setArgs({}) }}
            id='root'
            open={form}
        >
            <Form validator={validator} schema={schema} onChange={onFormChange} formData={formData} onSubmit={handleSubmit} />
        </Popover>
    </TableContainer>
}