import { TableRow, TableCell, TableContainer, TableHead, Table, Button, Popover, Paper, TableBody, Chip, Link, ButtonGroup, Modal, Box } from "@mui/material"
import React, { useContext, Dispatch, useState, useEffect, createContext, Context } from "react"
import Form from "@rjsf/mui"
import { apiAuthenticatedContext, useApiDoc, api, ActionItem, formModalStyle, DataTable, useActions, ActionInfo, ActionGroup, actionIdentifierContext } from "./common"
import validator from '@rjsf/validator-ajv8';
import { Browser, ServerInfo } from "./interfaces";
import { loadServers } from "./servers";
import { JSONSchema7TypeName } from "json-schema";

const browserContext: Context<Browser> = createContext({} as Browser)
const browserActionContext: Context<ActionInfo[]|null> = createContext(null as ActionInfo[]|null)

function FakeAction(props: {action: ActionInfo, browser: Browser}){
    return  <Button rel="noopener noreferrer" target="_blank" href={`https://${props.browser.url}`}>{props.action.name}</Button>
}

function BrowserActions() {
    const actions = useContext(browserActionContext)
    const browser = useContext(browserContext)
    return <actionIdentifierContext.Provider value={browser.id_}>
        <ActionGroup actions={actions? actions:[]} identifierSubstring="browser_id">
            <FakeAction action={{name: 'Browse', requestType: 'post', endpoint: '', args:{}}} browser={browser}/>
        </ActionGroup>
    </actionIdentifierContext.Provider>
}

export function BrowsersPage({ }) {
    const [apiAuthenticated, setApiAuthenticated] = useContext(apiAuthenticatedContext)
    const [browsers, setBrowsers]: [Browser[], Dispatch<Browser[]>] = useState([]as Browser[])
    

    useEffect(() => {
        if (!apiAuthenticated) {
            return
        }
        api.get('/browsers').then((response) => { setBrowsers(response.data) }).catch(
            (error) => {
                console.log('Failed to get Browsers: ' + error);
                if (error.response) {
                    if (error.response.status === 401) {
                        setApiAuthenticated(false)
                    }
                    else if (error.response.status === 403) {
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
                        if (error.response.status === 401) {
                            setApiAuthenticated(false)
                        }
                        else if (error.response.status === 403) {
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
    return <DataTable headers={['Browser Owner', 'Server Owner', 'Server Game', 'Game Version', 'Actions']}>
        <browserActionContext.Provider value={useActions(api, '/browsers/{browser_id}')}>
            {browserComponents}
        </browserActionContext.Provider>
    </DataTable>
}