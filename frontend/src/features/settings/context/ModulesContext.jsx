import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { modulesApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const ModulesContext = createContext(null);

const STORAGE_KEY = 'civildesk_company_modules';

export function ModulesProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [modules, setModules] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return [];
    }
    try {
      const data = await modulesApi.list();
      if (Array.isArray(data)) {
        setModules(data);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
          // ignore localStorage error
        }
        return data;
      }
    } catch (err) {
      console.warn('Failed to load company modules from server:', err);
    } finally {
      setLoading(false);
    }
    return [];
  }, [isAuthenticated]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Fast map lookup of item_code -> boolean
  const enabledMap = useMemo(() => {
    const map = new Map();
    modules.forEach((mod) => {
      const code = String(mod.item_code || '').toUpperCase();
      map.set(code, Boolean(mod.is_enabled));
    });
    return map;
  }, [modules]);

  const isModuleEnabled = useCallback(
    (codeOrAlias) => {
      if (!codeOrAlias) return true;
      const clean = String(codeOrAlias).toUpperCase().trim();

      // Core modules that are always enabled
      if (clean === 'DASHBOARD' || clean === 'ADMINISTRATION') {
        return true;
      }

      // Exact match
      if (enabledMap.has(clean)) {
        return enabledMap.get(clean);
      }

      // Check common alias mappings
      if (clean === 'PRIMARY_HRM' && enabledMap.has('LABOUR_ATTENDANCE')) {
        return enabledMap.get('LABOUR_ATTENDANCE');
      }
      if (clean === 'PRIMARY_SUBCONTRACTS' && enabledMap.has('SUBCONTRACT_MANAGEMENT')) {
        return enabledMap.get('SUBCONTRACT_MANAGEMENT');
      }
      if (clean === 'PRIMARY_SITES' && enabledMap.has('SITES_LOCATIONS')) {
        return enabledMap.get('SITES_LOCATIONS');
      }
      if (clean === 'PRIMARY_CLIENTS' && enabledMap.has('CLIENTS')) {
        return enabledMap.get('CLIENTS');
      }
      if (clean === 'BOQ' && enabledMap.has('BOQ_BUDGET')) {
        return enabledMap.get('BOQ_BUDGET');
      }

      // Default to true if not explicitly found in map (safe fallback)
      return true;
    },
    [enabledMap]
  );

  const toggleModule = useCallback(
    async (codeOrId, isEnabled) => {
      // Optimistic update
      setModules((prev) =>
        prev.map((mod) => {
          if (
            (typeof codeOrId === 'number' && mod.id === codeOrId) ||
            String(mod.item_code || '').toUpperCase() === String(codeOrId).toUpperCase()
          ) {
            return { ...mod, is_enabled: isEnabled };
          }
          return mod;
        })
      );

      try {
        await modulesApi.toggle(codeOrId, isEnabled);
        window.dispatchEvent(new CustomEvent('civildesk:modules-updated', { detail: { codeOrId, isEnabled } }));
        // Re-fetch in background to ensure deep tree alignment
        fetchModules();
      } catch (error) {
        // Rollback on failure
        fetchModules();
        throw error;
      }
    },
    [fetchModules]
  );

  const bulkUpdate = useCallback(
    async (modulesList) => {
      try {
        await modulesApi.bulkUpdate(modulesList);
        await fetchModules();
        window.dispatchEvent(new CustomEvent('civildesk:modules-updated'));
      } catch (error) {
        fetchModules();
        throw error;
      }
    },
    [fetchModules]
  );

  const value = useMemo(
    () => ({
      modules,
      loading,
      isModuleEnabled,
      toggleModule,
      bulkUpdate,
      refresh: fetchModules,
    }),
    [bulkUpdate, fetchModules, isModuleEnabled, loading, modules, toggleModule]
  );

  return <ModulesContext.Provider value={value}>{children}</ModulesContext.Provider>;
}

export function useModules() {
  const context = useContext(ModulesContext);
  if (!context) {
    throw new Error('useModules must be used within a ModulesProvider.');
  }
  return context;
}
