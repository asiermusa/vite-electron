import {
  io
} from "socket.io-client";

var socket = io('https://denborak.online', {
  path: '/api/socket'
});

export default socket;