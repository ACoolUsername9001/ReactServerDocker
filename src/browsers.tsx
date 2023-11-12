import { TableRow, TableCell, TableContainer, TableHead, Table, Button, Popover, Paper, TableBody, Chip, Link, ButtonGroup } from "@mui/material"
import React, { useContext, Dispatch, useState, useEffect, createContext } from "react"
import Form from "@rjsf/mui"
import { apiAuthenticatedContext, loadApiDoc, api } from "./common"
import validator from '@rjsf/validator-ajv8';
import { Browser, ServerInfo } from "./interfaces";
import { loadServers } from "./servers";

const browserContext = createContext(null)

function BrowserActions(){
    const browser = useContext(browserContext)
    const [form, setForm] = useState(false);
        let schema = {
        "properties": {

        },
        "type": "object",
        "required": [
        ],
        "title": "Stop Browser"
    }

    function handleSubmit() {
        let url = `browsers`
        api.delete(url, {data: {server_id: browser.connected_to.id_}})

        setForm(false)
    }
    return  (<>
    <ButtonGroup variant="outlined">
        <Button  rel="noopener noreferrer" target="_blank" href={`https://${browser.url}`}>Browse</Button>
        <Button onClick={()=>{
            setForm(true);

        }}>Stop</Button>
    </ButtonGroup>
    <Popover 
            onClose={() => { setForm(false); }}
            open={form}

        >
            <Form validator={validator} schema={schema} onSubmit={handleSubmit} />
        </Popover>
    </>
    )
}

export function BrowsersPage({}) {
    const [apiAuthenticated, setApiAuthenticated] = useContext(apiAuthenticatedContext)
    const [browsers, setBrowsers]: [Browser[], Dispatch<Browser[]>] = useState([])

    const [form, setForm] = useState(false);
    const [delete_form, setDeleteForm] = useState(false);
    const [formData, setFormData] = useState({})
    const [servers, setServers]: [ServerInfo[], Dispatch<ServerInfo[]>] = useState([])

    let schema = {
        "properties": {
            "server_id": {
                "type": "string",
                "oneOf": servers.map((value, index, array) => { return { "const": value.id_, "title": `${value.user_id}\`s ${value.image.name} ${value.image.version}` } }),
                "title": "Server ID"
            }
        },
        "type": "object",
        "required": [
            "server_id"
        ],
        "title": "Create Browser"
    }

    function handleSubmit() {
        let url = `browsers`
        api.post(url, formData)

        setForm(false)
        setFormData(null)
    }

    function onFormChange(args) {
        setFormData(args.formData)
    }

    useEffect(() => {
        if (!apiAuthenticated) {
            return
        }
        api.get('/browsers').then((response) => { setBrowsers(response.data) }).catch(
            (error) => {
                console.log('Failed to get Browsers: ' + error);
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
            api.get('/browsers').then((response) => { setBrowsers(response.data) }).catch(
                (error) => {
                    console.log('Failed to get Browsers: ' + error);
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

        }, 5000
        );
        return () => { clearInterval(interval) }
    }, [apiAuthenticated])

    let browserComponents = []

    for (let browser of browsers) {
        browserComponents.push(
            <browserContext.Provider value={browser}>
                <TableRow>
                    <TableCell>{browser.owner_id}</TableCell>
                    <TableCell>{browser.connected_to.user_id}</TableCell>
                    <TableCell>{browser.connected_to.image.name}</TableCell>
                    <TableCell>{browser.connected_to.image.version}</TableCell>
                    <TableCell>
                        <BrowserActions/>
                    </TableCell>
                </TableRow>
            </browserContext.Provider>
        )
    }
    return <TableContainer component={Paper} >
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Browser Owner</TableCell><TableCell>Server Owner</TableCell><TableCell>Server Game</TableCell><TableCell>Game Version</TableCell><TableCell>Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {browserComponents}
            </TableBody>
        </Table>
        <Button id={'create-browser-button'} variant="contained" onClick={() => { setForm(true); loadServers(api).then(({status, data})=>setServers(data)).catch((reason)=>console.log("Failed to load servers" + reason)) }}>
            Create Browser
        </Button>
        <Popover 
            onClose={() => { setForm(false); setFormData({}); }}
            anchorEl={document.getElementById('create-browser-button')}
            open={form}

        >
            <Form validator={validator} schema={schema} onChange={onFormChange} formData={formData} onSubmit={handleSubmit} />
        </Popover>
    </TableContainer>
}