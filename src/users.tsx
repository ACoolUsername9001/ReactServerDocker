import { TableRow, TableCell, TableContainer, TableHead, Table, Button, Popover, Paper, TableBody, Chip } from "@mui/material"
import React, { useContext, Dispatch, useState, useEffect, Context, createContext } from "react"
import Form from "@rjsf/mui"
import { apiAuthenticatedContext, loadApiDoc, api, ActionInfo, loadActions, ActionGroup, actionIdentifierContext } from "./common"
import validator from '@rjsf/validator-ajv8';
import { User } from './interfaces'

const UserActionsContext: Context<ActionInfo[]> = createContext([])


function UserItem(p: { user: User }) {
    const user = p.user;
    const userActions = useContext(UserActionsContext)

    return (
        <TableRow>
            <TableCell>{user.username}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.permissions.map((value, index, array) => { return <Chip label={value} /> })}</TableCell>
            <TableCell><ActionGroup actions={userActions} identifierSubstring="username"/></TableCell>
        </TableRow>
    )
}

export function UsersPage({ }) {
    const [apiAuthenticated, setApiAuthenticated] = useContext(apiAuthenticatedContext)
    const [users, setUsers]: [User[], Dispatch<User[]>] = useState([])

    const [form, setForm] = useState(false);
    const [formData, setFormData] = useState({})


    const schema = loadApiDoc(api, '/users', 'post')

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
        userComponents.push(<actionIdentifierContext.Provider value={user.username}><UserItem user={user} /></actionIdentifierContext.Provider>)
    }

    return <TableContainer component={Paper} >
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Permissions</TableCell>
                    <TableCell>Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                <UserActionsContext.Provider value={loadActions(api, '/users/{username}')}>
                    {userComponents}
                </UserActionsContext.Provider>
            </TableBody>
        </Table>
        <Button variant="contained" onClick={() => { setForm(true) }}>
            Create User
        </Button>
        <Popover
            onClose={() => { setForm(false); setFormData({}); }}
            id='root'
            open={form}
        >
            <Form validator={validator} schema={schema} onChange={onFormChange} formData={formData} onSubmit={handleSubmit} />
        </Popover>
    </TableContainer>
}