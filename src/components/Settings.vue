<template>
  <div class="main">
    <v-row>
      <v-col>
        <v-card class="main-card" v-for="(item, key) in tabs" :key="key">
          <v-text-field
            label="IP"
            variant="solo"
            v-model="item.ip"
          ></v-text-field>

          <v-text-field
            label="PORTUA"
            variant="solo"
            v-model="item.port"
          ></v-text-field>

          <!-- ANTENAK -->
          <div class="ants">
            <div
              class="ants__item"
              v-for="(ant, i) in item.ants"
              :key="i"
              cols="1"
            >
              <v-checkbox
                :label="_toString(i + 1)"
                v-model="item.ants[i]"
              ></v-checkbox>

              <v-text-field
                label="dB"
                variant="outlined"
                v-model="item.power[i]"
              ></v-text-field>
            </div>
          </div>

          <v-btn @click="_setOutputPower(item)" color="primary" size="small">
            Set Output power
          </v-btn>

          <v-btn @click="_checkAnts(item)" color="danger" size="small">
            Chek antennas
          </v-btn>

          <!-- ANTENAK -->
          <button @click="removeInput(key)">Ezabatu</button>
        </v-card>

        <button @click="addInput">Reader berria gehitu</button>

        <v-btn @click="_connect()">Konektatu</v-btn>

        <v-text-field
          label="Irakurketa atzerapena"
          variant="solo"
          v-model="readDelay"
        ></v-text-field>

        <v-btn @click="_set_read_delay()">Ezarri </v-btn>

        <v-alert
          v-if="message"
          class="my-5"
          color="success"
          icon="success"
          :text="message"
        ></v-alert>
      </v-col>
      <v-col>
        <!-- serial port -->
        <v-btn @click="_get_serial()">Obtener puertos disponibles</v-btn>
        <template v-if="serials">
          <v-select
            label="Serial Port"
            :items="serials"
            v-model="serial"
          ></v-select>
          <v-btn @click="_set_serial()" color="primary"
            >Establecer Puerto</v-btn
          >
        </template>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import moment from "moment-timezone";
export default {
  name: "SettingsComponent",
  data() {
    return {
      tabs: null,
      readDelay: null,
      message: null,
      serials: null,
      serial: null,
    };
  },
  mounted() {
    this.readDelay = this.$store.state.readDelay;

    this.serial = this._serial;
    console.log("conn", this.connected);
    // set reader info
    this.tabs = this.connected;

    let system_datetime = moment().unix();
    let real_datetime = moment().unix(moment().tz("Europe/Madrid").format());
    if (system_datetime == real_datetime)
      console.log("time", real_datetime, system_datetime);
    //change format as needed…

    let that = this;
    window.ipc.handle(
      "fromMain",
      () =>
        function (event, data) {
          if (data[0] == "checking") {
            let read = data[1][6];
            that.message = "Irakurritako tag kopurua: " + read;
          }

          if (data[0] == "send-serials") {
            console.log(JSON.parse(data[1]));
            that.serials = JSON.parse(data[1]);
          }
        }
    );
  },
  computed: {
    hostname() {
      return this.$store.state.hostname;
    },
    connected() {
      return this.$store.state.connected;
    },
    _serial() {
      return this.$store.state.serial;
    },
  },
  methods: {
    _get_serial() {
      window.ipc.send("toMain", ["get-serial"]);
    },
    _set_serial() {
      window.ipc.send("toMain", ["set-cookies", "serial", this.serial]);
      this.$store.commit("_SET_SERIAL_PORT", this.serial);
    },
    _set_read_delay() {
      this.$store.commit("_SET_READ_DELAY", this.readDelay);
      this.$store.commit("_SET_BEEP", this.beep);
    },
    _getOutputPower(item) {
      window.ipc.send("toMain", ["get-output-power", JSON.stringify(item)]);
    },
    _setOutputPower(item) {
      if (item.power.some((val) => val < 0 || val > 33)) {
        alert("dB baloreak 0 eta 33 artean egon behar dute.");
        return;
      }

      window.ipc.send("toMain", ["set-output-power", JSON.stringify(item)]);
    },
    _checkAnts(item) {
      window.ipc.send("toMain", ["check-antennas", JSON.stringify(item)]);
    },
    _connect() {
      window.ipc.send("toMain", [
        "set-cookies",
        "readers",
        JSON.stringify(this.tabs),
      ]);
      this.$store.commit("_CONNECTED", this.tabs);

      console.log(this.tabs);
      window.ipc.send("toMain", ["connect", JSON.stringify(this.tabs)]);
    },
    addInput() {
      if (this.tabs.length > 1) {
        alert("Gehienez 2 reader baimentzen dira.");
        return;
      }
      let num = this.tabs.length + 1;
      this.tabs.push({
        name: "Reader " + num,
        ip: "",
        port: "4001",
        ants: [0, 0, 0, 0, 0, 0, 0, 0],
        power: [33, 33, 33, 33, 33, 33, 33, 33],
        active: false,
      });
    },
    removeInput(index) {
      if (confirm("Reader hau ezabatu nahi duzu?")) this.tabs.splice(index, 1);
    },
    _toString(num) {
      return num.toString();
    },
  },
};
</script>

<style lang="scss">
.main {
  padding: 20px;
}

.main-card {
  padding: 20px !important;
}
.ants {
  display: flex;
  &__item {
    margin-right: 15px;
    max-width: 85px;
  }
}
</style>
