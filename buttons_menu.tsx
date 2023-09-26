import React, { Context, Dispatch, ReactElement, createContext, useContext, useEffect, useState } from "react"
import { View, StyleSheet, Text, ViewStyle, } from "react-native";
import "./app.module.css"
import axios, { AxiosInstance } from 'axios';
import { createPortal } from 'react-dom';
import { Navigate } from "react-router-dom";
import Form from "react-jsonschema-form"

const apiAuthenticatedContext: Context<[boolean, Dispatch<boolean>]> = createContext(null)


export enum ArgumentType {
    Number = "Number",
    String = "String",
    Boolean = "Boolean"
}


export enum CommandType {
    Browse = 'Browse',
    StartServer = 'Start Server',
    RunCommand = 'RunCommand',
    Stop = 'Stop',
    Delete = 'Delete',
}

export class CommandInfo {
    name: string
    server_id: string
    command_type: CommandType
    args: {}
    constructor(server_id: string, name: string, args: {} | null, command_type: CommandType) {
        this.server_id = server_id
        this.name = name
        this.args = args
        this.command_type = command_type
    }
}


function StatusRow(props: { text: string, on: boolean }) {
    return (<div className="statusBar">
        <div className={`statusIcon  ${props.on ? "statusIconOn" : "statusIconOff"}`} />
        <span className='text'>{props.text}</span>
    </div>)
}

function FormTest(p: { command: CommandInfo, onCancel: () => void }) {
    const [args, setArgs]: [Record<string, any>, Dispatch<Record<string, any>>] = useState({})
    function handleSubmit() {
        switch (p.command.command_type) {
            case CommandType.StartServer: {
                api.post(`/servers/${p.command.server_id}/start`, args)
                break
            }
            case CommandType.Stop: {
                api.post(`/servers/${p.command.server_id}/stop`, args)
                break
            }
            case CommandType.Delete: {
                api.delete(`/servers/${p.command.server_id}`, args)
                break
            }
        }
        setArgs({})
        p.onCancel()
    }

    if (Object.entries(p.command.args).length == 0) {
        handleSubmit()
    }

    return <div className='form-background' onClick={p.onCancel}>
        <div className='form' onClick={(e) => { e.stopPropagation() }}>
            <button onClick={handleSubmit}>Submit</button>
        </div>
    </div>
}


function Command(props: { command: CommandInfo }) {
    let [form, setForm] = useState(false);
    let [formData, setFormData] = useState(null)

    const [args, setArgs]: [Record<string, any>, Dispatch<Record<string, any>>] = useState({})
    function handleSubmit() {
        switch (props.command.command_type) {
            case CommandType.StartServer: {
                api.post(`/servers/${props.command.server_id}/start`, args)
                break
            }
            case CommandType.Stop: {
                api.post(`/servers/${props.command.server_id}/stop`, args)
                break
            }
            case CommandType.Delete: {
                api.delete(`/servers/${props.command.server_id}`, args)
                break
            }
        }
        setArgs({})
        setForm(false)
        setFormData(null)
    }

    function onFormChange(args: Record<string, any>) {
        setFormData(args.formData)
    }
    let yourForm;

    return (<>
        <button className="command" onClick={() => { setForm(true) }}>
        <a className="commandText"> {props.command.name}</a>
        </button >
        {
            form && createPortal(
                <div className='form-background'>
                    <div className='form' onClick={(e) => { e.stopPropagation() }}>
                        {<Form schema={props.command.args} onChange={onFormChange} formData={formData} />}
                    </div>
                </div>, document.getElementById('container'))
        }
    </>)
}


function ServerItem(props: { name: string, on: boolean, id: string, commands }) {
    return (
        <div className="server" id={props.id} key={props.id}>
            <StatusRow on={props.on} text={props.name} />
            <div className="commandsGrid">
                {props.commands}
            </div>
        </div>
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
            {
                servers.map(
                    (value: ServerInfo, index: number, array) => {
                        let commands = [!value.on ? new CommandInfo(value.id_, 'Start', {
                            "anyOf": [
                                {
                                    "type": "object",
                                    "additionalProperties": {
                                        "properties": {
                                            "number": {
                                                "type": "integer",
                                                "exclusiveMaximum": 65535,
                                                "exclusiveMinimum": 1,
                                                "title": "Number"
                                            },
                                            "protocol": {
                                                "type": "string",
                                                "enum": [
                                                    "tcp",
                                                    "udp"
                                                ],
                                                "title": "PortProtocol"
                                            }
                                        },
                                        "type": "object",
                                        "required": [
                                            "number",
                                            "protocol"
                                        ],
                                        "title": "Port"
                                    }
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Ports"
                        }, CommandType.StartServer) : new CommandInfo(value.id_, 'Stop', {}, CommandType.Stop)]
                        return <ServerItem name={value.user_id + '`s ' + value.image.name + ' ' + value.image.version + ' Server'} on={value.on} id={value.id_} commands={commands.map((command, i, array) => { return <Command command={command} /> })} />
                    }
                )
            }
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
