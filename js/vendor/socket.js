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
  socket.sendJSON = json => socket.send(JSON.stringify(json));
  const listeners = new Map();
  socket.onmessage = event => {
    console.log(event);
    const message = JSON.parse(event.data);
    const { event: type } = message;
    if (listeners.has(type)) {
      listeners.get(type)(message);
    }
  };
  socket.on = (type, fn = () => {}) => {
    listeners.set(type, fn);
  };

  app.socket = socket;
})(window.app);
