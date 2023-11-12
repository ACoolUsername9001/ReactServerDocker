import { AxiosInstance } from "axios"
import { api, apiAuthenticatedContext } from "./common"
import React, { Context, Dispatch, createContext, useContext, useEffect, useState } from "react"
import { TableRow, TableCell, Chip, Button, ButtonGroup, Popover, Paper, Table, TableContainer, TableHead, TableBody } from "@mui/material"
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { ServerInfo } from "./interfaces"


class CommandInfo {
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

export async function loadServers(api: AxiosInstance): Promise<{ status: number, data: ServerInfo[] }> {
    let response = await api.get('/servers')
    return {
        status: response.status,
        data: response.data
    }
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

const serverIdContext: Context<string> = createContext('')
const serverCommandsContext: Context<CommandInfo[]> = createContext([])


function Command(p: { command: CommandInfo }) {
    const server_id: string = useContext(serverIdContext)
    const [form, setForm] = useState(false);
    const [formData, setFormData] = useState({})



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
        setForm(false)
        setFormData(null)
    }

    function onFormChange(args) {
        setFormData(args.formData)
    }

    return (<>
        <Button onClick={() => { setForm(true) }}>{p.command.name}</Button >
        <Popover 
            onClose={() => { setForm(false); setFormData({}); }}
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


    function handleServers() {
        if (!apiAuthenticated) {
            return
        }

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

    function handleSubmit() {
        let url = `servers`
        api.post(url, formData)

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
                <TableBody>

                    <serverCommandsContext.Provider value={loadCommands(api)}>
                        {
                            servers.sort((s1: ServerInfo, s2: ServerInfo) => { return s1.id_ < s2.id_ ? 0 : 1 }).map(
                                (value: ServerInfo, index: number, array) => {
                                    return <ServerItem server_info={value} />
                                }
                            )
                        }
                    </serverCommandsContext.Provider>
                </TableBody>
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

