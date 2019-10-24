(function(app) {
  const AppConfig = {
    PROTOCOL: "ws:",
    HOST: "localhost",
    PORT: ":8080"
  };
  const listeners = new Map();
  const fake = {
    sendJSON() {},
    on() {}
  };
  /**
   * init socket
   * @return {WebSocket}
   */
  function initSocket() {
    const socket = new WebSocket(
      AppConfig.PROTOCOL + AppConfig.HOST + AppConfig.PORT
    );
    socket.sendJSON = json => socket.send(JSON.stringify(json));
    socket.onmessage = event => {
      console.log(event);
      const message = JSON.parse(event.data);
      const { event: type } = message;
      if (listeners.has(type)) {
        listeners.get(type)(message);
      }
    };
    let reconnectTimeout;
    socket.onclose = reason => {
      // 1006 close abnormal
      if (reason.code === 1006) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(() => {
          // app.socket = initSocket();
        }, 5000);
      }
      app.socket = fake;
    };
    socket.onerror = e => {
      console.log(e);
      app.socket = fake;
    };
    socket.on = (type, fn = () => {}) => {
      listeners.set(type, fn);
    };
    return socket;
  }
  app.socket = initSocket();
})(window.app);
