<template>
  <div class="hello">
    <v-row>
      <v-col class="py-0">
        <v-alert
          v-if="message"
          class="my-5"
          icon="mdi-select-search"
          :title="`${currentReader.name} - ${currentReader.desc}`"
          :text="message"
          color="primary"
          variant="tonal"
          closable
          border="start"
        ></v-alert>
      </v-col>
    </v-row>
    <v-row>
      <v-col v-for="(item, key) in tabs" :key="key" lg="6" md="12">
        <v-card class="main-card mb-6" variant="outlined">
          <v-card-text class="py-3">
            <v-row align="center" no-gutters>
              <v-col class="main-title" cols="6">Reader {{ key + 1 }}</v-col>

              <v-col class="text-right" cols="6">
                <v-icon color="primary" icon="mdi-chip" size="55"></v-icon>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-item title="Konexioaren datuak">
            <template v-slot:subtitle>IP eta Portua</template>
          </v-card-item>

          <v-row class="my-3 px-6">
            <v-text-field
              label="IP"
              variant="outlined"
              v-model="item.ip"
              width="70%"
            ></v-text-field>

            <v-text-field
              label="PORTUA"
              variant="outlined"
              v-model="item.port"
              width="20%"
              class="mx-2"
            ></v-text-field>
          </v-row>

          <v-row class="my-3 px-6">
            <v-text-field
              label="Deskribapena"
              variant="outlined"
              v-model="item.desc"
              width="90%"
            ></v-text-field>
          </v-row>

          <v-card-item title="Antenak">
            <template v-slot:subtitle>Aktibatu eta potentzia</template>
          </v-card-item>

          <!-- ANTENNAS -->
          <div class="ants mx-3">
            <div
              class="ants__row"
              v-for="(group, groupIndex) in chunkArray(item.ants, 4)"
              :key="groupIndex"
            >
              <div
                class="ants__item"
                v-for="(ant, i) in group"
                :key="i"
                cols="1"
              >
                <v-checkbox
                  :label="_toString(groupIndex * 4 + i + 1)"
                  v-model="item.ants[groupIndex * 4 + i]"
                ></v-checkbox>

                <v-text-field
                  label="dBm"
                  variant="outlined"
                  v-model="item.power[groupIndex * 4 + i]"
                ></v-text-field>
              </div>
            </div>
          </div>
          <!-- ANTENNAS -->

          <div class="ma-3 my-6">
            <v-btn
              @click="_setOutputPower(item)"
              color="primary"
              variant="tonal"
              size="small"
            >
              Aldatu pot.
            </v-btn>

            <v-btn
              @click="_getOutputPower(item)"
              color="primary"
              class="mx-2"
              variant="tonal"
              size="small"
            >
              Ikusi pot.
            </v-btn>

            <v-btn
              @click="_checkAnts(item)"
              color="success"
              variant="tonal"
              size="small"
            >
              Frogatu antenak
            </v-btn>
          </div>

          <v-divider></v-divider>

          <v-card-actions class="px-3">
            <v-btn
              variant="text"
              color="red"
              size="small"
              @click="removeInput(key)"
              prepend-icon="mdi-delete"
              >Reader hau kendu</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>

  <v-btn
    variant="text"
    color="black"
    @click="addInput"
    class="mx-3"
    prepend-icon="mdi-plus"
    >Reader berria gehitu</v-btn
  >

  <v-btn
    @click="_connect()"
    variant="flat"
    color="primary"
    prepend-icon="mdi-chip"
    >Konektatu</v-btn
  >
</template>

<script>
import moment from "moment-timezone";
export default {
  name: "SettingsComponent",
  data() {
    return {
      tabs: null,
      message: null,
      currentReader: null,
    };
  },
  mounted() {
    // set reader info
    this.tabs = this.connected;
    let that = this;

    window.ipc.handle(
      "fromMain",
      () =>
        function (event, data) {
          if (data[0] == "checking") {
            let read = data[1][6];
            that.message = "Irakurritako tag kopurua: " + read;
          }
        }
    );
  },
  computed: {
    connected() {
      return this.$store.state.connected;
    },
  },
  methods: {
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
      this.currentReader = item;
      window.ipc.send("toMain", ["check-antennas", JSON.stringify(item)]);
    },
    chunkArray(array, size) {
      const chunks = [];
      for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
      }
      return chunks;
    },
    _connect() {
      window.ipc.send("toMain", [
        "remove-cookies",
        "readers",
        JSON.stringify(this.connected),
      ]);

      window.ipc.send("toMain", ["disconnect"]);

      setTimeout(() => {
        window.ipc.send("toMain", [
          "set-cookies",
          "readers",
          JSON.stringify(this.tabs),
        ]);
        this.$store.commit("_CONNECTED", this.tabs);
        window.ipc.send("toMain", ["connect", JSON.stringify(this.tabs)]);
      }, 1000);
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
        desc: "",
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
.main-card {
  padding: 10px !important;
}
.ants {
  &__item {
    margin-right: 15px;
    max-width: 85px;
  }
}

.ants__row {
  display: flex;
}
.ants__item {
  flex: 1;
}
</style>
