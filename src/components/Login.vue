<template>
  <div class="login">
    <div>
      <img src="../assets/azkar-new-white.svg" class="logo-login" />

      <v-text-field
        label="Erabiltzailea"
        placeholder="Erabiltzailea"
        v-model="username"
        variant="solo"
        class="my-3"
      ></v-text-field>

      <v-text-field
        label="Pasahitza"
        placeholder="Pasahitza"
        v-model="password"
        variant="solo"
        type="password"
        class="my-3"
      ></v-text-field>

      <v-btn
        class="mt-2"
        type="submit"
        @click="login"
        block
        variant="tonal"
        color="white"
        size="x-large"
        >Saioa hasi</v-btn
      >

      <v-col>
        <Loader v-if="loader" class="my-2" color="white" />
      </v-col>
      <v-alert
        v-if="error"
        :text="error"
        color="red"
        icon="mdi-alert-circle-outline"
        class="my-2"
      ></v-alert>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import axios from "axios";
import Loader from "./Loader.vue";

export default {
  name: "LoginComponent",
  components: {
    Loader,
  },
  data() {
    return {
      error: false,
      username: "",
      password: "",
      loader: false,
    };
  },
  mounted() {
    // document.title = "Hasiera - Loraldia QR aplikazioa";
    if (this._auth) this.$router.push("/server");
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
            this.$router.push("/server");

            setTimeout(() => {
              this.error = false;
            }, 3500);

            return true;
          } else {
            this.error = "Sartutako datuak ez dira zuzenak.";
          }
        } catch (error) {
          this.error = "Sartutako datuak ez dira zuzenak.";
          this.loader = false;
        }
      }, 0);
    },
  },
};
</script>

<style lang="scss">
.login {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login > div {
  padding: 30px;
  text-align: center;
  display: block;
  width: 500px;
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

.logo-login {
  margin: 0 0 20px 0;
  height: 65px !important;
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
