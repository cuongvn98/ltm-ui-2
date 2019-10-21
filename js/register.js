((app, $) => {
  "use strict";
  const socket = app.socket;
  $("#form").submit(e => {
    e.preventDefault();
    const username = getById("username").value;
    const password = getById("password").value;
    if (!username || !password) {
      toggleModal("Lỗi", "Không được để trống");
      return;
    }
    socket.sendJSON({ type: "register", username, password });
    //
  });
  socket.on("register", ({ type, status, message }) => {
    toggleModal(status, message);
    if (status === "success") {
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  });
  /**
   * get Element by Id
   * @param {String} id
   * @return {Element}
   */
  function getById(id) {
    return document.getElementById(id);
  }
  /**
   * toggle modal
   * @param {*} title
   * @param {*} message
   */
  function toggleModal(title, message) {
    $("#response-title").text(title);
    $("#response-message").text(message);
    $("#register-modal").modal();
  }
})(window.app, $);
