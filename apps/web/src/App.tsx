import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Client, IMessage, Stomp } from '@stomp/stompjs';

type User = { id: number; name: string; email: string; role: string };

export const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const apiUrl = useMemo(() => 'http://localhost:4000', []);

  const fetchUsers = React.useCallback(() => {
    axios.get<User[]>(`${apiUrl}/api/users`).then(r => setUsers(r.data));
  }, [apiUrl]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const client: Client = new Client({
      brokerURL: 'ws://localhost:61614/stomp',
      connectHeaders: { login: 'admin', passcode: 'admin' },
      reconnectDelay: 2000,
      onConnect: () => {
        client.subscribe('/queue/notifications', (message: IMessage) => {
          try {
            const payload = JSON.parse(message.body) as { message?: string };
            if (payload?.message) toast.success(payload.message);
          } catch {
            toast(payloadToString(message.body));
          }
          // refresh table data on any notification
          fetchUsers();
        });
      },
      onStompError: frame => {
        console.error('Broker error', frame.headers['message']);
      },
    });

    client.activate();
    return () => {
      void client.deactivate();
    };
  }, [fetchUsers]);

  return (
    <div style={{ fontFamily: 'system-ui, Arial', padding: 24 }}>
      <h1>Users</h1>
      <p>REST data below, notifications via ActiveMQ STOMP toasts.</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={td}>{u.id}</td>
                <td style={td}>{u.name}</td>
                <td style={td}>{u.email}</td>
                <td style={td}>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Toaster position="top-right" />
    </div>
  );
};

const th: React.CSSProperties = {
  textAlign: 'left',
  borderBottom: '1px solid #ddd',
  padding: '8px 12px',
  background: '#f8f8f8',
};

const td: React.CSSProperties = {
  borderBottom: '1px solid #eee',
  padding: '8px 12px',
};

function payloadToString(body: string): string {
  try {
    const obj = JSON.parse(body);
    return typeof obj === 'string' ? obj : JSON.stringify(obj);
  } catch {
    return body;
  }
}


