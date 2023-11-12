
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
