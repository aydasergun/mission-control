import { GATEWAY_CONFIG } from "./gateway-config";

export type LogEntry = {
  ts: string;
  type: 'CALL' | 'THINKING' | 'OK' | 'ERROR';
  msg: string;
  detail?: string;
};

export function connectToGateway(
  onLog: (entry: LogEntry) => void,
  onStatus: (status: string) => void
) {
  let socket: WebSocket | null = null;
  let reconnectTimer: any = null;
  let isClosing = false;
  let messageIdCounter = 0;

  const connect = () => {
    if (isClosing) return;
    
    try {
      socket = new WebSocket(GATEWAY_CONFIG.url);

      socket.onopen = () => {
        console.log("Connected to OpenClaw Gateway");
        onStatus("AUTHENTICATING...");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "event" && data.event === "connect.challenge") {
            socket?.send(JSON.stringify({
              type: "req",
              id: "connect-1",
              method: "connect",
              params: {
                minProtocol: 3,
                maxProtocol: 3,
                client: {
                  id: "openclaw-control-ui",
                  version: "1.0.0",
                  platform: "web",
                  mode: "ui"
                },
                role: "operator",
                scopes: ["operator.read", "operator.write"], // Added write scope just in case
                caps: [],
                commands: [],
                permissions: {},
                auth: { token: GATEWAY_CONFIG.token },
                locale: "tr-TR",
                userAgent: "mission-control/1.0.0"
              }
            }));
            return; 
          }
          
          if (data.type === "res" && data.id === "connect-1" && data.ok) {
            onStatus("ONLINE");
            socket?.send(JSON.stringify({
              type: "req",
              id: "logs-1",
              method: "logs.tail",
              params: { limit: 100 }
            }));
            return;
          }
          
          if (data.type === "res" && data.id === "connect-1" && !data.ok) {
            console.error("Connect failed:", data.error);
            onStatus("AUTH FAILED");
            return;
          }

          if (data.type === "event" && data.event !== "connect.challenge") {
            const eventType = data.event === "health" ? "OK" : 
                              data.event === "agent" ? "CALL" : "OK";
            
            if (data.event === "agent" && data.payload) {
              const p = data.payload;
              let msg = p.stream || data.event;
              let detail = "";
              if (p.text) detail = p.text.slice(0, 150);
              else if (p.toolName) detail = `Tool: ${p.toolName}`;
              else if (p.model) detail = `Model: ${p.model}`;
              onLog({ ts: new Date().toLocaleTimeString(), type: p.stream === "thinking" ? "THINKING" : eventType as any, msg: msg.toUpperCase(), detail });
            } else {
              onLog({ ts: new Date().toLocaleTimeString(), type: eventType as any, msg: data.event.toUpperCase(), detail: JSON.stringify(data.payload || {}).slice(0, 100) });
            }
            return;
          }
          
          if (data.type === "res" && data.id === "logs-1" && data.ok && data.payload?.lines) {
            data.payload.lines.slice(-10).forEach((line: string) => {
              try {
                const log = JSON.parse(line);
                onLog({ ts: new Date(log.time || log._meta?.date).toLocaleTimeString(), type: "OK", msg: log["1"]?.slice(0, 50) || "LOG", detail: log["1"]?.slice(0, 100) });
              } catch {}
            });
            return;
          }

          if (data.method || data.result) {
             onLog({ ts: new Date().toLocaleTimeString(), type: 'OK', msg: data.method || "Data", detail: JSON.stringify(data).slice(0, 200) });
          }
        } catch (e) {}
      };

      socket.onerror = () => {
        onStatus("ERROR");
      };

      socket.onclose = () => {
        if (!isClosing) {
          onStatus("DISCONNECTED");
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    } catch (e) {
      onStatus("ERROR");
    }
  };

  connect();

  const sendMessage = (message: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      messageIdCounter++;
      socket.send(JSON.stringify({
        type: "req",
        id: `msg-${messageIdCounter}`,
        method: "chat.send",
        params: {
          sessionKey: "agent:main:main",
          message: message,
          idempotencyKey: `web-${Date.now()}-${messageIdCounter}`
        }
      }));
      return true;
    }
    return false;
  };

  return {
    disconnect: () => {
      isClosing = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) {
        socket.close();
      }
    },
    sendMessage
  };
}
