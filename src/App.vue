<template>
  <v-app>
    <v-app-bar :elevation="1">
      <v-app-bar-title
        ><img class="logo" src="./assets/logo.png"
      /></v-app-bar-title>

      <v-chip
        v-if="_auth"
        class="ma-2"
        slor="end"
        prepend-icon="mdi-account-check"
      >
        {{ _auth.user }}

        <button @click="_logout()">| Irten</button>
      </v-chip>

      <template v-for="(conn, i) in connected" :key="i">
        <v-chip
          v-if="conn.active == false"
          class="ma-2"
          color="error"
          prepend-icon="mdi-wifi-alert"
        >
          {{ conn.name }}
        </v-chip>

        <v-chip
          v-else
          class="ma-2"
          color="success"
          prepend-icon="mdi-wifi"
          slor="end"
        >
          {{ conn.name }}
        </v-chip>
      </template>

      <v-chip class="ma-2" color="primary" prepend-icon="mdi-laptop">
        {{ hostname }}
      </v-chip>
    </v-app-bar>

    <v-layout style="margin-top: 65px">
      <v-navigation-drawer
        v-model="drawer"
        :rail="rail"
        permanent
        @click="rail = false"
      >
        <v-list-item
          prepend-avatar="https://randomuser.me/api/portraits/men/85.jpg"
          title="John Leider"
          nav
        >
          <template v-slot:append>
            <v-btn
              icon="mdi-chevron-left"
              variant="text"
              @click.stop="rail = !rail"
            ></v-btn>
          </template>
        </v-list-item>

        <v-divider></v-divider>

        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-checkbox-marked-circle"
            title="Home"
            to="/home"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-cog"
            title="Ezarpenak"
            to="/settings"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-account-group-outline"
            title="Parte-hartzaileak"
            to="/inscritos"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-account-group-outline"
            title="Admin"
            to="/admin"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-account-group-outline"
            title="Splitak"
            to="/splits"
          ></v-list-item>
        </v-list>

        <div v-for="(event, i) in events" :key="i">
          <pre>{{ event.start }}</pre>
          <p>{{ event.name }}: <Chrono :time="event.start" /></p>
        </div>
      </v-navigation-drawer>
      <v-main class="main-layout">
        <button @click="_disconnect()">DISCONNECT</button>

        <router-view></router-view>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script>
import Chrono from "@/components/Chrono.vue";
import socket from "./socket";
import moment from "moment";
import { connect } from "net";

export default {
  name: "App",
  components: {
    Chrono,
  },
  data() {
    return {
      firmware: null,
      drawer: true,
      rail: true,
      selectedSplit: null,
      hostname: "defecto",
      readers: null,
    };
  },
  async mounted() {
    window.ipc.send("toMain", ["load_list"]);
    window.ipc.send("toMain", ["get_hostname"]);

    this.$store.commit("_CONNECTED", null);

    //konexioak jaso preloadetik
    let that = this;

    window.ipc.handle(
      "fromMain",
      () =>
        function (event, data) {
          if (data[0] == "connection") {
            let readers = that.connected;
            readers.map((res, i) => {
              if (res.name == data[1]) res.active = true;
            });
            that.$store.commit("_CONNECTED", readers);
          }

          // hostname
          if (data[0] == "hostname") {
            that.hostname = data[1];
            that.$store.commit("_SET_HOSTNAME", that.hostname);
          }

          // delete items (count)
          if (data[0] == "deleted") {
            if (data[1]) that.$store.commit("_RESET_ITEMS", []);
          }

          if (data[0] == "connection-error") {
            readers = that.$store.state.connected;
            readers.map((res, i) => {
              if (i == data[1]) res.active = false;
            });
            alert(`${readers[data[1]].name}-ekin konexioa galdu da...`);
            // RE-conectar todos los readers
            that.$store.commit("_CONNECTED", readers);
          }

          // inventory
          if (data[0] == "inventory") {
            that.$store.commit("_SAVE_ITEMS", data[1]);
          }

          // rellenar la lista de lecturas ITEMS
          if (data[0] == "load") {
            if (data[1].length) {
              data[1].forEach((res) => {
                that.$store.commit("_SAVE_ITEMS", res);
              });
            }
          }

          if (data[0] == "send-cookies") {
            let cookie = data[1];

            if (cookie == "auth") {
              let auth = data[2];
              that.$store.commit("_AUTH", JSON.parse(auth[0].value));
              that.$router.push("/home");
            }

            if (cookie == "readers") {
              let readers = data[2].length
                ? JSON.parse(data[2][0].value)
                : null;
              that.$store.commit("_CONNECTED", readers);
              that._setReaders(readers);
              console.log("setup", readers);
            }

            if (cookie == "serial") {
              that.$store.commit("_SET_SERIAL_PORT", data[2][0].value);
              //let readers = JSON.parse(VueCookieNext.getCookie("readers"));
            }
          }
        }
    );

    // retrieve start cookies
    window.ipc.send("toMain", ["get-cookies", "auth"]);
    window.ipc.send("toMain", ["get-cookies", "readers"]);
    window.ipc.send("toMain", ["get-cookies", "serial"]);

    let events;
    // socket
    socket.on("message", (msg) => {
      if (msg) {
        msg = JSON.parse(msg);
        let events = that.$store.state.events;

        events.map((res) => {
          msg.events.forEach((id) => {
            if (id == res.unique_id) {
              res.start = msg.start;
              res["pretty_start"] = moment(parseInt(msg.start)).format(
                "YYYY-MM-DD HH:mm:ss.SSS"
              );
            }
          });
        });

        that.$store.commit("_SET_EVENTS", events);

        window.ipc.send("toMain", ["start-time", JSON.stringify(events)]);
      }
    });

    // obtener todos los eventos de la carrera (generales)
    await this.$store.dispatch("_get_events");

    // hasierako atleta guztien excela montatu
    await this.$store.dispatch("_get_participants");

    // Obtener los cronos iniciales de la/s carrera/s
    await this.$store.dispatch("_get_cronos");

    // Ordenagailu honentzako splitak ekarri
    await this.$store.dispatch("_get_current_pc_splits");
  },
  computed: {
    split() {
      let selected = this.$store.state.splits.filter((res) => {
        if (res.used) {
          return res;
        }
      });

      return selected[0];
    },
    connected() {
      return this.$store.state.connected;
    },
    events() {
      return this.$store.state.events;
    },
    _auth() {
      return this.$store.state._auth;
    },
    _canInventory() {
      return this.$store.getters.canInventory;
    },
  },
  watch: {
    connected(val) {
      console.log("alive", val);
      window.ipc.send("toMain", ["alive", JSON.stringify(val)]);
    },
  },
  methods: {
    _disconnect() {
      this.connected.map((reader) => {
        reader.active = false;
      });

      window.ipc.send("toMain", [
        "remove-cookies",
        "readers",
        JSON.stringify(this.connected),
      ]);

      window.ipc.send("toMain", ["disconnect"]);
    },
    stringToSlug(str) {
      return str
        .toLowerCase() // Convert the string to lowercase
        .trim() // Trim whitespace from both ends of the string
        .replace(/[^\w\s-]/g, "") // Remove all non-word characters (excluding whitespace and hyphens)
        .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with a single hyphen
        .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
    },
    _logout() {
      this.$store.commit("_AUTH", null);
      window.ipc.send("toMain", ["remove-cookies", "auth"]);
      this.$router.push("/");
    },
    _setReaders(currentReaders) {
      // Readerrak zehaztu - defektuz 1
      if (!currentReaders) {
        currentReaders = [
          {
            name: "Reader 1",
            ip: "192.168.1.178",
            port: "4001",
            ants: [0, 0, 0, 0, 0, 0, 0, 0],
            power: [33, 33, 33, 33, 33, 33, 33, 33],
            active: false,
          },
        ];
      } else {
        currentReaders.map((res) => {
          res.active = false;
        });
      }
      // conectar todos los readers
      this.$store.commit("_CONNECTED", currentReaders);
    },
  },
};
</script>

<style lang="scss">
@font-face {
  font-family: "Share Tech Mono";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/sharetechmono/v15/J7aHnp1uDWRBEqV98dVQztYldFcLowEFA87Heg.woff2)
    format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191,
    U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

// BODY {
//   font-family: "Share Tech Mono", sans-serif;
// }
.hello {
  overflow-y: scroll;
  height: 100%;
}
.main-layout {
  height: calc(100vh - 125px);
  margin: 30px;
}
.logo {
  height: 50px;
}
</style>
