import { TableRow, TableCell, TableContainer, TableHead, Table, Button, Paper, TableBody, Chip, Modal, Box } from "@mui/material"
import React, { useContext, Dispatch, useState, useEffect, Context, createContext } from "react"
import Form from "@rjsf/mui"
import { apiAuthenticatedContext, loadApiDoc, api, ActionInfo, loadActions, ActionGroup, actionIdentifierContext, ActionItem } from "./common"
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
            <TableCell><ActionGroup actions={userActions} identifierSubstring="username" /></TableCell>
        </TableRow>
    )
}

export function UsersPage({ }) {
    const [apiAuthenticated, setApiAuthenticated] = useContext(apiAuthenticatedContext)
    const [users, setUsers]: [User[], Dispatch<User[]>] = useState([])

    const schema = loadApiDoc(api, '/users', 'post')

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

    return <Box padding={4}>
        <TableContainer component={Paper}>
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
        </TableContainer>
        <Box marginTop={2}>
            <ActionItem action={{ name: 'Invite User', args: schema, endpoint: '/users', requestType: 'post' }} variant='contained' />
        </Box>
    </Box>
}