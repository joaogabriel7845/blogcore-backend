import server from '../server.js';

export default async function handler(req, res) {
  
  await server.ready();
  
  server.server.emit('request', req, res);
}