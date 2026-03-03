/**
 * Form Renderer Component
 *
 * Converts Home Assistant data schemas into React form components.
 * Handles various field types: string, number, boolean, select, entity, device, area, etc.
 */

import React, { useState, useEffect } from 'react';
import { useAccentColor } from '../../context/AccentColorContext';
import { useHomeAssistant } from '../../context/HomeAssistantContext';

/**
 * Render a single form field based on schema
 */
const FormField = ({ field, value, onChange, error, entities, devices, areas }) => {
  const { colors } = useAccentColor();
  const { name, type, required, description, default: defaultValue } = field;

  // Determine field type from schema
  const fieldType = field.selector?.type || type || 'string';

  const renderInput = () => {
    switch (fieldType) {
      case 'string':
      case 'text':
        return (
          <input
            type={field.selector?.text?.type === 'password' ? 'password' : 'text'}
            value={value || ''}
            onChange={(e) => onChange(name, e.target.value)}
            className={`w-full px-4 py-2 bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-lg text-slate-200 focus:outline-none focus:border-${colors.name}-500 transition-colors`}
            placeholder={description || name}
            required={required}
          />
        );

      case 'number':
      case 'integer':
        const min = field.selector?.number?.min;
        const max = field.selector?.number?.max;
        const step = field.selector?.number?.step || (fieldType === 'integer' ? 1 : 0.1);

        return (
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(name, parseFloat(e.target.value))}
            min={min}
            max={max}
            step={step}
            className={`w-full px-4 py-2 bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-lg text-slate-200 focus:outline-none focus:border-${colors.name}-500 transition-colors`}
            placeholder={description || name}
            required={required}
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => onChange(name, e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${colors.name}-600`}></div>
            </div>
            <span className="text-sm text-slate-400">{description || name}</span>
          </label>
        );

      case 'select':
        const options = field.selector?.select?.options || [];
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(name, e.target.value)}
            className={`w-full px-4 py-2 bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-lg text-slate-200 focus:outline-none focus:border-${colors.name}-500 transition-colors`}
            required={required}
          >
            <option value="">Select {name}</option>
            {options.map((opt) => (
              <option key={opt.value || opt} value={opt.value || opt}>
                {opt.label || opt}
              </option>
            ))}
          </select>
        );

      case 'entity':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(name, e.target.value)}
            className={`w-full px-4 py-2 bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-lg text-slate-200 focus:outline-none focus:border-${colors.name}-500 transition-colors`}
            required={required}
          >
            <option value="">Select entity</option>
            {Object.keys(entities || {}).map((entityId) => (
              <option key={entityId} value={entityId}>
                {entities[entityId]?.attributes?.friendly_name || entityId}
              </option>
            ))}
          </select>
        );

      case 'device':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(name, e.target.value)}
            className={`w-full px-4 py-2 bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-lg text-slate-200 focus:outline-none focus:border-${colors.name}-500 transition-colors`}
            required={required}
          >
            <option value="">Select device</option>
            {(devices || []).map((device) => (
              <option key={device.id} value={device.id}>
                {device.name || device.id}
              </option>
            ))}
          </select>
        );

      case 'area':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(name, e.target.value)}
            className={`w-full px-4 py-2 bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-lg text-slate-200 focus:outline-none focus:border-${colors.name}-500 transition-colors`}
            required={required}
          >
            <option value="">Select area</option>
            {(areas || []).map((area) => (
              <option key={area.area_id} value={area.area_id}>
                {area.name}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(name, e.target.value)}
            className={`w-full px-4 py-2 bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-lg text-slate-200 focus:outline-none focus:border-${colors.name}-500 transition-colors`}
            placeholder={description || name}
            required={required}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">
        {description || name}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

/**
 * Main Form Renderer Component
 */
const FormRenderer = ({ schema, values, onChange, errors, onSubmit }) => {
  const { hassStates } = useHomeAssistant();
  const [devices, setDevices] = useState([]);
  const [areas, setAreas] = useState([]);

  // Load devices and areas for selectors
  useEffect(() => {
    const loadRegistries = async () => {
      try {
        const haClient = (await import('../../services/haClient')).default;

        // Load devices
        const devicesResult = await haClient.callWS('config/device_registry/list');
        setDevices(devicesResult || []);

        // Load areas
        const areasResult = await haClient.callWS('config/area_registry/list');
        setAreas(areasResult || []);
      } catch (error) {
        console.error('Failed to load registries:', error);
      }
    };

    loadRegistries();
  }, []);

  const handleFieldChange = (name, value) => {
    onChange({
      ...values,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  // Parse schema - HA can send schema in different formats
  const fields = Array.isArray(schema) ? schema : Object.entries(schema || {}).map(([name, config]) => ({
    name,
    ...config
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <FormField
          key={field.name}
          field={field}
          value={values[field.name]}
          onChange={handleFieldChange}
          error={errors[field.name]}
          entities={hassStates}
          devices={devices}
          areas={areas}
        />
      ))}
    </form>
  );
};

export default FormRenderer;

