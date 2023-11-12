import { TableRow, TableCell, TableContainer, TableHead, Table, Button, Popover } from "@mui/material"
import React, { useContext, Dispatch, useState, useEffect } from "react"
import Form from "@rjsf/mui"
import { apiAuthenticatedContext, loadApiDoc, api } from "./common"
import validator from '@rjsf/validator-ajv8';

interface User {
    username: string
    email: string
    permissions: string[]
}

export function UsersPage({}) {
    const [apiAuthenticated, setApiAuthenticated] = useContext(apiAuthenticatedContext)
    const [users, setUsers]: [User[], Dispatch<User[]>] = useState([])

    const [form, setForm] = useState(false);
    const [formData, setFormData] = useState({})

    const [args, setArgs]: [Record<string, any>, Dispatch<Record<string, any>>] = useState({})

    const schema = loadApiDoc(api, '/users', 'post')

    function handleSubmit() {
        let url = `users`
        api.post(url, formData)

        setArgs({})
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
        api.get('/users').then((response) => { setUsers(response.data) }).catch(
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

        const interval = setInterval(() => {
            api.get('/users').then((response) => { setUsers(response.data) }).catch(
                (error) => {
                    console.log('Failed to get users: ' + error);
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

    let userComponents = []

    for (let user of users) {
        userComponents.push(<TableRow className='users-row'><TableCell className="users-column">{user.username}</TableCell><TableCell className="users-column">{user.email}</TableCell><TableCell className="users-column">{user.permissions}</TableCell></TableRow>)
    }
    return <TableContainer >
        <Table>
            <TableHead>
                <TableRow className="users-headers-row users-headers">
                    <TableCell className="users-column  users-headers">Username</TableCell><TableCell className="users-column users-headers">Email</TableCell><TableCell className="users-column users-headers">Permissions</TableCell>
                </TableRow>
            </TableHead>
            {userComponents}
        </Table>
        <Button variant="contained" onClick={() => { setForm(true) }}>
            Create User
        </Button>
        <Popover 
            onClose={() => { setForm(false); setFormData({}); setArgs({}) }}
            id='root'
            open={form}
        >
            <Form validator={validator} schema={schema} onChange={onFormChange} formData={formData} onSubmit={handleSubmit} />
        </Popover>
    </TableContainer>
}