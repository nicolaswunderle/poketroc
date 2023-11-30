import { WebSocketServer } from "ws";
import si from "systeminformation";

const WSS = new WebSocketServer({ port: 8080 });

WSS.on('connection', function connection(ws) {
  console.log('Nouvelle connexion WebSocket');

  ws.on('message', function message(data) {
    console.log('Reçu depuis le client: %s', data);
    ws.send('Données reçues avec succès');
  });
  ws.send('Salut, je suis le serveur');

  setInterval(async () =>{
    const cpuTemp = JSON.stringify(await si.currentLoad());
    ws.send(cpuTemp);
  },1000);
});