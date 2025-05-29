import { EnvVariable } from '../types';

/**
 * State interface for the Configuration component
 */
export interface ConfigState {
  showProgress: boolean;
  prerequisitesMet: string | null;
  envVars: Record<string, EnvVariable>;
  visibleFields: Record<string, boolean>;
}

/**
 * Action types for the Configuration reducer
 */
export type ConfigAction = 
  | { type: 'START_INSTALLATION' }
  | { type: 'PREREQUISITES_FAILED', message: string }
  | { type: 'PREREQUISITES_PASSED' }
  | { type: 'UPDATE_ENV_VAR', key: string, value: string }
  | { type: 'TOGGLE_FIELD_VISIBILITY', key: string }
  | { type: 'TOGGLE_BOOLEAN_VALUE', key: string, checked: boolean }
  | { type: 'SET_ENV_VARS', envVars: Record<string, EnvVariable> };

/**
 * Reducer for the Configuration component
 * @param state Current state
 * @param action Action to perform
 * @returns New state
 */
export const configReducer = (state: ConfigState, action: ConfigAction): ConfigState => {
  switch (action.type) {
    case 'START_INSTALLATION':
      return { 
        ...state, 
        showProgress: true 
      };
      
    case 'PREREQUISITES_FAILED':
      return { 
        ...state, 
        prerequisitesMet: action.message, 
        showProgress: false 
      };
      
    case 'PREREQUISITES_PASSED':
      return {
        ...state,
        prerequisitesMet: null
      };
      
    case 'UPDATE_ENV_VAR':
      return {
        ...state,
        envVars: {
          ...state.envVars,
          [action.key]: {
            ...state.envVars[action.key],
            value: action.value
          }
        }
      };
      
    case 'TOGGLE_FIELD_VISIBILITY':
      return {
        ...state,
        visibleFields: {
          ...state.visibleFields,
          [action.key]: !state.visibleFields[action.key]
        }
      };
      
    case 'TOGGLE_BOOLEAN_VALUE':
      return {
        ...state,
        envVars: {
          ...state.envVars,
          [action.key]: {
            ...state.envVars[action.key],
            value: action.checked ? 'true' : 'false'
          }
        }
      };
      
    case 'SET_ENV_VARS':
      return {
        ...state,
        envVars: action.envVars
      };
      
    default:
      return state;
  }
};
