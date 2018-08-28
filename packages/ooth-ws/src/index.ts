import { Router } from 'express';
import * as expressWs from 'express-ws';
import { Ooth, FullRequest } from 'ooth';
import * as WebSocket from 'ws';

type Options = {
  name?: string;
  ooth: Ooth;
};

type RouterWithWs = Router & {
  ws: any;
};

export default function({ ooth }: Options): void {
  if (!ooth.usesSession()) {
    throw new Error('ooth-ws requires ooth to use sessions.');
  }
  const connections: { [key: string]: WebSocket[] } = {};
  const app = ooth.getApp();
  const ws = expressWs(app);

  ooth.on('ooth', 'login', async ({ userId, sessionId }) => {
    if (sessionId && connections[sessionId]) {
      const profile = JSON.stringify({
        user: ooth.getProfile(await ooth.getUserById(userId)),
      });
      connections[sessionId].forEach((ws) => ws.send(profile));
    }
  });

  ooth.on('ooth', 'logout', async ({ sessionId }) => {
    if (sessionId && connections[sessionId]) {
      connections[sessionId].forEach((ws) => ws.send(JSON.stringify({})));
    }
  });

  const route: RouterWithWs = ooth.getRoute() as any;
  ws.applyTo(route);
  route.ws('/ws/user', async (ws: WebSocket, req: FullRequest) => {
    if (!connections[req.session!.id]) {
      connections[req.session!.id] = [];
    }
    connections[req.session!.id].push(ws);

    if (req.user) {
      ws.send(
        JSON.stringify({
          user: ooth.getProfile(await ooth.getUserById(req.user)),
        }),
      );
    } else {
      ws.send(
        JSON.stringify({
          user: null,
        }),
      );
    }

    ws.on('close', () => {
      connections[req.session!.id] = connections[req.session!.id].filter((wss) => ws !== wss);
    });
  });
}
