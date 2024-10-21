<template>
  <div class="login">
    <div>
      <img src="../assets/logo.png" class="logo" />

      <input type="text" v-model="username" />
      <input type="password" v-model="password" />

      <button type="submit" @click="login">Saioa hasi</button>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import axios from "axios";
export default {
  name: "LoginComponent",
  data() {
    return {
      error: false,
      username: "2klik",
      password: "2k_Komunikazioa12",
      loader: false,
    };
  },
  mounted() {
    // document.title = "Hasiera - Loraldia QR aplikazioa";
    console.log("auth", this._auth);
    if (this._auth) this.$router.push("/home");
  },

  computed: {
    _auth() {
      return this.$store.state._auth;
    },
  },
  methods: {
    async login(e) {
      e.preventDefault();

      if (!this.username || !this.password) return;

      this.loader = true;
      this.error = null;
      let params = {
        username: this.username,
        password: this.password,
      };
      setTimeout(async () => {
        try {
          let res = await axios.post("/jwt-auth/v1/token", params);
          this.loader = false;

          if (res.status === 200) {
            let authObject = {
              token: res.data.token,
              ID: res.data.ID,
              user: res.data.user_nicename,
            };

            window.ipc.send("toMain", [
              "set-cookies",
              "auth",
              JSON.stringify(authObject),
            ]);
            this.$store.commit("_AUTH", authObject);
            this.$router.push("/home");

            setTimeout(() => {
              this.error = false;
            }, 3500);

            return true;
          } else {
            this.error = "Sartutako datuak ez dira zuzenak.";
          }
        } catch (error) {
          this.error = "Sartutako datuak ez dira zuzenak.";

          setTimeout(() => {
            this.error = false;
          }, 3500);

          this.loader = false;
        }
      }, 0);
    },
  },
};
</script>

<style lang="css">
.login {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
}

.login > div {
  padding: 30px;
  width: 100%;
  text-align: center;
}

ion-button {
  margin: 30px 0;
}

.card-absolute {
  position: fixed;
  width: 85%;
  left: 5%;
  bottom: 25px;
  border: 3px solid rgb(235, 166, 166);
  box-shadow: none;
}

.logo {
  margin: 0 0 20px 0;
  max-height: 40px;
}

.copy {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  font-size: 9px;
  padding: 15px;
  text-align: center;
  color: #adadad;
  text-transform: uppercase;
}
</style>
