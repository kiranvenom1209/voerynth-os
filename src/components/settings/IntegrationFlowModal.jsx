/**
 * Integration Flow Modal
 *
 * Handles the config flow UI for adding/reconfiguring integrations.
 * Supports all flow step types: form, external, progress, create_entry, abort.
 */

import React, { useState, useEffect } from 'react';
import { X, Loader, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useAccentColor } from '../../context/AccentColorContext';
import FormRenderer from './FormRenderer';
import flowEngine, { FLOW_STEP_TYPES } from '../../services/flowEngine';

const IntegrationFlowModal = ({ isOpen, onClose, domain, context, entryId, onSuccess }) => {
  const { colors } = useAccentColor();
  const [flowState, setFlowState] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Start flow when modal opens
  useEffect(() => {
    if (isOpen && domain) {
      startFlow();
    }
  }, [isOpen, domain]);

  const startFlow = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await flowEngine.startFlow(domain, { context, entryId });
      setFlowState(result);

      // Handle auto-progressing steps
      if (result.type === FLOW_STEP_TYPES.PROGRESS) {
        // Progress step will auto-poll
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (values) => {
    try {
      setLoading(true);
      setError(null);

      const result = await flowEngine.next(flowState.flowId, values);
      setFlowState(result);
      setFormValues({});

      // Handle success
      if (result.type === FLOW_STEP_TYPES.CREATE_ENTRY) {
        setTimeout(() => {
          onSuccess?.(result);
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExternalAuth = async () => {
    if (flowState?.externalUrl) {
      // Open external URL
      window.open(flowState.externalUrl, '_blank');

      // Start polling for completion
      try {
        setLoading(true);
        const result = await flowState.pollForCompletion();
        setFlowState(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAbort = async () => {
    if (flowState?.flowId) {
      await flowEngine.abort(flowState.flowId);
    }
    onClose();
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (loading && !flowState) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
          <p className="text-slate-400">Starting integration setup...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-400 text-center mb-4">{error}</p>
          <button
            onClick={startFlow}
            className={`px-6 py-2 bg-${colors.name}-600 text-white rounded-lg hover:bg-${colors.name}-700 transition-colors`}
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!flowState) return null;

    switch (flowState.type) {
      case FLOW_STEP_TYPES.FORM:
        return (
          <div className="space-y-6">
            {flowState.description && (
              <p className="text-slate-300">{flowState.description}</p>
            )}

            <FormRenderer
              schema={flowState.dataSchema}
              values={formValues}
              onChange={setFormValues}
              errors={flowState.errors}
              onSubmit={handleFormSubmit}
            />

            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={handleAbort}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleFormSubmit(formValues)}
                className={`px-6 py-2 bg-${colors.name}-600 text-white rounded-lg hover:bg-${colors.name}-700 transition-colors disabled:opacity-50`}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Continue'}
              </button>
            </div>
          </div>
        );

      case FLOW_STEP_TYPES.PROGRESS:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
            <p className="text-slate-300 text-lg mb-2">
              {flowState.progressAction || 'Processing...'}
            </p>
            <p className="text-slate-500 text-sm">Please wait while we complete the setup</p>
          </div>
        );

      case FLOW_STEP_TYPES.CREATE_ENTRY:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-semibold text-slate-200 mb-2">Success!</h3>
            <p className="text-slate-400 text-center">
              {flowState.title || domain} has been configured successfully
            </p>
          </div>
        );

      case FLOW_STEP_TYPES.ABORT:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-200 mb-2">Setup Cancelled</h3>
            <p className="text-slate-400 text-center mb-6">
              {flowState.reason || 'The setup process was cancelled'}
            </p>
            <button
              onClick={onClose}
              className={`px-6 py-2 bg-${colors.name}-600 text-white rounded-lg hover:bg-${colors.name}-700 transition-colors`}
            >
              Close
            </button>
          </div>
        );

      default:
        return (
          <div className="text-center py-12 text-slate-400">
            Unknown flow step type: {flowState.type}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b border-slate-800`}>
          <div>
            <h2 className="text-2xl font-serif text-slate-200">
              {context === 'reauth' ? 'Reauthenticate' : context === 'reconfigure' ? 'Reconfigure' : 'Add'} Integration
            </h2>
            <p className={`text-sm ${colors.text} mt-1`}>{domain}</p>
          </div>
          <button
            onClick={handleAbort}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default IntegrationFlowModal;

