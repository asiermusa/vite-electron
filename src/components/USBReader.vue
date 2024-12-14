<template>
  <div class="hello">
    <!-- serial port -->

    <v-card class="main-card mb-6" variant="outlined">
      <v-card-text class="py-3">
        <v-row align="center" no-gutters>
          <v-col class="main-title" cols="6">USB Reader</v-col>

          <v-col class="text-right" cols="6">
            <v-icon color="primary" icon="mdi-usb-port" size="55"></v-icon>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-item title="USB konexioak arakatu">
        <v-btn
          @click="_get_serial()"
          variant="outlined"
          color="primary"
          class="my-3"
          prepend-icon="mdi-usb-c-port"
          >Arakatu</v-btn
        >
      </v-card-item>

      <div v-if="serials" class="pa-3">
        <v-select
          label="Serial Port"
          :items="serials"
          v-model="serial"
          variant="outlined"
        ></v-select>
        <v-btn
          @click="_set_serial()"
          color="primary"
          class="my-3"
          variant="flat"
          >USBa zehaztu</v-btn
        >
      </div>
    </v-card>

    <v-card class="mx-auto" max-width="100%" variant="solo">
      <v-card-item>
        <div class="main-title" cols="6">TAG grabatzailea</div>
        <v-card-subtitle>
          Modu automatikoan Tag berriak idatzeko erabili azpiko formularioa.
          Adibidez, TAG hauek honako formatua izango dute:
          123400000000000000000045</v-card-subtitle
        >
      </v-card-item>

      <v-card-text>
        <v-row class="my-5 pa-3">
          <v-text-field
            label="Prefijoa"
            v-model="prefix"
            variant="underlined"
          ></v-text-field>

          <v-text-field
            label="Zenbatzailea zehaztu"
            v-model="counter"
            variant="underlined"
            class="mx-2"
          ></v-text-field>

          <v-btn
            @click="_set_prefix()"
            color="primary"
            variant="flat"
            class="mx-3"
            >BALIOAK ZEHAZTU</v-btn
          >
        </v-row>

        <h3>TAG berriak idatzi</h3>

        <v-row class="mt-5 pa-3">
          <v-text-field
            label="Irakurritako EPC zenbakia"
            variant="underlined"
            disabled
          ></v-text-field>

          <v-btn
            @click="_read_tag()"
            color="primary"
            variant="tonal"
            class="mx-3"
            >Irakurri</v-btn
          >
        </v-row>

        <v-row class="pa-3">
          <v-text-field
            label="Gordeko den EPC zenbakia"
            v-model="writeTag"
            variant="underlined"
          ></v-text-field>

          <v-btn
            @click="_write_tag()"
            color="primary"
            variant="tonal"
            class="mx-3"
            >Idatzi</v-btn
          >
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import moment from "moment-timezone";
export default {
  name: "SettingsUSBComponent",
  data() {
    return {
      serials: null,
      serial: null,
      writeTag: null,
      prefix: null,
      counter: 0,
    };
  },
  mounted() {
    this.serial = this._serial;
    // set reader info

    let that = this;
    window.ipc.handle(
      "fromMain",
      () =>
        function (event, data) {
          if (data[0] == "send-serials") {
            console.log(JSON.parse(data[1]));
            that.serials = JSON.parse(data[1]);
          }

          // usb tag idatzi
          if (data[0] == "serial-usb") {
            console.log(8);
          }
        }
    );
  },
  computed: {
    _serial() {
      return this.$store.state.serial;
    },
    _tags() {
      return this.$store.state.tags;
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
    _set_prefix() {
      const tag = {
        prefix: parseInt(this.prefix),
        counter: parseInt(this.counter),
        currentTag: this._tags.currentTag,
      };
      this.$store.commit("_SET_TAG", tag);
    },
    generateEPC(prefix, counter) {
      const counterString = counter.toString().padStart(12, "0"); // Convierte el contador a un string de 12 dígitos
      const paddedPrefix = prefix.padEnd(12, "0"); // Completa el prefijo con ceros hasta 20 caracteres
      return paddedPrefix + counterString; // Combina el prefijo y el contador
    },
    _read_tag() {
      //window.ipc.send("toMain", ["read-tag", this.serial]);

      this.writeTag = this.generateEPC(this.prefix, this._tags.counter + 1);
    },
    _write_tag() {
      //window.ipc.send("toMain", ["write-tag", this.serial, this.writeTag]);

      this.counter = parseInt(this.counter) + 1;
      this.writeTag = null;
      const tag = {
        prefix: this.prefix,
        counter: this.counter,
        currentTag: this.writeTag,
      };
      this.$store.commit("_SET_TAG", tag);
    },
  },
};
</script>

<style lang="scss">
.main-card {
  padding: 10px !important;
}
</style>
