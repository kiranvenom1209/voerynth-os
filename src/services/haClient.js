/**
 * Home Assistant Client Layer
 *
 * Provides a unified interface for WebSocket and REST communication with Home Assistant.
 * Uses home-assistant-js-websocket for WebSocket connections.
 */

import {
  createConnection,
  createLongLivedTokenAuth,
  callService as wsCallService,
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
  ERR_CONNECTION_LOST,
  ERR_HASS_HOST_REQUIRED,
  ERR_INVALID_HTTPS_TO_HTTP
} from 'home-assistant-js-websocket';

class HAClient {
  constructor() {
    this.connection = null;
    this.auth = null;
    this.haConnection = null; // Reference to existing HAConnection
    this.hassUrl = null;
    this.accessToken = null;
  }

  /**
   * Set the existing HAConnection instance (from HomeAssistantContext)
   * @param {HAConnection} haConnection - The existing HAConnection instance
   */
  setHAConnection(haConnection) {
    this.haConnection = haConnection;
    console.log('✅ HAClient: Using existing HAConnection');
  }

  /**
   * Connect to Home Assistant WebSocket API
   * @param {string} url - Home Assistant URL (e.g., "http://homeassistant.local:8123")
   * @param {string} token - Long-lived access token
   * @returns {Promise<void>}
   */
  async connect(url, token) {
    try {
      this.hassUrl = url.replace(/\/$/, '');
      this.accessToken = token;
      this.auth = createLongLivedTokenAuth(this.hassUrl, this.accessToken);

      this.connection = await createConnection({
        auth: this.auth,
        setupRetry: 3
      });

      console.log('✅ HA Client connected via WebSocket');
      return this.connection;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Call a WebSocket command (request/response pattern)
   * @param {string} type - Message type (e.g., "config/entity_registry/list")
   * @param {object} payload - Additional message data
   * @returns {Promise<any>}
   */
  async callWS(type, payload = {}) {
    // Use existing HAConnection if available
    if (this.haConnection && this.haConnection.connected) {
      console.log('📤 HAClient.callWS:', type);
      const response = await this.haConnection.sendMessage({ type, ...payload });
      console.log('📥 HAClient.callWS response:', type, response);
      return response;
    }

    // Fallback to home-assistant-js-websocket connection
    if (!this.connection) {
      throw new Error('Not connected to server');
    }

    return this.connection.sendMessagePromise({
      type,
      ...payload
    });
  }

  /**
   * Subscribe to WebSocket events
   * @param {string} type - Subscription type
   * @param {object} payload - Subscription parameters
   * @param {function} handler - Event handler function
   * @returns {Promise<function>} Unsubscribe function
   */
  async subscribeWS(type, payload, handler) {
    const connection = this.haConnection?.connection || this.connection;

    if (!connection) {
      throw new Error('Not connected to Home Assistant');
    }

    return connection.subscribeMessage(
      handler,
      {
        type,
        ...payload
      }
    );
  }

  async callSupervisorApi(method, endpoint, data = null, options = {}) {
    const supervisorEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const payload = {
      endpoint: supervisorEndpoint,
      method: method.toLowerCase()
    };

    if (data) {
      payload.data = data;
    }

    if (options.params) {
      payload.params = options.params;
    }

    if (options.timeout !== undefined) {
      payload.timeout = options.timeout;
    }

    return this.callWS('supervisor/api', payload);
  }

  /**
   * Call a service
   * @param {string} domain - Service domain (e.g., "light")
   * @param {string} service - Service name (e.g., "turn_on")
   * @param {object} data - Service data
   * @param {object} target - Service target (entity_id, device_id, area_id)
   * @returns {Promise<any>}
   */
  async callService(domain, service, data = {}, target = {}) {
    if (this.haConnection && this.haConnection.connected) {
      return this.haConnection.callService(domain, service, {
        ...data,
        ...target
      });
    }

    if (!this.connection) {
      throw new Error('Not connected to server');
    }

    try {
      return await wsCallService(this.connection, domain, service, {
        ...data,
        ...target
      });
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async parseResponse(response) {
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  formatHttpError(response, result) {
    const detail = typeof result === 'string'
      ? result
      : result?.message || result?.error || result?.result;

    return `HTTP ${response.status}: ${detail || response.statusText}`;
  }

  /**
   * Make a REST API call to Home Assistant
   * @param {string} endpoint - API endpoint (e.g., "/api/states")
   * @param {object} options - Fetch options
   * @returns {Promise<any>}
   */
  async callREST(endpoint, options = {}) {
    if (!this.auth) {
      throw new Error('Not authenticated');
    }

    const url = `${this.hassUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const result = await this.parseResponse(response);

    if (!response.ok) {
      throw new Error(this.formatHttpError(response, result));
    }

    return result;
  }

  /**
   * Make an API call to Home Assistant (similar to Home Assistant frontend's callApi)
   * @param {string} method - HTTP method (GET, POST, DELETE, etc.)
   * @param {string} path - API path (e.g., "config/config_entries/entry/abc123/reload")
   * @param {object} data - Request body data
   * @returns {Promise<any>}
   */
  async callApi(method, path, data = null) {
    // Use haConnection if available
    if (this.haConnection && this.haConnection.hassUrl && this.haConnection.accessToken) {
      const url = `${this.haConnection.hassUrl}/api/${path}`;
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${this.haConnection.accessToken}`,
          'Content-Type': 'application/json',
        }
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      console.log(`📤 HAClient.callApi: ${method} /api/${path}`);
      const response = await fetch(url, options);
      const result = await this.parseResponse(response);

      if (!response.ok) {
        throw new Error(this.formatHttpError(response, result));
      }

      console.log(`📥 HAClient.callApi response:`, result);
      return result;
    }

    // Fallback to auth-based REST call
    return this.callREST(`/api/${path}`, {
      method,
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Normalize errors from backend
   * @param {Error} error - Original error
   * @returns {Error} Normalized error with consistent structure
   */
  normalizeError(error) {
    // Network errors
    if (error.code === ERR_CANNOT_CONNECT) {
      return new Error('Cannot connect to server. Check URL and network connection.');
    }

    if (error.code === ERR_CONNECTION_LOST) {
      return new Error('Connection to server lost. Reconnecting...');
    }

    // Authentication errors
    if (error.code === ERR_INVALID_AUTH) {
      return new Error('Invalid authentication token. Please log in again.');
    }

    // Configuration errors
    if (error.code === ERR_HASS_HOST_REQUIRED) {
      return new Error('Server URL is required.');
    }

    if (error.code === ERR_INVALID_HTTPS_TO_HTTP) {
      return new Error('Cannot connect from HTTPS to HTTP. Use HTTPS for server connection.');
    }

    // Version/compatibility errors
    if (error.message?.includes('version')) {
      return new Error('Home Assistant version incompatible. Please update Home Assistant.');
    }

    // Generic error
    return error;
  }

  /**
   * Disconnect from Home Assistant
   */
  disconnect() {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    this.auth = null;
    this.hassUrl = null;
    this.accessToken = null;
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.haConnection?.connected || this.connection?.connected || false;
  }
}

// Export singleton instance
export default new HAClient();
