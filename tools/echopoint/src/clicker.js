/* global WebSocketPair */

export class ClickerDO {
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.sessions = new Set();
        this.count = 0;

        //? Load persisted count once on first request
        this.state.blockConcurrencyWhile(async () => {
            const stored = await this.state.storage.get('count');
            if (stored != null) {
                this.count = stored;
            } else {
                //? One-time migration: seed from KV so existing total isn't lost
                try {
                    const kvVal = await env.echopoint_kv.get('click:__global__');
                    this.count = parseInt(kvVal || '0', 10);
                    await this.state.storage.put('count', this.count);
                } catch {
                    this.count = 0;
                }
            }
        });
    }

    async fetch(request) {
        if (request.headers.get('Upgrade') === 'websocket') {
            const [client, server] = Object.values(new WebSocketPair());
            server.accept();

            server.send(JSON.stringify({ type: 'sync', global: this.count }));

            this.sessions.add(server);
            server.addEventListener('message', (event) => {
                let msg;
                try { msg = JSON.parse(event.data); } catch { return; }

                if (msg.type === 'click') {
                    const inc = Math.min(Math.max(parseInt(msg.count, 10) || 1, 1), 1000);
                    this.count += inc;
                    this.state.storage.put('count', this.count);
                    this.broadcast({ type: 'sync', global: this.count });
                }
            });
            server.addEventListener('close', () => this.sessions.delete(server));
            server.addEventListener('error', () => this.sessions.delete(server));

            return new Response(null, { status: 101, webSocket: client });
        }

        if (request.method === 'POST') {
            let inc = 1;
            try {
                const body = await request.json();
                const n = parseInt(body.count, 10);
                if (n > 0 && n <= 1000) inc = n;
            } catch { }
            this.count += inc;
            await this.state.storage.put('count', this.count);
            this.broadcast({ type: 'sync', global: this.count });
            return jsonResp({ global: this.count });
        }

        return jsonResp({ global: this.count });
    }

    broadcast(msg) {
        const data = JSON.stringify(msg);
        for (const ws of this.sessions) {
            try { ws.send(data); } catch { this.sessions.delete(ws); }
        }
    }
}

function jsonResp(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
