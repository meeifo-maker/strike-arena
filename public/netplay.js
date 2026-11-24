/* PeerJS invite-link netplay for Strike Arena 1v1 */
(function (global) {
  const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const PEER_OPTS = {
    debug: 1,
    host: "0.peerjs.com",
    port: 443,
    path: "/",
    secure: true,
    pingInterval: 5000,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun.cloudflare.com:3478" },
        // Relay for networks that block direct peer-to-peer (school/office Wi-Fi); TLS on 443 looks like HTTPS
        {
          urls: [
            "turn:global.relay.metered.ca:80",
            "turn:global.relay.metered.ca:80?transport=tcp",
            "turn:global.relay.metered.ca:443",
            "turns:global.relay.metered.ca:443?transport=tcp",
          ],
          username: "e9e26419bfa9edcc9cb7aaa8",
          credential: "dPXo8kO2DQb8bBxT",
        },
      ],
    },
  };

  function code() {
    let s = "";
    for (let i = 0; i < 6; i++) s += ABC[(Math.random() * ABC.length) | 0];
    return s;
  }

  const Netplay = {
    role: null,
    room: null,
    hostPeerId: null,
    peer: null,
    conn: null,
    connected: false,
    remote: null,
    status: "idle",
    _joinTimer: null,
    _retries: 0,
    _joinResolve: null,
    _joinReject: null,
    onStatus: null,
    onMessage: null,
    onConnected: null,
    onDisconnected: null,

    inviteUrl() {
      if (!this.room || !this.hostPeerId) return "";
      const u = new URL(location.href);
      u.searchParams.set("room", this.room);
      u.searchParams.set("host", this.hostPeerId);
      u.hash = "";
      return u.toString();
    },

    setStatus(s, detail) {
      this.status = s;
      this.onStatus && this.onStatus(s, detail || "");
    },

    _clearJoinTimer() {
      if (this._joinTimer) {
        clearTimeout(this._joinTimer);
        this._joinTimer = null;
      }
    },

    _destroyPeer() {
      const conn = this.conn,
        peer = this.peer;
      this.conn = null;
      this.peer = null;
      try {
        if (conn) conn.close();
      } catch (e) {}
      try {
        if (peer && !peer.destroyed) peer.destroy();
      } catch (e) {}
      this.connected = false;
      this.remote = null;
    },

    _markConnected() {
      if (this.connected) return;
      this.connected = true;
      this._clearJoinTimer();
      this._retries = 0;
      this.setStatus("connected", "Opponent connected");
      this.onConnected && this.onConnected();
    },

    _wire(conn) {
      const old = this.conn;
      this.conn = conn;
      if (old && old !== conn) {
        try {
          old.close();
        } catch (e) {}
      }
      // Events from a replaced/retried connection must not touch the live one
      conn.on("data", (msg) => {
        if (this.conn !== conn) return;
        try {
          if (typeof msg === "string") msg = JSON.parse(msg);
        } catch (e) {
          return;
        }
        if (!msg || typeof msg !== "object") return;
        if (msg.data && msg.data.t) msg = msg.data;
        if (msg.t === "state") this.remote = msg;
        this.onMessage && this.onMessage(msg);
      });
      conn.on("open", () => {
        if (this.conn === conn) this._markConnected();
      });
      // PeerJS often opens before the listener is attached
      if (conn.open) this._markConnected();

      conn.on("close", () => {
        if (this.conn !== conn) return;
        const was = this.connected;
        this.connected = false;
        this.remote = null;
        this.setStatus("disconnected", "Opponent left");
        if (was) this.onDisconnected && this.onDisconnected();
      });
      conn.on("error", (e) => {
        if (this.conn !== conn) return;
        const msg = (e && e.type) || (e && e.message) || "Connection error";
        if (!this.connected) this.setStatus("error", String(msg));
      });
    },

    createRoom() {
      this.leave(false);
      this.role = "host";
      this.room = code();
      this.hostPeerId = null;
      this.setStatus("hosting", "Creating room…");
      if (typeof Peer === "undefined") {
        this.setStatus("error", "PeerJS failed to load — refresh the page");
        return Promise.reject(new Error("PeerJS missing"));
      }
      return new Promise((resolve, reject) => {
        let settled = false;
        const peer = new Peer(PEER_OPTS);
        this.peer = peer;

        peer.on("open", (id) => {
          this.hostPeerId = id;
          this.setStatus("waiting", "Share the invite link — keep this tab open");
          if (!settled) {
            settled = true;
            resolve(this.room);
          }
        });

        peer.on("connection", (conn) => {
          if (this.connected && this.conn && this.conn.open) {
            try {
              conn.close();
            } catch (e) {}
            return;
          }
          this.setStatus("connecting", "Player joining…");
          this._wire(conn);
        });

        peer.on("disconnected", () => {
          if (this.peer && !this.peer.destroyed) {
            try {
              this.peer.reconnect();
            } catch (e) {}
          }
        });

        peer.on("error", (e) => {
          const msg = (e && e.type) || (e && e.message) || "Host error";
          this.setStatus("error", String(msg));
          if (!settled) {
            settled = true;
            reject(e);
          }
        });

        setTimeout(() => {
          if (!settled) {
            settled = true;
            this.setStatus("error", "Broker timeout — refresh and try again");
            reject(new Error("host broker timeout"));
          }
        }, 25000);
      });
    },

    _connectToHost(peer, hostId) {
      this.setStatus("joining", "Connecting to host…");
      // Default binary serialization — json mismatches can prevent open
      const conn = peer.connect(hostId, { reliable: true });
      this._wire(conn);
      conn.on("open", () => {
        if (this.conn !== conn) return;
        this._retries = 0;
        if (this._joinResolve) {
          const r = this._joinResolve;
          this._joinResolve = null;
          this._joinReject = null;
          r(this.room);
        }
      });
      conn.on("error", () => {
        if (this.conn !== conn) return;
        this._scheduleJoinRetry(hostId);
      });
    },

    _scheduleJoinRetry(hostId) {
      if (this.connected) return;
      this._retries += 1;
      if (this._retries > 8) {
        this.setStatus(
          "error",
          "Could not reach host — keep host tab open, same site URL, try a new invite link"
        );
        if (this._joinReject) {
          const r = this._joinReject;
          this._joinResolve = null;
          this._joinReject = null;
          r(new Error("timeout"));
        }
        return;
      }
      this.setStatus("joining", "Retrying… (" + this._retries + "/8)");
      setTimeout(() => {
        if (this.connected) return;
        // peer-unavailable destroys the Peer — always make a fresh one
        this._destroyPeer();
        if (typeof Peer === "undefined") return;
        const peer = new Peer(PEER_OPTS);
        this.peer = peer;
        peer.on("open", () => {
          if (this.peer === peer) this._connectToHost(peer, hostId);
        });
        peer.on("error", (e) => {
          if (this.peer !== peer) return;
          const t = (e && e.type) || "";
          if (t === "peer-unavailable" || t === "network" || t === "server-error" || t === "websocket-error") {
            this._scheduleJoinRetry(hostId);
            return;
          }
          // Still retry soft failures; only stop on browser-incompatible etc.
          if (t === "browser-incompatible" || t === "ssl-unavailable" || t === "invalid-key") {
            this.setStatus("error", String(t));
            if (this._joinReject) {
              const r = this._joinReject;
              this._joinResolve = null;
              this._joinReject = null;
              r(e);
            }
            return;
          }
          this._scheduleJoinRetry(hostId);
        });
      }, 900 + 700 * this._retries);
    },

    joinRoom(room, hostPeerId) {
      this.leave(false);
      this.role = "guest";
      this.room = String(room || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 8);
      this.hostPeerId = hostPeerId ? String(hostPeerId).trim() : null;
      this._retries = 0;

      if (!this.hostPeerId) {
        this.setStatus("error", "Invite link incomplete — ask host to copy the link again");
        return Promise.reject(new Error("missing host id"));
      }
      this.setStatus("joining", "Connecting to host…");
      if (typeof Peer === "undefined") {
        this.setStatus("error", "PeerJS failed to load — refresh the page");
        return Promise.reject(new Error("PeerJS missing"));
      }

      return new Promise((resolve, reject) => {
        this._joinResolve = resolve;
        this._joinReject = reject;

        const peer = new Peer(PEER_OPTS);
        this.peer = peer;

        peer.on("open", () => {
          this._connectToHost(peer, this.hostPeerId);
        });

        peer.on("error", (e) => {
          if (this.peer !== peer) return;
          const t = (e && e.type) || (e && e.message) || "Join failed";
          if (t === "peer-unavailable" || t === "network" || t === "server-error") {
            this._scheduleJoinRetry(this.hostPeerId);
            return;
          }
          if (t === "browser-incompatible" || t === "ssl-unavailable") {
            this.setStatus("error", String(t));
            reject(e);
            return;
          }
          this._scheduleJoinRetry(this.hostPeerId);
        });

        this._clearJoinTimer();
        this._joinTimer = setTimeout(() => {
          if (!this.connected) {
            this.setStatus(
              "error",
              "Could not reach host — keep host tab open, same website URL, disable VPN, copy a fresh invite"
            );
            if (this._joinReject) {
              const r = this._joinReject;
              this._joinResolve = null;
              this._joinReject = null;
              r(new Error("timeout"));
            }
          }
        }, 60000);
      });
    },

    send(msg) {
      if (!this.conn || !this.connected) return false;
      try {
        const clean = JSON.parse(JSON.stringify(msg));
        if (this.conn.open) {
          this.conn.send(clean);
          return true;
        }
        return false;
      } catch (e) {
        try {
          this.conn.send(msg);
          return true;
        } catch (e2) {
          return false;
        }
      }
    },

    leave(resetStatus) {
      this._clearJoinTimer();
      this._joinResolve = null;
      this._joinReject = null;
      this._destroyPeer();
      this.role = null;
      this.room = null;
      this.hostPeerId = null;
      this._retries = 0;
      if (resetStatus !== false) this.setStatus("idle", "");
    },

    parseInvite() {
      const q = new URLSearchParams(location.search);
      const room = q.get("room") || q.get("join");
      const host = q.get("host") || q.get("peer");
      if (!room && !host) return null;
      return {
        room: room ? String(room).toUpperCase() : "",
        host: host ? String(host).trim() : "",
      };
    },
  };

  global.Netplay = Netplay;
})(window);
