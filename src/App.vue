<template>
  <v-app>
    <v-app-bar :elevation="1">
      <v-app-bar-title
        ><img class="logo" src="./assets/azkar-new.svg"
      /></v-app-bar-title>

      <v-btn v-if="race" stacked size="large" @click="_removeRace()">
        {{ race.name }}
      </v-btn>

      <v-btn v-if="_inventoryStatus" stacked size="x-large" @click="_stop()">
        <v-badge color="red" size="small" v-if="_inventoryStatus">
          <v-icon>mdi-access-point</v-icon>
        </v-badge>
      </v-btn>

      <v-btn v-else stacked size="x-large" @click="_inventory()">
        <v-badge color="success" size="small">
          <v-icon>mdi-access-point</v-icon>
        </v-badge>
      </v-btn>

      <v-chip
        class="ma-2"
        slor="end"
        prepend-icon="mdi-connection"
        @click="_disconnect()"
      >
        <button>Deskonektatu</button>

        <v-tooltip activator="parent" location="bottom"
          >Reader guztiak deskonektatuko dira</v-tooltip
        >
      </v-chip>

      <template v-for="(conn, i) in connected" :key="i">
        <v-chip
          v-if="conn.active == false"
          class="ma-2"
          color="red"
          prepend-icon="mdi-alert-circle"
        >
          {{ conn.name }}
        </v-chip>

        <v-chip
          v-else
          class="ma-2"
          color="success"
          prepend-icon="mdi-access-point-check"
          slor="end"
        >
          {{ conn.name }}
        </v-chip>
      </template>

      <v-chip class="ma-2" color="primary" prepend-icon="mdi-laptop">
        {{ hostname }}
      </v-chip>
    </v-app-bar>

    <v-layout style="margin-top: 65px" :class="{ 'login-page': _checkRoute() }">
      <v-navigation-drawer v-model="drawer" permanent>
        <!-- <v-list-item
          prepend-avatar="https://randomuser.me/api/portraits/men/85.jpg"
          title="2klik Timing"
          nav
        >
          <template v-slot:append>
            <v-btn
              icon="mdi-chevron-left"
              variant="text"
              @click.stop="rail = !rail"
            ></v-btn>
          </template>
        </v-list-item> -->

        <v-divider></v-divider>

        <v-list nav density="compact">
          <v-list-item
            prepend-icon="mdi-timer-play"
            title="Hasiera"
            to="/home"
          ></v-list-item>

          <!-- <v-list-item
            v-if="race"
            prepend-icon="mdi-percent-circle"
            title="Irakurketa tasa"
            to="/percents"
          ></v-list-item> -->

          <v-list-item
            v-if="!race"
            prepend-icon="mdi-key"
            title="Lasterketa kargatu"
            to="/otp"
          ></v-list-item>

          <v-list-item
            v-if="race"
            prepend-icon="mdi-image-filter-hdr"
            title="Splitak"
            to="/splits"
          ></v-list-item>

          <v-list-item
            v-if="race"
            prepend-icon="mdi-account-group"
            title="Parte-hartzaileak"
            to="/runners"
          ></v-list-item>

          <v-list-item
            v-if="race"
            prepend-icon="mdi-format-list-numbered"
            title="Sailkapenak"
            to="/results"
          ></v-list-item>

          <v-list-group value="Ezarpenak">
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                prepend-icon="mdi-cog"
                title="Reader ezarpenak"
              ></v-list-item>
            </template>

            <v-list-item title="Reader" to="/settings"></v-list-item>
            <v-list-item
              title="TAG Grabatzailea"
              to="/usb-reader"
            ></v-list-item>

            <v-list-item
              title="GPS zehaztu"
              to="/gps"
            ></v-list-item>

          </v-list-group>

          <v-divider class="mb-10"></v-divider>

          <v-list-item
            v-if="_auth"
            to="/server"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-server-network"
            title="Zerbitzaria"
          >
          </v-list-item>

          <v-list-item
            v-else
            to="/login"
            prepend-icon="mdi-server-network-off"
            title="Zerbitzarian konektatu"
          >
          </v-list-item>

          <v-list-item
            title="Sistemaren egoera"
            to="/system"
            prepend-icon="mdi-cogs"
          ></v-list-item>
        </v-list>

        <template v-slot:append>
          <v-list>
            <StartRace></StartRace>
          </v-list>
          <v-list nav density="compact">
            <v-list-item v-for="(event, i) in events" :key="i">
              <div class="d-flex">
                <div color="primary">
                  <div class="race-name">{{ event.name }}</div>
                  <Chrono :time="event.start" />
                </div>
              </div>
            </v-list-item>
          </v-list>
        </template>
      </v-navigation-drawer>
      <v-main class="main-layout">
        <router-view></router-view>
        <v-snackbar v-model="snack" timeout="3000" color="primary">
          {{ snack }}
        </v-snackbar>

        <v-btn
          icon="mdi-help-circle-outline"
          size="large"
          class="floating-help"
          @click="this.$router.push('/help')"
        ></v-btn>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script>
import axios from "axios";
import Chrono from "@/components/Chrono.vue";
import socket from "./socket";
import moment from "moment";
import { setTimeout } from "core-js";
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
      snack: false,
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
        async function (event, data) {
          // on start socket.io
          if (data[0] === "server-time") {
            const time = data[1];
            const affectedEvents = data[2] || [];
            const isStart = data[3]; // true o false

            const start = isStart ? time.timestamp : null;
            const pretty = time.pretty;

            const params = {
              events: affectedEvents,
              start,
              start_pretty: pretty,
            };

            // ✅ Actualizar reloj visual, aunque esté parado
            that._startRaceClocks(params);

            // ✅ Notificar al servidor backend siempre
            try {
              await axios.get("https://denborak.online/api/v2", {
                params: {
                  post_id: that.race.ID,
                  events: affectedEvents,
                  start_date: start,
                },
              });

              await axios.post("/v1/start-race", {
                post_id: that.race.ID,
                starts: JSON.stringify(params),
              });
            } catch (err) {
              console.log("Ez da internetera bidali...");
            }
          }

          // modify output power
          if (data[0] == "modify-output-power") {
            const db = data[1];
            const readerID = data[2];

            let r = that.connected;

            r.map((res, i) => {
              if (i == readerID) res.power = db;
            });

            that.$store.commit("_CONNECTED", r);
          }

          // global error
          if (data[0] == "global-error") {
            that.$store.commit("_GLOBAL_ERROR", data[1]);
          }

          if (data[0] == "connection") {
            let readers = that.connected;
            readers.map((res, i) => {
              if (res.name == data[1]) res.active = true;
            });
            that.$store.commit("_CONNECTED", readers);
          }

          // start list
          if (data[0] == "start-list") {
            that.$store.dispatch("_assocEventsSplits", {
              data1: data[1], //zerrenda
              data2: data[2], //goiburuak
            });
          }

          if (data[0] == "no-ants") {
            alert("Konektatu antenak eta hautatu hauek Ezarpenak atalean.");
          }

          if (data[0] == "demo-tag") {
            that.$store.commit("_DEMO_TAG", data[1]);
          }

          if (data[0] == "inventory-status") {
            that.$store.commit("_SET_INVENTORY_STATUS", data[1]);
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
            let readers = that.$store.state.connected;
            readers.map((res, i) => {
              if (i == data[1]) res.active = false;
            });
            //alert(`${readers[data[1]].name}-ekin konexioa galdu da...`);
            // RE-conectar todos los readers
            that.$store.commit("_CONNECTED", readers);
          }

          // inventory
          if (data[0] == "inventory") {
            that.$store.commit("_SAVE_ITEMS", data[1]);
          }

          // inventory AFETR DELETE ITEM
          if (data[0] == "inventory-after-delete") {
            that.$store.commit("_SAVE_ALL_ITEMS", data[1]);
            if (data[1].length && data[2] == "delete") {
              that.snack = "Erregistroa ezabatua izan da!";
            }

            if (data[1].length && data[2] == "edit") {
              that.snack = "Erregistroa ondo editatua izan da!";
            }
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

            if (!cookie) return;

            if (cookie == "auth") {
              let auth = data[2];

              if (auth.length) {
                that.$store.commit("_AUTH", JSON.parse(auth[0].value));
              }
            }

            if (cookie == "readers") {
              let readers = data[2].length
                ? JSON.parse(data[2][0].value)
                : null;
              that.$store.commit("_CONNECTED", readers);
              that._setReaders(readers);
            }

            if (cookie == "serial") {
              if (data[2][0])
                that.$store.commit("_SET_SERIAL_PORT", data[2][0].value);
            }

            if (cookie == "race") {
              if (!data[2].length) return;
              that.$store.commit("_SET_RACE", JSON.parse(data[2][0].value));
              that._getCloudData();
            }
          }
        }
    );

    // retrieve start cookies
    window.ipc.send("toMain", ["get-cookies", "auth"]);
    window.ipc.send("toMain", ["get-cookies", "readers"]);
    window.ipc.send("toMain", ["get-cookies", "serial"]);
    window.ipc.send("toMain", ["get-cookies", "race"]);
    // inventory status
    window.ipc.send("toMain", ["is-inventory-started"]);

    // socket
    socket.on("connected", (msg) => {
      if (msg.connected)
        this.$store.commit("_SET_STATUS", {
          desc: "socket",
          value: true,
        });
    });

    socket.on("connected-mongo", (msg) => {
      if (msg.connected)
        this.$store.commit("_SET_STATUS", {
          desc: "mongo",
          value: true,
        });
    });

    socket.on("message", (msg) => {
      if (msg) {
        msg = JSON.parse(msg);
        this._startRaceClocks(msg);
      }
    });

    setTimeout(() => {
      this.$router.push("/login");
    }, 300);
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
    race() {
      return this.$store.state.race;
    },
    events() {
      return this.$store.state.events;
    },

    items() {
      return this.$store.state.items;
    },
    startList() {
      return this.$store.state.startList;
    },
    _auth() {
      return this.$store.state._auth;
    },
    race() {
      return this.$store.state.race;
    },
    readDelay() {
      return this.$store.state.readDelay;
    },
    selectedSplits() {
      return this.$store.state.selectedSplits;
    },
    _canInventory() {
      return this.$store.getters.canInventory;
    },
    _inventoryStatus() {
      return this.$store.state.inventory;
    },
    sound() {
      return this.$store.state.sound;
    },
    start() {
      return this.$store.state.start;
    },
  },
  watch: {
    connected(val) {
      window.ipc.send("toMain", ["alive", JSON.stringify(val)]);
      if (!val) return;
      // setear la potencia de los readers
      val.forEach((r) => {
        window.ipc.send("toMain", ["get-output-power", JSON.stringify(r)]);
      });
    },
  },
  methods: {
    _startRaceClocks(msg) {
      let events = this.$store.state.events;

      events.map((res) => {
        if (!msg.events) return;

        msg.events.forEach((id) => {
          if (id == res.unique_id) {
            res.start = msg.start;
            res["pretty_start"] = moment(parseInt(msg.start)).format(
              "YYYY-MM-DD HH:mm:ss.SSS"
            );
          }
        });
      });

      this.$store.commit("_SET_EVENTS", events);

      window.ipc.send("toMain", ["start-time", JSON.stringify(events)]);
    },
    async _sendSocket() {
      window.ipc.send("toMain", ["socket-io"]);
    },
    _checkRoute() {
      if (this.$route.path === "/login") return true;
    },
    async _getCloudData() {
      this.$store.dispatch("_getCloudData");
    },
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
    _stop() {
      window.ipc.send("toMain", ["stop"]);
    },
    _delete() {
      if (confirm("Datuak ezabatu nahi al dituzu?"))
        window.ipc.send("toMain", ["delete"]);
    },
    _inventory() {
      if (!this._canInventory) {
        alert(
          "Ezin zara TAG irakurketa bat hasi Reader bat bera ere konektatu gabe."
        );
        return true;
      }

      window.ipc.send("toMain", [
        "inventory",
        this.readDelay * 1000,
        JSON.stringify(this.selectedSplits),
        JSON.stringify(this.race),
        this.sound,
      ]);
      
    },

    _removeRace() {
      const userConfirmed = confirm("Lasterketa hau itxi nahi duzu? ");

      if (userConfirmed) {
        this.$store.commit("_SET_RACE", null);
        this.$store.commit("_SET_EVENTS_SPLITS_HOSTS", null);
        this.$store.commit("_SET_SELECTED_SPLITS", []);
        this.$store.commit("_SET_EVENTS", []);
        this.$store.commit("_SET_START_LIST", []);
        window.ipc.send("toMain", ["remove-cookies", "race"]);
        this.$router.push("otp");
      }
    },
    _setReaders(currentReaders) {
      // Readerrak zehaztu - defektuz 1
      if (!currentReaders) {
        currentReaders = [
          {
            name: "Reader 1",
            ip: "192.168.1.178",
            port: "4001",
            desc: "",
            ants: [0, 0, 0, 0, 0, 0, 0, 0],
            power: [null, null, null, null, null, null, null, null],
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

.login-page {
  background-image: linear-gradient(60deg, #002b45, #ff0049);
}

.hello {
  overflow-y: auto;
  height: 100% !important;
  padding-bottom: 80px;
  overflow-x: hidden;
}
.main-layout {
  height: calc(100vh - 90px);
  margin: 20px 20px 0 20px !important;
}
.logo {
  height: 55px !important;
  max-height: 70px;
  padding: 10px 0 0 0 !important;
  margin: 0 !important;
}

.main-title {
  font-size: 30px !important;
  font-weight: 300;
}

.custom-table table tr:first-child {
  // background-image: linear-gradient(45deg, black, #444);
  color: #222;
  font-weight: bold !important;
}

.custom-table table tr:nth-child(2n) {
  background: rgba(black, 0.04);
}

.cronos {
  background: rgb(237, 237, 237);
}

.chrono-div {
  // font-family: "Upper-Clock";
  width: 100%;
}

.v-timeline-item__body {
  padding-block-start: 0px !important;
}

.race-name {
  font-weight: 300;
}
.copyright {
  border-top: 1px solid black;
  padding: 10px 0;
  margin-top: 30px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #676767;
  font-size: 10px;
}

.v-badge__badge {
  border: 3px solid white;
}

.system-status {
  position: fixed;
  bottom: 0;
  width: auto;
  left: 10px;
  overflow: hidden !important;
  background: transparent;
}

.floating-help {
  position: fixed !important;
  bottom: 30px !important;
  right: 20px !important;
}
</style>
