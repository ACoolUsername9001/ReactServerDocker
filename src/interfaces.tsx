
export interface Port {
    number: number
    protocol: 'tcp' | 'udp'
}


export interface ImageInfo {
    name: string
    version: string
    ports: Port[]
}


export interface ServerInfo {
    id_: string
    name: string
    on: boolean
    user_id: string
    image: ImageInfo
    ports: Port[] | null
    domain: string
}


export interface User {
    username: string
    email: string
    permissions: string[]
}


export interface Browser {
    id_: string
    domain: string
    url: string
    owner_id: string
    connected_to: ServerInfo
}
