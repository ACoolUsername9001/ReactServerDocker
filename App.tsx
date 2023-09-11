import ServersBoard, { ArgumentType, CommandInfo, CommandType, OpenCommand, SendCommand, ServerItem as ServerComponent, ServerInfo, StreamCommand, getCommands, setCommands } from "./buttons_menu";
import "./app.module.css"



function loadServers(): { [server_id: string]: ServerInfo } {
  return {
    'some-id1': {
      name: 'ACoolMinecraftServer1',
      on: false,
    },
    'some-id2': {
      name: 'ACoolMinecraftServer2',
      on: false,
    },
    'some-id3': {
      name: 'ACoolMinecraftServer3',
      on: true,
    },
    'some-id4': {
      name: 'ACoolMinecraftServer4',
      on: false,
    },
    'some-id5': {
      name: 'ACoolMinecraftServer5',
      on: true,
    },
    'some-id6': {
      name: 'ACoolMinecraftServer6',
      on: false,
    },
  }
}

function loadCommands() {
  const commands: CommandInfo[] = []
  commands.push(new SendCommand('Start', { 'ports': ArgumentType.String }))
  commands.push(new StreamCommand('Interactive Shell', null))
  commands.push(new OpenCommand('File Browser', null))
  commands.push(new SendCommand('Run Command', { 'command': ArgumentType.String }))
  return commands
}


export default function App() {
  const servers = loadServers()
  const commands = loadCommands()
  return ServersBoard(servers, commands)
}
