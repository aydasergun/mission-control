const WebSocket = require('ws');

const ws = new WebSocket('ws://127.0.0.1:3000/api/gateway');

ws.on('open', function open() {
  console.log('connected');
  
  // Biraz bekle (Challenge gelsin)
  setTimeout(() => {
      console.log('Sending auth...');
      ws.send(JSON.stringify({
        method: "auth.login",
        params: { token: "054f286477520e1f93b3543ac3c95ed57e0a05eb8e6b4f96" }
      }));
  }, 500);
});

ws.on('message', function incoming(data) {
  const msg = JSON.parse(data);
  console.log('received:', JSON.stringify(msg, null, 2));

  // Auth başarılıysa Log iste
  if (msg.result && msg.result.user) {
      console.log('Auth OK! Requesting logs...');
      ws.send(JSON.stringify({
        method: "logs.tail",
        params: { limit: 5 }
      }));
  }
});

ws.on('error', console.error);
