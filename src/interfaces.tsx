import { JSONSchema6, JSONSchema7 } from "json-schema"

export interface Port {
    number: number
    protocol: 'tcp' | 'udp'
}


export interface ImageInfo {
    id_: string
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


export interface OpenApiMethodSchema {
    summary: string
    requestBody: {content: Record<string, {schema: JSONSchema7}>}
}


export interface OpenAPISchema {
    data: {
        paths: Record<string, {get?: OpenApiMethodSchema, post?: OpenApiMethodSchema, delete?: OpenApiMethodSchema}>
        components: {schema: Record<string, JSONSchema7>}
    }
}