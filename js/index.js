(function(app) {
    'use strict';
    const socket = app.socket;
    socket.onopen = () => {
        console.info('connection has been established');
    } 
})(window.app);