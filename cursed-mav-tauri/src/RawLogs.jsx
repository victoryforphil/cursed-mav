import { useEffect, useState, useMemo } from 'react';
import { listen } from '@tauri-apps/api/event';
import { Code, ScrollArea, Title, Button, Group, Tooltip, Badge, Modal } from '@mantine/core';
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table';

function RawLogs() {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('mavMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });

  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    localStorage.setItem('mavMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const unlisten = listen("mavlink_message", (event) => {
      setMessages((prev) => {
        const next = [...prev, event.payload];
        if (next.length > 2000) {
          return next.slice(-2000);
        }
        return next;
      });
    });

    return () => {
      unlisten.then((off) => off());
    };
  }, []);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'header',
        header: 'IDs', 
        size: 250,
        Cell: ({ row }) => <Group spacing={12}><Badge color="blue" size="sm" variant="filled">Sys: {row.original.header.system_id}</Badge><Badge color="cyan" size="sm" variant="filled">Comp: {row.original.header.component_id}</Badge><Badge color="gray" size="sm" variant="filled">Seq: {row.original.header.sequence}</Badge></Group>,
      },
      {
        accessorKey: 'message.type',
        header: 'Message Type',
        size: 200,
        Cell: ({ cell }) => (
          <strong>{cell.getValue()}</strong>
        )
      },
      {
        accessorKey: 'message',
        header: 'Raw Message',
        Cell: ({ row }) => {
          const messageStr = JSON.stringify(row.original.message);
          return (
            <Tooltip label="Click to view full message"><Code style={{ cursor: 'pointer' }} onClick={() => setSelectedMessage(row.original)}>{messageStr.length > 100 ? messageStr.substring(0, 100) + '...' : messageStr}</Code></Tooltip>
          );
        },
      },
    ],
    []
  );

  const table = useMantineReactTable({
    columns,
    data: messages,
    enableRowActions: false,
    onRowClick: ({ row }) => {
      setSelectedMessage(row.original);
    },
    initialState: { density: 'xs' },
    mantineTableProps: {
      striped: true,
      highlightOnHover: true,
    },
  });

  const handleClearLogs = () => {
    setMessages([]);
  };

  return (
    <>
      <Group position="apart" mb="md">
        <Title order={3}>Raw MAVLink Logs</Title>
        <Button variant="light" color="red" onClick={handleClearLogs}>
          Clear
        </Button>
      </Group>
      <MantineReactTable table={table} />
      
      <Modal
        opened={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        title="Raw Message Data"
        size="lg"
      >
        <Code block>
          {selectedMessage && JSON.stringify(selectedMessage, null, 2)}
        </Code>
      </Modal>
    </>
  );
}

export default RawLogs;