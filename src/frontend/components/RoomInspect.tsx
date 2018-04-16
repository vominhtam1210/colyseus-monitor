import * as React from "react";
import * as http from "superagent";
import ReactJson from "react-json-view";

import { remoteRoomCall, fetchRoomData } from "../services";

import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
  TableFooter,
} from "material-ui/Table";

import { Tabs, Tab } from 'material-ui/Tabs';

import Dialog from 'material-ui/Dialog';

import RemoveIcon from 'material-ui/svg-icons/content/remove-circle';
import DeleteForeverIcon from 'material-ui/svg-icons/action/delete-forever';
import SendIcon from 'material-ui/svg-icons/content/send';

import FlatButton from 'material-ui/FlatButton';

const buttonStyle = { marginRight: 12 };

// fetch room data every 5 seconds.
const FETCH_DATA_INTERVAL = 5000;

export class RoomInspect extends React.Component {
    state = {
        roomId: undefined,
        state: {},
        clients: [],
        maxClients: 0,
        stateSize: 0,
        locked: false,

        sendDialogTitle: "",
        sendDialogOpen: false
    };

    updateDataInterval: number;

    componentDidMount() {
        this.fetchRoomData();
    }

    fetchRoomData () {
        const roomId = (this.props as any).match.params.roomId;

        fetchRoomData(roomId).
            then((response) => this.setState(response.body)).
            catch((err) => console.error(err));

        // re-set fetch interval
        clearInterval(this.updateDataInterval);
        this.updateDataInterval = window.setInterval(() => this.fetchRoomData(), FETCH_DATA_INTERVAL);
    }

    roomCall (method: string, ...args: any[]) {
        const roomId = (this.props as any).match.params.roomId

        return remoteRoomCall(roomId, method, ...args).
            then((response) => console.log(response.body)).
            catch((err) => console.error(err));
    }

    componentWillUnmount () {
        clearInterval(this.updateDataInterval);
    }

    sendMessage(sessionId?: string) {
        let sendDialogTitle = (sessionId)
            ? `Send message to client (${sessionId})`
            : "Broadcast message to all clients";

        this.setState({ sendDialogTitle, sendDialogOpen: true });
    }

    disconnectClient(sessionId: string) {
        this.roomCall('_forceClientDisconnect', sessionId).
            then(() => this.fetchRoomData());
    }

    disposeRoom () {
        this.roomCall('disconnect', this.state.roomId).
            then(() => {
                (this.props as any).history.push('/');
            });
    }

    handleCloseSend = () => {
        this.setState({ sendDialogOpen: false });
    }

    handleSend = () => {
        console.log("SEND MESSAGE!");
        this.handleCloseSend();
    }

    render() {
        const actions = [
            <FlatButton
                label="Cancel"
                primary={true}
                onClick={this.handleCloseSend}
            />,
            <FlatButton
                label="Submit"
                primary={true}
                keyboardFocused={true}
                onClick={this.handleSend}
            />,
        ];

        return (
            <div>
                <h2>{ this.state.roomId }</h2>
                <p>
                    locked: { this.state.locked.toString() }
                </p>

                <Tabs>
                    <Tab label="Clients">
                        <p>
                            clients: {this.state.clients.length} <br />
                            maxClients: {this.state.maxClients} <br />
                        </p>
                        <Table>
                            <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                                <TableRow>
                                    <TableHeaderColumn>id</TableHeaderColumn>
                                    <TableHeaderColumn>sessionId</TableHeaderColumn>
                                    <TableHeaderColumn>actions</TableHeaderColumn>
                                </TableRow>
                            </TableHeader>
                            <TableBody displayRowCheckbox={false}>
                                {this.state.clients.map((client, i) => (
                                    <TableRow key={client.sessionId}>
                                        <TableRowColumn>{client.id}</TableRowColumn>
                                        <TableRowColumn>{client.sessionId}</TableRowColumn>
                                        <TableRowColumn>
                                            <FlatButton
                                                label="Send"
                                                icon={<SendIcon />}
                                                style={buttonStyle}
                                                onClick={this.sendMessage.bind(this, client.sessionId)}
                                            />

                                            <FlatButton
                                                label="Disconnect"
                                                secondary={true}
                                                icon={<RemoveIcon />}
                                                style={buttonStyle}
                                                onClick={this.disconnectClient.bind(this, client.sessionId)}
                                            />
                                            {/* <FlatButton label="Broadcast" style={buttonStyle} /> */}
                                        </TableRowColumn>
                                    </TableRow>
                                ))}
                            </TableBody>

                            <TableFooter>
                                <TableRow>
                                    <TableHeaderColumn style={{ textAlign: "right" }} colSpan={3}>
                                        <FlatButton
                                            label="Broadcast"
                                            icon={<SendIcon />}
                                            onClick={this.sendMessage.bind(this, undefined)}
                                            style={buttonStyle}
                                        />

                                        <FlatButton
                                            label="Dispose room"
                                            secondary={true}
                                            icon={<DeleteForeverIcon />}
                                            onClick={this.disposeRoom.bind(this)}
                                            style={buttonStyle}
                                        />
                                    </TableHeaderColumn>
                                </TableRow>
                            </TableFooter>

                        </Table>
                    </Tab>

                    <Tab label="State">
                        <p>state size: {this.state.stateSize} bytes</p>
                        <ReactJson name={null} src={this.state.state} />
                    </Tab>
                </Tabs>

                <Dialog
                    title={this.state.sendDialogTitle}
                    actions={actions}
                    modal={false}
                    open={this.state.sendDialogOpen}
                    onRequestClose={this.handleCloseSend}
                    autoScrollBodyContent={true}
                >
                    <p>Message must be serializeable:</p>
                </Dialog>

            </div>
        );
    }
}
