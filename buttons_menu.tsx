import React, { Context, Dispatch, ReactElement, createContext, useContext, useEffect, useState } from "react"
import { View, StyleSheet, Text, ViewStyle, } from "react-native";
import axios, { AxiosInstance } from 'axios';
import { createPortal } from 'react-dom';
import { Navigate } from "react-router-dom";
import Form, { FormProps } from "react-jsonschema-form"

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
        let url = `servers/${server_id}/${p.command.endpoint}`
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

    function onFormChange(args: FormProps) {
        setFormData(args.formData)
    }
    if (form && p.command.args.properties && Object.entries(p.command.args.properties).length == 0) {
        handleSubmit()
    }
    return (<>
        <button className="command" onClick={() => { setForm(true) }}>
            <a className="commandText"> {p.command.name}</a>
        </button >
        {
            form && createPortal(
                <div className='form-background' onClick={() => { setForm(false); setFormData({}); setArgs({}) }}>
                    <div className='form' onClick={(e) => { e.stopPropagation() }}>
                        <Form schema={p.command.args} onChange={onFormChange} formData={formData} onSubmit={handleSubmit} />
                    </div>
                </div>, document.getElementById('container'))
        }
    </>)
}


function ServerItem(props: { name: string, on: boolean, id: string }) {
    const commands = useContext(serverCommandsContext)
    return (
        <serverIdContext.Provider value={props.id}>
            <div className="server" id={props.id} key={props.id}>
                <StatusRow on={props.on} text={props.name} />
                <div className="commandsGrid">
                    {commands.map((command, index, array) => { return <Command command={command} /> })}
                </div>
            </div>
        </serverIdContext.Provider>
    )
}


enum Protocol {
    TCP = 'tcp',
    UDP = 'udp'
}


class Port {
    number: number
    protocol: Protocol
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
    baseURL: 'http://127.0.0.1:8000',
});


export function ApiWrapper({ children }) {
    const [apiAuthenticated, setApiAuthenticated] = useState(false)
    return (<apiAuthenticatedContext.Provider value={[apiAuthenticated, setApiAuthenticated]}>
        {children}
    </apiAuthenticatedContext.Provider>)

    function omit(key, obj) {
        const { [key]: omitted, ...rest } = obj;
        return rest;
    }
}
function omit(key, obj) {
    const { [key]: omitted, ...rest } = obj;
    return rest;
}

function loadCommands(api: AxiosInstance): CommandInfo[] {
    const [commands, setCommands] = useState([])
    if (commands.length > 0) {
        console.log(commands)

        return commands
    }

    api.get('/openapi.json').then(
        (value) => {
            let responseCommands = []
            let paths: Record<string, any> = value.data.paths
            for (let [path, request] of Object.entries(paths)) {
                if (path.startsWith('/servers/{server_id}')) {
                    console.log(request)
                    for (let [method, schema] of Object.entries(request)) {
                        let formSchema = { title: schema.summary, type: 'object', required: [], properties: {}, definitions: value.data.components, default: {} }
                        console.log(formSchema)
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

export default function ServersBoard({ onFail }) {
    const [servers, setServers] = useState([]);
    const [apiAuthenticated, _] = useContext(apiAuthenticatedContext)
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
                                setServers(null)
                            }
                        }
                    }
                )
        }
    }

    useEffect(() => {
        handleServers()
        const interval = setInterval(() => {
            handleServers()   
        }, 5000
        );
        return () => { clearInterval(interval) }
    }, [apiAuthenticated])

    if (servers == null) {
        setServers([]);
        return onFail()
    }
    if (!apiAuthenticated) {
        return onFail();
    }
    servers.sort((s1: ServerInfo, s2: ServerInfo) => { return s1.id_ < s2.id_ ? 0 : 1 })
    return (
        <div className="grid">
            <serverCommandsContext.Provider value={loadCommands(api)}>
                {
                    servers.map(
                        (value: ServerInfo, index: number, array) => {
                            return <ServerItem name={value.user_id + '`s ' + value.image.name + ' ' + value.image.version + ' Server'} on={value.on} id={value.id_} />
                        }
                    )
                }
            </serverCommandsContext.Provider>
        </div>
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

// api.interceptors.request.use(
//   async (config) => {
//     const token = await fetchToken('ACoolName', 'Test');
//     config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );


export function LoginPage(props: {}) {
    const [username, setUsername] = useState(null)
    const [password, setPassword] = useState(null)
    const [apiAuthenticated, setApiAuthenticated] = useContext(apiAuthenticatedContext)
    if (apiAuthenticated) {
        return <Navigate to='/' />
    }

    const handleSubmit = () => {
        fetchToken(username, password).then(
            (token) => {
                api.interceptors.request.use(
                    async (config) => {
                        config.headers.Authorization = `Bearer ${token}`;
                        return config
                    }
                );
                setApiAuthenticated(true)
            },
            (error) => {
                return Promise.reject(error);
            }
        )
    }

    return (
        <div className="login-container">
            <div>
                <form className='text' onSubmit={handleSubmit}>
                    <div>
                        Username: <input type='text' name='username' onChange={(event) => { setUsername(event.target.value) }} />
                    </div>
                    <div>
                        Password:<input type='password' name='password' onChange={(event) => { setPassword(event.target.value) }} />
                    </div>
                    <input type="button" value="submit" onClick={handleSubmit}></input>
                </form>
            </div>
        </div>
    )
}
