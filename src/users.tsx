import { TableRow, TableCell, TableContainer, TableHead, Table, Button, Paper, TableBody, Chip, Modal, Box } from "@mui/material"
import React, { useContext, Dispatch, useState, useEffect, Context, createContext } from "react"
import Form from "@rjsf/mui"
import { apiAuthenticatedContext, useApiDoc, api, ActionInfo, useActions, ActionGroup, actionIdentifierContext, ActionItem, DataTable } from "./common"
import validator from '@rjsf/validator-ajv8';
import { User } from './interfaces'

const UserActionsContext: Context<ActionInfo[]> = createContext([] as ActionInfo[])


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
    const [users, setUsers]: [User[], Dispatch<User[]>] = useState([] as User[])

    const schema = useApiDoc(api, '/users', 'post')

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

    return <DataTable headers={['Username', 'Email', 'Permissions', 'Actions']} actionInfo={{ name: 'Invite User', args: schema, endpoint: '/users', requestType: 'post' }}>
        <UserActionsContext.Provider value={useActions(api, '/users/{username}')}>
            {userComponents}
        </UserActionsContext.Provider>
    </DataTable>
}