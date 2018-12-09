import fetch from 'cross-fetch';
import { isEqual } from 'lodash';

const url = require('url');

declare var require: any;

export type Options = {
  url: string;
  secondaryAuthMode: 'jwt' | 'session';
  api?: ApiOptions;
  ws?: boolean;
};

export type ApiOptions = {
  url: string;
  primaryAuthMode?: 'jwt';
  secondaryAuthMode: 'jwt' | 'session';
  loginPath?: string;
  logoutPath?: string;
};

export type User = {
  _id: string;
};

export type Listener = (payload: any) => Promise<void>;
export type RequestTransformer = (request: RequestInit) => RequestInit;

export class OothClient {
  private oothUrl: string;
  private secondaryAuthMode: 'jwt' | 'session';
  private api: ApiOptions | undefined;
  private listeners: { [name: string]: Listener[] } = {};
  private user: User | undefined;
  private token: string | undefined;
  private ws: boolean;
  private started: boolean = false;

  constructor({ url, secondaryAuthMode, api, ws }: Options) {
    this.oothUrl = url;
    this.secondaryAuthMode = secondaryAuthMode;
    this.api = api;
    this.ws = !!ws;
  }

  public async start(): Promise<User | undefined> {
    if (!this.started) {
      this.started = true;
      await this.fetchUser();
      if (this.ws && typeof WebSocket !== 'undefined') {
        const urlParts = url.parse(this.oothUrl);
        const protocol = urlParts.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${protocol}://${urlParts.host}${urlParts.path}/ws/user`;
        const socket = new WebSocket(wsUrl);
        socket.onerror = (err: Event) => console.error(err);
        socket.onopen = () => {};
        socket.onclose = () => {};
        socket.onmessage = ({ data }: any) => this.setUser(JSON.parse(data).user);
      }
    }

    return this.user;
  }

  public on(eventName: string, listener: Listener): void {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(listener);
  }

  public unsubscribe(eventName: string, listener: Listener): void {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter((l) => l !== listener);
    }
  }

  public async emit(eventName: string, payload: any): Promise<void> {
    if (this.listeners[eventName]) {
      for (const listener of this.listeners[eventName]) {
        await listener(payload);
      }
    }
  }

  public async authenticate(strategy: string, method: string, body: any): Promise<User | undefined> {
    const raw = await fetch(`${this.oothUrl}/${strategy}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body && JSON.stringify(body),
      credentials: 'include',
    });
    const response = await raw.json();
    if (response.status === 'error') {
      throw new Error(response.message);
    }
    const { user, token } = response;
    if (token) {
      if (this.api) {
        if (this.api.primaryAuthMode === 'jwt') {
          await fetch(`${this.api.url}${this.api.loginPath}`, {
            method: 'POST',
            headers: {
              Authorization: `JWT ${token}`,
            },
            credentials: 'include',
          });
        }
      }
      if (
        this.secondaryAuthMode === 'jwt' ||
        (this.api && (this.api.primaryAuthMode === 'jwt' || this.api.secondaryAuthMode === 'jwt'))
      ) {
        this.token = token;
      }
    }
    await this.setUser(user);

    return user;
  }

  public async method<T>(strategy: string, method: string, body?: any, headers?: any): Promise<T> {
    const actualHeaders = {
      'Content-Type': 'application/json',
    };
    if (headers) {
      Object.assign(actualHeaders, headers);
    }
    if (this.secondaryAuthMode && this.token) {
      headers.Authorization = `JWT ${this.token}`;
    }
    const raw = await fetch(`${this.oothUrl}/${strategy}/${method}`, {
      method: 'POST',
      headers: actualHeaders,
      body: body && JSON.stringify(body),
      credentials: 'include',
    });
    const response = await raw.json();
    if (response.status === 'error') {
      throw new Error(response.message);
    }
    if (response.user) {
      await this.setUser(response.user);
    }
    return response;
  }

  public async logout(): Promise<void> {
    await fetch(`${this.oothUrl}/session/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    if (this.api && this.api.primaryAuthMode === 'jwt') {
      await fetch(`${this.api.url}${this.api.logoutPath}`, {
        method: 'POST',
        credentials: 'include',
      });
    }
    this.token = undefined;
    this.setUser(undefined);
  }

  public async apiCall<T>(path: string, body: any, headers: any): Promise<T> {
    if (!this.api) {
      throw new Error('No api settings.');
    }

    const actualHeaders = {
      'Content-Type': 'application/json',
    };
    if (headers) {
      Object.assign(actualHeaders, headers);
    }
    if (this.api.secondaryAuthMode === 'jwt' && this.token) {
      headers.Authorization = `JWT ${this.token}`;
    }
    const raw = await fetch(`${this.api.url}${path}`, {
      method: 'POST',
      headers: actualHeaders,
      body: body && JSON.stringify(body),
    });
    const response = await raw.json();
    if (response.status === 'error') {
      throw new Error(response.message);
    }
    return response;
  }

  public async fetchUser(headers?: any): Promise<User | undefined> {
    await this.method('user', 'user', null, headers);

    return this.user;
  }

  public async setUser(user: User | undefined): Promise<void> {
    if (!isEqual(this.user, user)) {
      this.user = user;
    }
    await this.emit('user', user);
  }
}
