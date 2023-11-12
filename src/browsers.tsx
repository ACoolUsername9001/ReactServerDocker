import { TableRow, TableCell, TableContainer, TableHead, Table, Button, Popover, Paper, TableBody, Chip, Link } from "@mui/material"
import React, { useContext, Dispatch, useState, useEffect } from "react"
import Form from "@rjsf/mui"
import { apiAuthenticatedContext, loadApiDoc, api } from "./common"
import validator from '@rjsf/validator-ajv8';
import { Browser } from "./interfaces";


export function BrowsersPage({}) {
    const [apiAuthenticated, setApiAuthenticated] = useContext(apiAuthenticatedContext)
    const [browsers, setBrowsers]: [Browser[], Dispatch<Browser[]>] = useState([])

    const [form, setForm] = useState(false);
    const [formData, setFormData] = useState({})

    function handleSubmit() {
        let url = `users`
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
        browserComponents.push(<TableRow><TableCell>{browser.owner_id}</TableCell><TableCell>{browser.connected_to.user_id}</TableCell><TableCell>{browser.connected_to.image.name}</TableCell><TableCell>{browser.connected_to.image.version}</TableCell><TableCell><Link rel="noopener noreferrer" target="_blank" href={`https://${browser.url}`} color='inherit'>Click to open!</Link></TableCell></TableRow>)
    }
    return <TableContainer component={Paper} >
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Browser Owner</TableCell><TableCell>Server Owner</TableCell><TableCell>Server Game</TableCell><TableCell>Game Version</TableCell><TableCell>Url</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {browserComponents}
            </TableBody>
        </Table>
        <Button variant="contained" onClick={() => { setForm(true) }}>
            Create Browser
        </Button>

    </TableContainer>
}