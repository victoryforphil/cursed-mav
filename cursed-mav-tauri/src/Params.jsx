import { useEffect, useMemo, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

import { MantineReactTable, useMantineReactTable } from 'mantine-react-table';
import { Button, Indicator, Text, TextInput, Group, Tooltip, Badge, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import 'mantine-react-table/styles.css';

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
  // Load initial params from localStorage or empty object if none exist
  const [paramsMap, setParamsMap] = useState(() => {
    const savedParams = localStorage.getItem('mavParams');
    return savedParams ? JSON.parse(savedParams) : {};
  });

  const [paramMetadata, setParamMetadata] = useState({});
  const [loadQueue, setLoadQueue] = useState([]);
  
  // Save to localStorage whenever paramsMap changes
  useEffect(() => {
    localStorage.setItem('mavParams', JSON.stringify(paramsMap));
  }, [paramsMap]);

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

  // Update or insert a parameter whenever we receive a MAVLink PARAM_VALUE
  useEffect(() => {
    let unlistenFn;

    const setupListener = async () => {
      unlistenFn = await listen("mavlink_message", (event) => {
        const payload = event.payload;
        const message = payload.message;
        const type = message.type;

        if (type === "PARAM_VALUE") {
          const paramId = message.param_id;
          const paramName = String.fromCharCode(...paramId).replace(/\0/g, '');
          const paramValue = message.param_value;
          
          setParamsMap((prev) => {
            const next = { ...prev };
            const existing = next[paramName] || {};
            next[paramName] = {
              name: paramName,
              value: paramValue,
              newValue: existing.newValue || null,
              updatedAt: new Date(),
            };
            return next;
          });
        }
      });
    };

    setupListener();

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, []);

  // Re-render every second so indicators can update color over time
  useEffect(() => {
    const interval = setInterval(() => {
      setParamsMap((prev) => ({ ...prev }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getIndicatorColor = (param) => {
    if (param.newValue !== null) {
      return 'blue';
    }
    if (!param.updatedAt) {
      return 'red';
    }
    const diffSec = (Date.now() - new Date(param.updatedAt).getTime()) / 1000;
    if (diffSec < 10) return 'green';
    if (diffSec < 60) return 'yellow';
    return 'red';
  };

  const validateValue = (param, value) => {
    const metadata = paramMetadata[param.name];
    if (!metadata) return true;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;

    switch (metadata.fieldType.type) {
      case 'range':
        const { min, max } = metadata.fieldType.data;
        return numValue >= min && numValue <= max;
      case 'values':
        return metadata.fieldType.data.values.some(v => v.code === Math.floor(numValue));
      case 'bitmask':
        const maxFlag = Math.max(...metadata.fieldType.data.flags.map(f => f.code));
        return numValue >= 0 && numValue <= (1 << maxFlag);
      default:
        return true;
    }
  };

  const formatDescription = (param) => {
    const metadata = paramMetadata[param.name];
    if (!metadata) return 'Loading...';

    let description = metadata.documentation;

    // Add field type specific info
    switch (metadata.fieldType.type) {
      case 'range':
        const { min, max, increment, units } = metadata.fieldType.data;
        description += `\nRange: ${min} to ${max}${increment ? `, increment: ${increment}` : ''}${units ? ` ${units}` : ''}`;
        break;
      case 'values':
        const values = metadata.fieldType.data.values.map(v => `${v.code}: ${v.name}`).join('\n');
        description += `\nValid values:\n${values}`;
        break;
      case 'bitmask':
        const flags = metadata.fieldType.data.flags.map(f => `${1 << f.code}: ${f.name}`).join('\n');
        description += `\nBitmask flags:\n${flags}`;
        break;
    }

    return description;
  };

  const data = useMemo(() => Object.values(paramsMap), [paramsMap]);

  const [editingParam, setEditingParam] = useState(null);
  const [inputVal, setInputVal] = useState('');

  const columns = useMemo(
    () => [
      {
        accessorKey: 'status',
        header: '',
        size: 30,
        enableEditing: false,
        Cell: ({ row }) => {
          const param = row.original;
          const color = getIndicatorColor(param);
          const tooltipText = param.newValue !== null ? "User Edited" :
            param.updatedAt ? `Last updated ${Math.round((Date.now() - new Date(param.updatedAt).getTime()) / 1000)} seconds ago` : "No updates yet";
          return (
            <Tooltip label={tooltipText} withArrow>
              <Indicator color={color} size={8} offset={0} processing={false} position="left-center" />
            </Tooltip>
          );
        },
      },
      {
        accessorKey: 'name',
        header: 'Name',
        enableEditing: false,
        Cell: ({ row }) => {
          const param = row.original;
          const metadata = paramMetadata[param.name];
          return (
            <Stack spacing="xs">
              <Text>{param.name}</Text>
              {metadata && <Text size="xs" color="dimmed">{metadata.humanName}</Text>}
            </Stack>
          );
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        enableEditing: false,
        Cell: ({ row }) => {
          const param = row.original;
          return (
            <Text style={{ whiteSpace: 'pre-wrap' }}>
              {formatDescription(param)}
            </Text>
          );
        },
      },
      {
        accessorKey: 'value',
        header: 'Value',
        Cell: ({ row }) => {
          const param = row.original;
          const isEditing = editingParam === param.name;

          if (isEditing) {
            return (
              <TextInput
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.currentTarget.value)}
                onBlur={() => {
                  const newValNum = parseFloat(inputVal);
                  if (!isNaN(newValNum) && validateValue(param, newValNum)) {
                    setParamsMap((prev) => {
                      const next = { ...prev };
                      if (next[param.name]) {
                        next[param.name] = {
                          ...next[param.name],
                          newValue: newValNum,
                        };
                      }
                      return next;
                    });
                  } else {
                    notifications.show({
                      title: 'Invalid Value',
                      message: 'The entered value is not valid for this parameter.',
                      color: 'red',
                    });
                  }
                  setEditingParam(null);
                }}
                autoFocus
              />
            );
          }

          const valToShow = param.newValue !== null ?
            <Group spacing="xs">
              <Badge color="gray">{param.value}</Badge>
              <Text> → </Text>
              <Badge color="blue">{param.newValue}</Badge>
            </Group>
            :
            <Badge color="gray">{param.value}</Badge>;

          return (
            <Text
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setEditingParam(param.name);
                setInputVal(param.newValue !== null ? param.newValue : param.value);
              }}
            >
              {valToShow}
            </Text>
          );
        },
      },
    ],
    [paramsMap, editingParam, inputVal, paramMetadata]
  );

  const handleResetChanges = () => {
    setParamsMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = {
          ...next[key],
          newValue: null
        };
      });
      return next;
    });
  };

  const handleWriteChanges = async () => {
    const editedEntries = Object.entries(paramsMap)
      .filter(([, val]) => val.newValue !== null)
      .map(([key, val]) => ({ paramName: key, newValue: val.newValue }));

    if (editedEntries.length === 0) {
      notifications.show({
        title: 'No Changes',
        message: 'No parameter changes to write.',
        color: 'gray',
      });
      return;
    }
    notifications.show({
      title: 'Writing Changes',
      message: `Sending ${editedEntries.length} parameter changes to vehicle...`,
      color: 'blue',
    });
    try {
      await invoke('set_parameters', { changes: editedEntries });
      
      // After successful write, update the base values and clear newValues
      setParamsMap((prev) => {
        const next = { ...prev };
        editedEntries.forEach(({ paramName, newValue }) => {
          if (next[paramName]) {
            next[paramName] = {
              ...next[paramName],
              value: newValue,
              newValue: null,
              updatedAt: new Date()
            };
          }
        });
        return next;
      });

      notifications.show({
        title: 'Write Changes',
        message: 'Parameter changes sent successfully!',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: `Failed to send parameter updates: ${err}`,
        color: 'red',
      });
    }
  };

  const table = useMantineReactTable({
    columns,
    data,
    enableEditing: false,
    renderTopToolbarCustomActions: () => (
      <Group>
        <Button
          onClick={handleWriteChanges}
          disabled={Object.values(paramsMap).every((param) => param.newValue === null)}
        >
          Write Changes
        </Button>
        <Button
          onClick={handleResetChanges}
          variant="outline"
          color="red"
          disabled={Object.values(paramsMap).every((param) => param.newValue === null)}
        >
          Reset Changes
        </Button>
      </Group>
    ),
    state: {
      isLoading: Object.keys(paramsMap).length === 0,
    },
  });

  return <MantineReactTable table={table} />;
}

export default Params;
