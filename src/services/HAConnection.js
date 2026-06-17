import {
    callService as wsCallService,
    createConnection,
    createLongLivedTokenAuth,
    subscribeEntities
} from 'home-assistant-js-websocket';

/**
 * Home Assistant websocket facade.
 *
 * Keeps the app's existing connection API while delegating auth, reconnects,
 * request/response handling, and entity subscriptions to the official client.
 */
class HAConnection {
    constructor(url, token, onStateChange, onConnect, onDisconnect, onStage = () => { }) {
        this.url = url.replace(/\/$/, '');
        this.hassUrl = this.url;
        this.token = token;
        this.accessToken = token;
        this.auth = null;
        this.connection = null;
        this.unsubscribeEntities = null;
        this.onStateChange = onStateChange;
        this.onConnect = onConnect;
        this.onDisconnect = onDisconnect;
        this.onStage = onStage;
        this.states = {};
        this.connected = false;
        this.manualDisconnect = false;
        this.connecting = false;
        this.disconnectTimer = null;
        this.initialSnapshotReceived = false;

        this.handleReady = this.handleReady.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);
        this.handleReconnectError = this.handleReconnectError.bind(this);
    }

    connect() {
        if (this.connecting || this.connected) return;

        this.manualDisconnect = false;
        this.connecting = true;
        this.setStage({
            id: 'starting',
            message: 'Starting Control Hub connection',
            detail: this.hassUrl,
            progress: 22
        });
        this.openConnection().catch((error) => {
            this.connecting = false;
            this.connected = false;
            console.error('HA websocket connection failed:', error);
            this.setStage({
                id: 'failed',
                message: 'Control Hub connection failed',
                detail: error?.message || 'Unable to reach the Control Hub',
                progress: 100
            });
            this.onDisconnect(error);
        });
    }

    async openConnection() {
        this.setStage({
            id: 'authenticating',
            message: 'Preparing token authentication',
            detail: 'Long-lived access token',
            progress: 32
        });
        this.auth = createLongLivedTokenAuth(this.url, this.token);
        this.setStage({
            id: 'opening_socket',
            message: 'Opening Home Assistant websocket',
            detail: this.hassUrl,
            progress: 48
        });
        this.connection = await createConnection({
            auth: this.auth,
            setupRetry: 3
        });

        this.setStage({
            id: 'socket_ready',
            message: 'Websocket connected',
            detail: 'Registering connection listeners',
            progress: 62
        });
        this.connection.addEventListener('ready', this.handleReady);
        this.connection.addEventListener('disconnected', this.handleDisconnected);
        this.connection.addEventListener('reconnect-error', this.handleReconnectError);

        this.setStage({
            id: 'subscribing_entities',
            message: 'Subscribing to entity state stream',
            detail: 'Waiting for the first dashboard snapshot',
            progress: 76
        });

        let resolveInitialSnapshot;
        const initialSnapshot = new Promise((resolve) => {
            resolveInitialSnapshot = resolve;
        });
        let initialSnapshotTimeout;

        this.unsubscribeEntities = subscribeEntities(this.connection, (states) => {
            this.states = states || {};
            this.onStateChange({ ...this.states });
            if (!this.initialSnapshotReceived) {
                this.initialSnapshotReceived = true;
                const entityCount = Object.keys(this.states).length;
                this.setStage({
                    id: 'entities_synced',
                    message: 'Received entity state snapshot',
                    detail: `${entityCount} entities synced`,
                    progress: 92
                });
                resolveInitialSnapshot(entityCount);
            }
        });

        await Promise.race([
            initialSnapshot,
            new Promise((resolve) => {
                initialSnapshotTimeout = setTimeout(() => {
                    if (!this.initialSnapshotReceived) {
                        this.setStage({
                            id: 'entity_stream_pending',
                            message: 'Entity stream is still warming up',
                            detail: 'Opening the dashboard while states continue syncing',
                            progress: 88
                        });
                    }
                    resolve();
                }, 3000);
            })
        ]);
        if (initialSnapshotTimeout) {
            clearTimeout(initialSnapshotTimeout);
        }

        this.connecting = false;
        this.handleReady();
    }

    handleReady() {
        if (this.disconnectTimer) {
            clearTimeout(this.disconnectTimer);
            this.disconnectTimer = null;
        }
        this.connected = true;
        this.setStage({
            id: 'ready',
            message: 'Control Hub online',
            detail: this.initialSnapshotReceived
                ? `${Object.keys(this.states).length} entities available`
                : 'Entity stream continues in the background',
            progress: 100
        });
        this.onConnect();
    }

    handleDisconnected() {
        this.connected = false;
        if (!this.manualDisconnect) {
            this.setStage({
                id: 'reconnecting',
                message: 'Websocket interrupted',
                detail: 'Waiting for Home Assistant to reconnect',
                progress: 65
            });
            if (this.disconnectTimer) {
                clearTimeout(this.disconnectTimer);
            }
            this.disconnectTimer = setTimeout(() => {
                this.disconnectTimer = null;
                if (!this.manualDisconnect && !this.connected) {
                    this.onDisconnect();
                }
            }, 4000);
        }
    }

    handleReconnectError(_connection, error) {
        console.error('HA websocket reconnect failed:', error);
        this.setStage({
            id: 'reconnect_error',
            message: 'Reconnect attempt failed',
            detail: error?.message || 'Home Assistant websocket retry failed',
            progress: 70
        });
    }

    setStage(stage) {
        this.onStage(stage);
    }

    /**
     * Send a request/response websocket command.
     * Used for registry queries and other Home Assistant websocket commands.
     */
    sendMessage(data) {
        if (!this.connection || !this.connected) {
            return Promise.reject(new Error('Not connected to Home Assistant'));
        }

        return this.connection.sendMessagePromise(data);
    }

    callService(domain, service, serviceData = {}, target = {}) {
        if (!this.connection || !this.connected) {
            return Promise.reject(new Error('Not connected to Home Assistant'));
        }

        return wsCallService(this.connection, domain, service, serviceData, target);
    }

    async disconnect() {
        this.manualDisconnect = true;
        this.connecting = false;
        this.setStage({
            id: 'disconnecting',
            message: 'Disconnecting from Control Hub',
            detail: 'Closing websocket and entity subscriptions',
            progress: 95
        });

        if (this.disconnectTimer) {
            clearTimeout(this.disconnectTimer);
            this.disconnectTimer = null;
        }

        if (this.unsubscribeEntities) {
            await this.unsubscribeEntities();
            this.unsubscribeEntities = null;
        }

        if (this.connection) {
            this.connection.removeEventListener('ready', this.handleReady);
            this.connection.removeEventListener('disconnected', this.handleDisconnected);
            this.connection.removeEventListener('reconnect-error', this.handleReconnectError);
            this.connection.close();
            this.connection = null;
        }

        this.connected = false;
    }
}

export default HAConnection;
