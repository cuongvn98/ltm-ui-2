(function(app, state, $) {
  "use strict";
  const socket = app.socket;
  socket.onopen = () => {
    console.info("connection has been established");
  };
  login().then(username => {
    state.username = username;
    initData();
    initInputEvent();
    initModalEvent();
    autoUpdateStatus();
    initInvite();
    initKick();
    initChangeStatus();
    initInviteList();
    initChangeStatus();
  });
  /**
   *
   */
  function initInviteList() {
    const el = $("#invite-select");
    el.empty();
    getUsers().then(users => {
      users.forEach(username => {
        if (username !== state.username) {
          el.append(`<option value="${username}">${username}</option>`);
        } else {
          el.append(`<option value="${username}"></option>`);
        }
      });
      el.select(state.username);
    });
  }
  /**
   * init prefix data
   */
  function initData() {
    /**
     * get room list
     */
    function getRoomList() {
      socket.sendJSON({ type: "room.list" });
      socket.on("room.list", ({ status, data }) => {
        if (status === "success") {
          state.rooms = data;
          renderChatList();
        }
      });
    }
    getRoomList();
  }
  /**
   * login to system
   * @return {Promise}
   */
  function login() {
    /**
     * Submit data to server
     * @param {*} username
     * @param {*} password
     */
    function submitLogin(username, password) {
      socket.sendJSON({ type: "login", username, password });
    }
    /**
     * show error message on modal
     * @param {*} message
     */
    function showError(message) {
      $("#response-message").text(message);
      setTimeout(() => {
        $("#response-message").text("No message here !");
      }, 500);
    }
    /**
     * @param {boolean} show
     * toggle form login
     */
    function toggleLoginModal(show = true) {
      const t = show ? "show" : "hide";
      $("#login-modal").modal(t);
    }

    return new Promise(resolve => {
      toggleLoginModal();
      $("#login-btn").click(() => {
        const username = $("#username").val();
        const password = $("#password").val();
        submitLogin(username, password);
        socket.on("login", ({ type, status, message }) => {
          if (status === "successful") {
            console.log("success");
            toggleLoginModal(false);
            resolve(username);
            //
          } else {
            showError(message);
          }
        });
      });
    });
  }
  /**
   *
   * @param {*} message
   */
  function appendMessage(message) {
    if (message.id_room !== state.room.id) return;
    /**
     * gen left message html
     * @param {object} param0
     * @return {string}
     */
    function genLeftMessage({ username, content }) {
      return `
              <div class="message">
                <div>
                  <div class="sender">${username}</div>
                  <div class="content">${content}</div>
                </div>
              </div>
        `;
    }
    /**
     *
     * @param {object} param0
     * @return {string}
     */
    function genRightMessage({ username, content }) {
      return `
              <div class="message message-right">
                <div>
                  <div class="sender">${username}</div>
                  <div class="content">${content}</div>
                </div>
              </div>
      `;
    }

    const el = $("#message-box");
    let html;
    if (message.username === state.username) {
      html = genRightMessage(message);
    } else {
      html = genLeftMessage(message);
    }
    el.append(html);
  }
  /**
   * render messages
   * @param {Array} messages
   */
  function renderMessages(messages) {
    const el = $("#message-box");
    el.empty();
    messages.forEach(message => {
      appendMessage(message);
    });
    setTimeout(() => {
      scrollSmoothToBottom("message-box");
    }, 500);
  }
  /**
   * render chat list
   */
  function renderChatList() {
    /**
     *  get room in rooms state with itself id
     * @param {*} id
     * @return {object}
     */
    function getRoomById(id) {
      for (let i of state.rooms) {
        if (i.id === id) return i;
      }
      return undefined;
    }
    /**
     * get messages
     * @param {number} room
     */
    function getMessage(room) {
      socket.sendJSON({ type: "message.list", room });
      socket.on("message.list", ({ room: c, messages }) => {
        if (room === c) {
          renderMessages(messages);
          //
        }
      });
    }
    /**
     * on Room click
     * @param {number} id
     * @return {Function}
     */
    function onClick(id) {
      return () => {
        if (!state.room || state.room.id !== id) {
          state.room = getRoomById(id);
          getMessage(id);
          changeRoomName(state.room.groupIP);
          changeRoomMember(id);
        }
      };
    }
    /**
     *
     * @param {number} room
     */
    function changeRoomMember(room) {
      socket.sendJSON({ type: "join.list", room });
      socket.on("join.list", ({ usernames }) => {
        const el = $("#member-list");
        const kickSelectEl = $("#kick-select");
        el.empty();
        kickSelectEl.empty();
        [...new Set(usernames)].forEach(user => {
          el.append(
            `<li class="list-group-item" id="mem-${user}">${user}</li>`
          );
          if (user !== state.username) {
            kickSelectEl.append(`<option value=${user}>${user}</option>`);
          } else {
            kickSelectEl.append(`<option value=${user}></option>`);
          }
        });
      });
    }
    /**
     * change room name on top-bar
     * @param {string} tx
     */
    function changeRoomName(tx) {
      $("#room-name").text(tx);
    }
    /**
     *
     * @param {String} avt
     * @param {String} name
     * @param {Strign} content
     * @param {number} time
     * @param {number} id
     * @param {number} type
     * @return {String}
     */
    function genHtml(avt, name, content, time, id, type) {
      const date = new Date(time).toLocaleString();
      return `
            <div class="room" id="room-${id}">
              <div class="avt-box">
                <div class="avt ${type}">
                  ${avt}
                </div>
              </div>
              <div class="info">
                <div>
                  <div class="name">${name}</div>
                  <div class="time">${date}</div>
                </div>
                <div class="message">${content}</div>
              </div>
            </div>
      `;
    }

    const el = $("#room-list");
    el.empty();
    state.rooms.forEach(({ groupIP: name, id, time, type }) => {
      const html = genHtml(name.substring(0, 2), name, "...", time, id, type);
      el.append(html);
      $(`#room-${id}`).click(onClick(id));
    });
  }
  /**
   *
   */
  function initInputEvent() {
    $("#message-input").on("keypress", e => {
      if (e.which === 13) {
        console.log("enter");
        e.preventDefault();
        sendMessage($("#message-input").val());
        $("#message-input").val("");
      }
    });
    /**
     * emit message to server
     * @param {string} content
     */
    function sendMessage(content) {
      if (state.room && state.room.id) {
        socket.sendJSON({ type: "message.new", room: state.room.id, content });
      }
    }
    socket.on(
      "message.new",
      message => appendMessage(message) || scrollSmoothToBottom("message-box")
    );
  }
  /**
   *scroll bottom
   * @param {string} id
   */
  function scrollSmoothToBottom(id) {
    const div = document.getElementById(id);
    $("#" + id).animate(
      {
        scrollTop: div.scrollHeight - div.clientHeight
      },
      100
    );
  }
  /**
   * init event
   */
  function initModalEvent() {
    $("#create-room-btn").click(() => {
      getUsers().then(users => {
        renderUsers(users);
        $("#create-room-modal").modal();
      });
    });
    $("#create-group-btn").click(() => {
      $("#create-group-modal").modal();
    });
    $("#submit-room-btn").click(() => {
      const username = $("#inputState").val();
      const name = $("#created-room-name").val();
      $("#submit-room-btn").prop("disabled", true);
      onSubmitCreateRoom(username, name);
    });
    $("#submit-group-btn").click(() => {
      const name = $("#group-name-input").val();
      $("#submit-group-btn").prop("disabled", true);
      socket.sendJSON({ type: "group.create", name });
      setTimeout(() => window.location.reload(), 500);
    });

    /**
     *
     * @param {String} users
     */
    function renderUsers(users) {
      $("#inputState").empty();
      users.forEach(user => {
        $("#inputState").append(`<option value="${user}">${user}</option>`);
      });
    }
    /**
     *
     * @param {String} username
     * @param {String} name
     */
    function onSubmitCreateRoom(username, name) {
      console.log(username, name);
      socket.sendJSON({ type: "room.create", username, name });
      setTimeout(() => window.location.reload(), 500);
    }
  }
  /**
   *
   */
  function autoUpdateStatus() {
    /**
     * @return {Array<String>}
     */
    function getListMembers() {
      return [
        ...new Set([...$("#member-list").children()].map(i => $(i).text()))
      ];
    }
    socket.on("user.status", ({ status, username }) => {
      const el = $(`#mem-${username}`);
      el.removeClass(
        "list-group-item-primary list-group-item-warning list-group-item-danger"
      );
      console.log(status, el);
      if (status === "online") {
        el.addClass("list-group-item-primary");
      } else if (status === "offline") {
        el.addClass("list-group-item-danger");
      } else if (status === "idle") {
        el.addClass("list-group-item-warning");
      }
    });
    setInterval(() => {
      const usernames = getListMembers();
      usernames.forEach(username =>
        socket.sendJSON({ type: "user.status", username })
      );
      //
    }, 3000);
  }
  /**
   *
   */
  function initInvite() {
    socket.on("group.invite", ({ room, username }) => {});
    $("#invite-select").on("change", function(e) {
      const val = $(e.target).val();
      console.log(val, state.room);
      if (val === state.username) return;
      if (val && state.room && state.room.id) {
        socket.sendJSON({
          type: "group.invite",
          room: state.room.id,
          username: val
        });
      }
    });
  }
  /**
   *
   */
  function initKick() {
    socket.on("group.invite", ({ room, username }) => {});

    $("#kick-select").on("change", function(e) {
      const val = $(e.target).val();
      if (val === state.username) return;
      console.log(val, state.room);
      if (val && state.room && state.room.id) {
        socket.sendJSON({
          type: "group.kick",
          room: state.room.id,
          username: val
        });
      }
    });
  }
  /**
   *
   */
  function initChangeStatus() {
    $("#change-status-select").on("change", function(e) {
      const val = $(e.target).val();
      socket.sendJSON({ type: "change.status", status: val });
    });
  }
  /**
   * @return {Promise}
   */
  function getUsers() {
    return new Promise(resolve => {
      socket.sendJSON({ type: "user.find" });
      socket.on("user.find", ({ users }) => resolve(users));
    });
  }
})(window.app, window.state, $);
