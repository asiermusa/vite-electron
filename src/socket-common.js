const io = require('socket.io-client');

const socket = io('https://denborak.online', {
  path: '/api/socket'
});

module.exports = socket;