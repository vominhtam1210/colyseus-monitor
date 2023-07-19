/// <reference lib="dom" />

import http from "superagent";

const ENDPOINT = (
  process.env.GAME_SERVER_URL ||
  `${window.location.protocol}//${window.location.host}${window.location.pathname}`
).replace(/\/$/, ""); // remove trailing slash

export function fetchRoomList () {
    return http.get(`${ENDPOINT}/api`).
      set('X-GS-CSRF-PROTECTION', '1').
      accept('application/json');
}

export function fetchRoomData (roomId: string) {
    return http.get(`${ENDPOINT}/api/room`).
        query({ roomId }).
        set('X-GS-CSRF-PROTECTION', '1').
        accept('application/json');
}

export function remoteRoomCall(roomId: string, method: string, ...args: any[]) {
    return http.get(`${ENDPOINT}/api/room/call`).
        query({ roomId, method, args: JSON.stringify(args) }).
        set('X-GS-CSRF-PROTECTION', '1').
        accept('application/json');
}