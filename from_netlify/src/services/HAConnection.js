/**
 * --- HA FUSION-INSPIRED WEBSOCKET CLIENT ---
 */
class HAConnection {
    constructor(url, token, onStateChange, onConnect, onDisconnect) {
        this.url = url.replace(/\/$/, '');
        this.token = token;
        this.socket = null;
        this.id = 1;
        this.onStateChange = onStateChange;
        this.onConnect = onConnect;
        this.onDisconnect = onDisconnect;
        this.states = {};
        this.connected = false;
        this.reconnectTimer = null;
        this.pendingRequests = {}; // Track pending requests for promise resolution
        this.pendingRequestTypes = {}; // Track types of pending requests to parse results correctly
    }

    connect() {
        let wsUrl = this.url;
        if (wsUrl.startsWith('https')) {
            wsUrl = wsUrl.replace(/^https/, 'wss');
        } else {
            wsUrl = wsUrl.replace(/^http/, 'ws');
        }
        wsUrl = `${wsUrl}/api/websocket`;

        try {
            this.socket = new WebSocket(wsUrl);
            this.socket.onopen = () => console.log('WS: Opening connection...');
            this.socket.onmessage = this.handleMessage.bind(this);
            this.socket.onclose = this.handleClose.bind(this);
            this.socket.onerror = (e) => console.error('WS Error:', e);
        } catch (e) {
            console.error("Connection failed", e);
            this.handleClose();
        }
    }

    handleMessage(event) {
        const msg = JSON.parse(event.data);

        if (msg.type === 'auth_required') {
            this.send({ type: 'auth', access_token: this.token });
        } else if (msg.type === 'auth_ok') {
            this.connected = true;
            this.onConnect();
            this.send({ type: 'subscribe_events', event_type: 'state_changed' });
            this.send({ type: 'get_states' });
        } else if (msg.type === 'auth_invalid') {
            console.error("Auth Invalid");
            this.disconnect();
        } else if (msg.type === 'result') {
            // Get the original request type before deleting it
            const requestType = msg.id ? this.pendingRequestTypes[msg.id] : null;

            // Handle pending promise resolution
            if (msg.id && this.pendingRequests[msg.id]) {
                const { resolve, reject } = this.pendingRequests[msg.id];
                if (msg.success) {
                    resolve(msg.result);
                } else {
                    reject(new Error(msg.error?.message || 'Service call failed'));
                }
                delete this.pendingRequests[msg.id];
            }

            // Clean up request type tracker
            if (msg.id) {
                delete this.pendingRequestTypes[msg.id];
            }

            // ONLY handle state updates if this was explicitly a get_states request
            // BUGFIX: Previously, this parsed ANY array response (like Area/Device Registry) as states!
            if (msg.success && msg.result && Array.isArray(msg.result) && requestType === 'get_states') {
                msg.result.forEach(state => {
                    this.states[state.entity_id] = state;
                });
                this.onStateChange({ ...this.states });
            }
        } else if (msg.type === 'event' && msg.event.event_type === 'state_changed') {
            const { entity_id, new_state } = msg.event.data;
            this.states[entity_id] = new_state;
            this.onStateChange({ ...this.states });
        }
    }

    send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            if (data.type !== 'auth') {
                data.id = this.id++;
                this.pendingRequestTypes[data.id] = data.type; // Keep track of request type
            }
            this.socket.send(JSON.stringify(data));
            return data.id; // Return the message ID for tracking
        }
        return null;
    }

    /**
     * Send a message and wait for response (Promise-based)
     * Used for registry queries and other request/response patterns
     */
    sendMessage(data) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(new Error('Not connected to Home Assistant'));
                return;
            }

            const messageId = this.send(data);

            if (messageId) {
                // Store the promise callbacks for this request
                this.pendingRequests[messageId] = { resolve, reject };

                // Set a timeout to reject if no response after 30 seconds
                setTimeout(() => {
                    if (this.pendingRequests[messageId]) {
                        delete this.pendingRequests[messageId];
                        reject(new Error('Request timeout'));
                    }
                }, 30000);
            } else {
                reject(new Error('Failed to send message'));
            }
        });
    }

    callService(domain, service, serviceData = {}) {
        return this.sendMessage({
            type: 'call_service',
            domain,
            service,
            service_data: serviceData
        });
    }

    handleClose() {
        this.connected = false;
        this.onDisconnect();
        if (!this.reconnectTimer) {
            this.reconnectTimer = setTimeout(() => {
                this.reconnectTimer = null;
                this.connect();
            }, 5000);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
}

export default HAConnection;
