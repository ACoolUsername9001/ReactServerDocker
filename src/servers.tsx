import { AxiosInstance } from "axios"
import { ActionGroup, ActionInfo, ActionItem, actionIdentifierContext, api, apiAuthenticatedContext, loadActions } from "./common"
import React, { Context, Dispatch, createContext, useContext, useEffect, useState } from "react"
import { TableRow, TableCell, Chip, Button, ButtonGroup, Popover, Paper, Table, TableContainer, TableHead, TableBody, Box } from "@mui/material"
import { ServerInfo } from "./interfaces"



export async function loadServers(api: AxiosInstance): Promise<{ status: number, data: ServerInfo[] }> {
    let response = await api.get('/servers')
    return {
        status: response.status,
        data: response.data
    }
}

const serverActionsContext: Context<ActionInfo[]> = createContext([])


function ServerItem(props: { server_info: ServerInfo }) {
    const actions = useContext(serverActionsContext)
    const name = `${props.server_info.user_id}'s ${props.server_info.image.name} ${props.server_info.image.version} Server`
    if (props.server_info.ports === null) {
        props.server_info.ports = []
    }
    return (
        <actionIdentifierContext.Provider value={props.server_info.id_}>
            <TableRow>
                <TableCell>{props.server_info.user_id}</TableCell>
                <TableCell>{props.server_info.image.name}</TableCell>
                <TableCell>{props.server_info.image.version}</TableCell>
                <TableCell>{props.server_info.domain}</TableCell>
                <TableCell>{props.server_info.ports.map((port, index, array) => { return <Chip label={`${port.number}/${port.protocol}`} /> })}</TableCell>
                <TableCell>
                    <ActionGroup actions={actions} identifierSubstring="server_id" />
                </TableCell>
            </TableRow>
        </actionIdentifierContext.Provider>
    )
}


export default function ServersBoard() {
    const [servers, setServers] = useState([]);
    const [apiAuthenticated, setApiAuthenticated] = useContext(apiAuthenticatedContext)
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



    return (
        <Box padding={4}>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Owner</TableCell>
                            <TableCell>Server</TableCell>
                            <TableCell>Version</TableCell>
                            <TableCell>Domain</TableCell>
                            <TableCell>Ports</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>

                        <serverActionsContext.Provider value={loadActions(api, '/servers/{server_id}')}>
                            {
                                servers.sort((s1: ServerInfo, s2: ServerInfo) => { return s1.id_ < s2.id_ ? 0 : 1 }).map(
                                    (value: ServerInfo, index: number, array) => {
                                        return <ServerItem server_info={value} />
                                    }
                                )
                            }
                        </serverActionsContext.Provider>
                    </TableBody>
                </Table>
            </TableContainer>
            <Box marginTop={2}>
                <ActionItem variant="contained" action={{ name: "Create Server", args: schema, requestType: 'post', endpoint: '/servers' }} />
            </Box>
        </Box>
    );
}

