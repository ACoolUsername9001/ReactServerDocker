import React, { ReactElement, useState } from "react"
import { View, StyleSheet, Text, ViewStyle, } from "react-native";
import "./app.module.css"

export enum ArgumentType {
    Number = "Number",
    String = "String",
    Boolean = "Boolean"
}


export enum CommandType {
    Browse = 'Browse',
    Send = 'Send',
    Stream = 'Stream',
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
    command_type = CommandType.Send

    constructor(name: string, args: { [argument_id: string]: ArgumentType }) {
        super(name = name, args = args, CommandType.Send)
        this.args = args
    }
}

export class StreamCommand extends CommandInfo {
    command_type = CommandType.Stream
    constructor(name: string, args: { [argument_id: string]: ArgumentType }) {
        super(name = name, args = args, CommandType.Stream)
    }
}


export class OpenCommand extends CommandInfo {
    command_type = CommandType.Browse
    constructor(name: string, args: { [argument_id: string]: ArgumentType }) {
        super(name = name, args = args, CommandType.Browse)
    }
}


function StatusRow(props: { text: string, on: boolean }) {
    return (<div className="statusBar">
        <div className={`statusIcon  ${props.on ? "statusIconOn" : "statusIconOff"}`} />
        <span className='text'>{props.text}</span>
    </div>)
}


function Command(props: { command: CommandInfo }) {


    return (<button className="command">
        <a className="commandText"> {props.command.name}</a>
    </button>)
}


function ServerItem(props: { name: string, on: boolean, id: string, commands: CommandInfo[] }) {
    const commandsElements: ReactElement[] = [];
    for (let command of props.commands) {
        commandsElements.push(Command({ command: command }))
    }
    return (
        <div className="server" id={props.id}>
            <StatusRow on={props.on} text={props.name} />
            <div className="commandsGrid">
                {commandsElements}
            </div>
        </div>
    )
}



export class ServerInfo {
    name: string
    on: boolean
}


export default function ServersBoard(servers: { [server_id: string]: ServerInfo }, commands: CommandInfo[]) {
    const serverComponents = []
    for (let [server_id, info] of Object.entries(servers)) {
        serverComponents.push(ServerItem({ id: server_id, on: info.on, name: info.name, commands: commands }))
    }
    return (
        <div className="container">
            <div className="grid">
                {serverComponents}
            </div>
        </div>
    );
}