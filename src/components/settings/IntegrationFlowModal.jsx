/**
 * Integration Flow Modal
 *
 * Handles the config flow UI for adding/reconfiguring integrations.
 * Supports all flow step types: form, external, progress, create_entry, abort.
 */

import React, { useCallback, useEffect, useState } from 'react';
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

  const startFlow = useCallback(async () => {
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
  }, [context, domain, entryId]);

  // Start flow when modal opens
  useEffect(() => {
    if (isOpen && domain) {
      startFlow();
    }
  }, [isOpen, domain, startFlow]);

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
    if (flowState?.externalUrl || flowState?.url) {
      try {
        setLoading(true);
        const result = flowState.pollForCompletion
          ? await flowState.pollForCompletion()
          : await flowEngine.pollExternalCompletion(flowState.flowId);
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

      case FLOW_STEP_TYPES.EXTERNAL:
        return (
          <div className="space-y-5">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Complete authorization in the embedded panel, then press Continue.
            </div>

            {flowState.externalUrl || flowState.url ? (
              <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                <iframe
                  src={flowState.externalUrl || flowState.url}
                  title={`${domain} authorization`}
                  className="h-[520px] w-full bg-slate-950"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-6 text-center text-slate-400">
                This integration did not provide an authorization URL.
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={handleAbort}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleExternalAuth}
                className={`px-6 py-2 bg-${colors.name}-600 text-white rounded-lg hover:bg-${colors.name}-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2`}
                disabled={loading}
              >
                <ExternalLink className="w-4 h-4" />
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </div>
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
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="my-4 max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
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
