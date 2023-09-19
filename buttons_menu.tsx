import React, { Context, ReactElement, createContext, useContext, useEffect, useState } from "react"
import { View, StyleSheet, Text, ViewStyle, } from "react-native";
import "./app.module.css"
import axios, { AxiosInstance } from 'axios';

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
    command_type: CommandType
    args: { [argument_id: string]: ArgumentType }
    constructor(name: string, args: { [argument_id: string]: ArgumentType } | null, command_type: CommandType) {
        this.name = name
        this.args = args
        this.command_type = command_type
    }
}


export class SendCommand extends CommandInfo {
    command_type = CommandType.StartServer

    constructor(name: string, args: { [argument_id: string]: ArgumentType }) {
        super(name = name, args = args, CommandType.StartServer)
        this.args = args
    }
}


function StatusRow(props: { text: string, on: boolean }) {
    return (<div className="statusBar">
        <div className={`statusIcon  ${props.on ? "statusIconOn" : "statusIconOff"}`} />
        <span className='text'>{props.text}</span>
    </div>)
}


function Command(props: { command: CommandInfo, handler: () => void }) {


    return (<button className="command" onClick={props.handler}>
        <a className="commandText"> {props.command.name}</a>
    </button>)
}


function ServerItem(props: { name: string, on: boolean, id: string, commands: Element[] }) {
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


function loadCommands() {
    const commands: CommandInfo[] = []
    commands.push(new CommandInfo('Start', { 'ports': ArgumentType.String }, CommandType.StartServer))
    commands.push(new CommandInfo('Stop', { 'ports': ArgumentType.String }, CommandType.Stop))
    // commands.push(new StreamCommand('Interactive Shell', null))
    // commands.push(new OpenCommand('File Browser', null))
    // commands.push(new SendCommand('Run Command', { 'command': ArgumentType.String }))
    return commands
}


function createHandler(api: AxiosInstance, server_id: string, command: CommandInfo): () => void {
    switch (command.command_type) {
        case CommandType.StartServer: {
            return async () => {
                return (await api.post(`/servers/${server_id}/start`)).data
            }
        }
        case CommandType.Delete: {
            return async () => { return (await api.delete(`/servers/${server_id}`)).data }
        }
        case CommandType.Browse: {
            return async () => { return (await api.post(`/servers/${server_id}/browse`)).data }
        }
        case CommandType.Stop: {
            return async () => { return (await api.post(`/servers/${server_id}/stop`)).data }
        }
    }
}


export default function ServersBoard(api: AxiosInstance, apiAuthenticated, onFail: () => any) {
    let commands = loadCommands()
    const [servers, setServers] = useState([]);
    useEffect(() => {
        const interval = setInterval(() => {
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
        }, 5000
        );
        return () => { clearInterval(interval) }
    }, [apiAuthenticated])

    if (servers == null) {
        setServers([]);
        return (
            <div>
                {onFail()}
            </div>
        )
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
                        return ServerItem({ name: value.user_id + '`s ' + value.image.name + ' ' + value.image.version + ' Server', on: value.on, id: value.id_, commands: commands.map((command, i, array) => { return Command({ command: command, handler: createHandler(api, value.id_, command) }) }) })
                    }
                )
            }
        </div>
    );
}