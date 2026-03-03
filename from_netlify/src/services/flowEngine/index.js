/**
 * Integration Setup Engine (Flow Runner)
 *
 * Handles Home Assistant config flows for integration setup, reconfiguration, and reauthentication.
 * Supports: form, external, progress, create_entry, abort step types.
 */

import haClient from '../haClient';

/**
 * Flow step types
 */
export const FLOW_STEP_TYPES = {
  FORM: 'form',
  EXTERNAL: 'external',
  PROGRESS: 'progress',
  CREATE_ENTRY: 'create_entry',
  ABORT: 'abort',
  MENU: 'menu'
};

/**
 * Flow context types
 */
export const FLOW_CONTEXT = {
  SOURCE_USER: 'user',
  SOURCE_REAUTH: 'reauth',
  SOURCE_RECONFIGURE: 'reconfigure'
};

class FlowEngine {
  constructor() {
    this.activeFlows = new Map();
    this.pollIntervals = new Map();
  }

  /**
   * Start a new config flow
   * @param {string} domain - Integration domain (e.g., "hue", "mqtt")
   * @param {object} options - Flow options
   * @param {string} options.context - Flow context (user, reauth, reconfigure)
   * @param {string} options.entryId - Entry ID for reauth/reconfigure flows
   * @returns {Promise<object>} Flow state
   */
  async startFlow(domain, options = {}) {
    try {
      const { context = FLOW_CONTEXT.SOURCE_USER, entryId } = options;

      const payload = {
        handler: domain
      };

      // Add context for reauth/reconfigure
      if (context === FLOW_CONTEXT.SOURCE_REAUTH && entryId) {
        payload.context = { source: 'reauth', entry_id: entryId };
      } else if (context === FLOW_CONTEXT.SOURCE_RECONFIGURE && entryId) {
        payload.context = { source: 'reconfigure', entry_id: entryId };
      }

      const result = await haClient.callWS('config_entries/flow/init', payload);

      this.activeFlows.set(result.flow_id, result);

      return this.normalizeFlowState(result);
    } catch (error) {
      throw new Error(`Failed to start flow for ${domain}: ${error.message}`);
    }
  }

  /**
   * Continue a flow with user input
   * @param {string} flowId - Flow ID
   * @param {object} userInput - User input data
   * @returns {Promise<object>} Next flow state
   */
  async next(flowId, userInput = {}) {
    try {
      const result = await haClient.callWS('config_entries/flow/configure', {
        flow_id: flowId,
        user_input: userInput
      });

      this.activeFlows.set(flowId, result);

      // Handle progress steps with auto-polling
      if (result.type === FLOW_STEP_TYPES.PROGRESS) {
        return this.handleProgressStep(flowId, result);
      }

      // Handle external steps
      if (result.type === FLOW_STEP_TYPES.EXTERNAL) {
        return this.handleExternalStep(flowId, result);
      }

      return this.normalizeFlowState(result);
    } catch (error) {
      throw new Error(`Flow step failed: ${error.message}`);
    }
  }

  /**
   * Abort a flow
   * @param {string} flowId - Flow ID
   * @returns {Promise<void>}
   */
  async abort(flowId) {
    try {
      await haClient.callWS('config_entries/flow/abort', {
        flow_id: flowId
      });

      this.cleanup(flowId);
    } catch (error) {
      console.error('Failed to abort flow:', error);
    }
  }

  /**
   * Handle progress step with polling
   * @param {string} flowId - Flow ID
   * @param {object} flowState - Current flow state
   * @returns {Promise<object>} Updated flow state
   */
  async handleProgressStep(flowId, flowState) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds max
      const pollInterval = 1000; // Poll every second

      const poll = async () => {
        try {
          attempts++;

          if (attempts > maxAttempts) {
            this.stopPolling(flowId);
            reject(new Error('Progress step timed out'));
            return;
          }

          // Poll the flow
          const result = await haClient.callWS('config_entries/flow/configure', {
            flow_id: flowId
          });

          this.activeFlows.set(flowId, result);

          // If still in progress, continue polling
          if (result.type === FLOW_STEP_TYPES.PROGRESS) {
            return; // Continue polling
          }

          // Progress complete, stop polling and resolve
          this.stopPolling(flowId);
          resolve(this.normalizeFlowState(result));
        } catch (error) {
          this.stopPolling(flowId);
          reject(error);
        }
      };

      // Start polling
      const intervalId = setInterval(poll, pollInterval);
      this.pollIntervals.set(flowId, intervalId);

      // Initial poll
      poll();
    });
  }

  /**
   * Handle external step (OAuth, etc.)
   * @param {string} flowId - Flow ID
   * @param {object} flowState - Current flow state
   * @returns {object} Flow state with external URL
   */
  handleExternalStep(flowId, flowState) {
    // Return the flow state with external URL
    // The UI will handle opening the URL and polling for completion
    return {
      ...this.normalizeFlowState(flowState),
      externalUrl: flowState.url,
      pollForCompletion: async () => {
        return this.pollExternalCompletion(flowId);
      }
    };
  }

  /**
   * Poll for external step completion
   * @param {string} flowId - Flow ID
   * @returns {Promise<object>} Updated flow state
   */
  async pollExternalCompletion(flowId) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 300; // 5 minutes max
      const pollInterval = 1000; // Poll every second

      const poll = async () => {
        try {
          attempts++;

          if (attempts > maxAttempts) {
            this.stopPolling(flowId);
            reject(new Error('External authentication timed out'));
            return;
          }

          // Poll the flow
          const result = await haClient.callWS('config_entries/flow/configure', {
            flow_id: flowId
          });

          this.activeFlows.set(flowId, result);

          // If still external, continue polling
          if (result.type === FLOW_STEP_TYPES.EXTERNAL) {
            return; // Continue polling
          }

          // External step complete, stop polling and resolve
          this.stopPolling(flowId);
          resolve(this.normalizeFlowState(result));
        } catch (error) {
          this.stopPolling(flowId);
          reject(error);
        }
      };

      // Start polling
      const intervalId = setInterval(poll, pollInterval);
      this.pollIntervals.set(flowId, intervalId);

      // Initial poll
      poll();
    });
  }

  /**
   * Stop polling for a flow
   * @param {string} flowId - Flow ID
   */
  stopPolling(flowId) {
    const intervalId = this.pollIntervals.get(flowId);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollIntervals.delete(flowId);
    }
  }

  /**
   * Normalize flow state for consistent UI handling
   * @param {object} flowState - Raw flow state from HA
   * @returns {object} Normalized flow state
   */
  normalizeFlowState(flowState) {
    return {
      flowId: flowState.flow_id,
      type: flowState.type,
      stepId: flowState.step_id,
      handler: flowState.handler,

      // Form data
      dataSchema: flowState.data_schema || [],
      errors: flowState.errors || {},
      description: flowState.description,
      descriptionPlaceholders: flowState.description_placeholders || {},

      // Progress data
      progressAction: flowState.progress_action,

      // External data
      url: flowState.url,

      // Create entry data
      title: flowState.title,
      result: flowState.result,

      // Abort data
      reason: flowState.reason,

      // Menu data (for multi-step flows)
      menuOptions: flowState.menu_options || [],

      // Raw state for debugging
      raw: flowState
    };
  }

  /**
   * Cleanup flow resources
   * @param {string} flowId - Flow ID
   */
  cleanup(flowId) {
    this.stopPolling(flowId);
    this.activeFlows.delete(flowId);
  }

  /**
   * Get active flow state
   * @param {string} flowId - Flow ID
   * @returns {object|null} Flow state
   */
  getFlow(flowId) {
    return this.activeFlows.get(flowId) || null;
  }

  /**
   * Orchestration helper: Run a complete flow from start to finish
   * @param {string} domain - Integration domain
   * @param {function} onStep - Callback for each step (receives flowState, returns userInput)
   * @param {object} options - Flow options
   * @returns {Promise<object>} Final flow result
   */
  async run(domain, onStep, options = {}) {
    let flowState = await this.startFlow(domain, options);

    while (flowState.type !== FLOW_STEP_TYPES.CREATE_ENTRY &&
           flowState.type !== FLOW_STEP_TYPES.ABORT) {

      // Let the UI handle this step
      const userInput = await onStep(flowState);

      // Continue to next step
      flowState = await this.next(flowState.flowId, userInput);
    }

    // Cleanup
    this.cleanup(flowState.flowId);

    return flowState;
  }
}

// Export singleton instance
export default new FlowEngine();
