(function(app) {
  const AppConfig = {
    PROTOCOL: "ws:",
    // TODO: change to localhost if you wish to run it locally
    HOST: "localhost",
    PORT: ":8080"
  };
  const socket = new WebSocket(
    AppConfig.PROTOCOL + AppConfig.HOST + AppConfig.PORT
  );

  const listeners = new Map();
  /**
   *
   */
  socket.onmessage = message => {
    const { type } = message;
    if (listeners.has(type)) {
      listeners.get(type)(message);
    }
  };
  socket.on = (type, fn = () => {}) => {
    listeners.set(type, fn);
  };

  app.socket = socket;
})(window.app);
