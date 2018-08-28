var app = new Vue({
  el: "#app",
  data: {
    user: null,
    registerUser: {
      email: "",
      password: ""
    },
    loginUser: {
      email: "",
      password: ""
    }
  },

  methods: {
    checkUser: async function() {
      const res = await fetch("/auth/user/user", {
        method: "POST",
        credentials: "include"
      });
      const body = await res.json();
      if (body.status === "error") {
        alert(body.message);
        return;
      }
      Vue.set(this, "user", body.user);
    },

    register: async function(e) {
      const email = this.registerUser.email;
      const password = this.registerUser.password;
      const res = await fetch("/auth/local/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        }),
        credentials: "include"
      });
      const body = await res.json();
      if (body.status === "error") {
        alert(body.message);
        return;
      }
      await this.loginWithEmailPassword(email, password);
    },

    loginWithEmailPassword: async function(username, password) {
      const res = await fetch("/auth/local/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        }),
        credentials: "include"
      });
      const body = await res.json();
      if (body.status === "error") {
        alert(body.message);
        return;
      }
      Vue.set(this, "user", body.user);
      this.clearForm();
    },

    logout: async function() {
      const res = await fetch("/auth/session/logout", {
        method: "POST",
        credentials: "include"
      });
      const body = await res.json();
      if (body.status === "error") {
        alert(body.message);
        return;
      }
      Vue.set(this, "user", null);
    },

    clearForm: function() {
      this.registerUser.email = "";
      this.registerUser.password = "";
      this.loginUser.email = "";
      this.loginUser.password = "";
    }
  },

  mounted: function() {
    this.$nextTick(function() {
      this.checkUser();
    });
  }
});
