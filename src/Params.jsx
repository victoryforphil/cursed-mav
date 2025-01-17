import { useEffect, useMemo, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

// Cache for parameter metadata with LRU-like behavior
const PARAM_METADATA_CACHE = {
  _data: new Map(),
  _maxSize: 1000,
  
  get(key) {
    const value = this._data.get(key);
    if (value) {
      // Move to front by deleting and re-adding
      this._data.delete(key);
      this._data.set(key, value);
    }
    return value;
  },
  
  set(key, value) {
    if (this._data.size >= this._maxSize) {
      // Remove oldest entry (first in map)
      const firstKey = this._data.keys().next().value;
      this._data.delete(firstKey);
    }
    this._data.set(key, value);
  }
};

function Params() {
  // ... other state ...

  // Queue for parameters that need metadata loading
  const [loadQueue, setLoadQueue] = useState([]);
  
  // Process the load queue in batches
  useEffect(() => {
    if (loadQueue.length === 0) return;

    // Process next batch
    const processBatch = async () => {
      // Take up to 10 parameters at a time
      const batch = loadQueue.slice(0, 10);
      const remaining = loadQueue.slice(10);
      setLoadQueue(remaining);

      // Load metadata for batch
      for (const paramName of batch) {
        try {
          // Check cache first
          const cached = PARAM_METADATA_CACHE.get(paramName);
          if (cached) {
            setParamMetadata(prev => ({
              ...prev,
              [paramName]: cached
            }));
            continue;
          }

          // If not in cache, fetch from backend
          const info = await invoke('get_parameter_info', { paramName });
          if (info) {
            PARAM_METADATA_CACHE.set(paramName, info);
            setParamMetadata(prev => ({
              ...prev,
              [paramName]: info
            }));
          }
        } catch (err) {
          console.error('Failed to load parameter info:', err);
        }
      }
    };

    // Use requestIdleCallback to process batch during idle time
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => processBatch());
    } else {
      setTimeout(processBatch, 0);
    }
  }, [loadQueue]);

  // Queue parameters for metadata loading
  useEffect(() => {
    const newParams = Object.keys(paramsMap).filter(
      paramName => !paramMetadata[paramName] && !loadQueue.includes(paramName)
    );
    
    if (newParams.length > 0) {
      setLoadQueue(prev => [...prev, ...newParams]);
    }
  }, [paramsMap, paramMetadata, loadQueue]);

  useEffect(() => {
    const loadAllParams = async () => {
      try {
        const allParams = await invoke('get_all_parameters');
        setParamMetadata(allParams);
      } catch (err) {
        console.error('Failed to load all parameters:', err);
      }
    };

    loadAllParams();
  }, []);

  // ... rest of component code ...
} 