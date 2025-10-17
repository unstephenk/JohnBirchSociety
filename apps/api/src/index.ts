import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stompit from 'stompit';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

// In-memory table data
type User = { id: number; name: string; email: string; role: string };
const users: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Editor' },
  { id: 3, name: 'Carol Lee', email: 'carol@example.com', role: 'Viewer' },
  { id: 4, name: 'Stephen Kuehl', email: 'unstephenk@gmail.com', role: 'Admin' },
];

// STOMP / ActiveMQ configuration
const ACTIVEMQ_HOST = process.env.ACTIVEMQ_HOST || 'localhost';
const ACTIVEMQ_PORT = process.env.ACTIVEMQ_PORT ? Number(process.env.ACTIVEMQ_PORT) : 61613; // STOMP
const ACTIVEMQ_USER = process.env.ACTIVEMQ_USER || 'admin';
const ACTIVEMQ_PASS = process.env.ACTIVEMQ_PASS || 'admin';
const NOTIFY_DEST = process.env.NOTIFY_DEST || '/queue/notifications';

let stompClient: any | null = null;

function connectStomp(): Promise<any> {
  return new Promise((resolve, reject) => {
    stompit.connect(
      {
        host: ACTIVEMQ_HOST,
        port: ACTIVEMQ_PORT,
        connectHeaders: {
          host: '/',
          login: ACTIVEMQ_USER,
          passcode: ACTIVEMQ_PASS,
        },
      },
      (error, client) => {
        if (error) return reject(error);
        resolve(client);
      }
    );
  });
}

async function getStompClient(): Promise<any> {
  if (stompClient) return stompClient;
  stompClient = await connectStomp();
  return stompClient;
}

async function publishNotification(message: string) {
  const client = await getStompClient();
  const frame = client.send({ destination: NOTIFY_DEST, 'content-type': 'application/json' });
  frame.write(JSON.stringify({ type: 'toast', message, timestamp: Date.now() }));
  frame.end();
}

// REST endpoints
app.get('/api/users', (_req: Request, res: Response) => {
  res.json(users);
});

app.post('/api/users', async (req: Request, res: Response) => {
  const { name, email, role } = req.body as Partial<User>;
  if (!name || !email || !role) return res.status(400).json({ error: 'name, email, role required' });
  const newUser: User = { id: users[users.length - 1]?.id + 1 || 1, name, email, role };
  users.push(newUser);
  // Publish a notification that a new user was added
  try {
    await publishNotification(`New user added: ${newUser.name}`);
  } catch (err) {
    // Log but do not fail the API response
    console.error('Failed to publish notification', err);
  }
  res.status(201).json(newUser);
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  if (stompClient) {
    try { stompClient.disconnect(); } catch {}
  }
  process.exit(0);
});


