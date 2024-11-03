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
          >Establecer Puerto</v-btn
        >
      </div>
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
        }
    );
  },
  computed: {
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
  },
};
</script>

<style lang="scss">
.main-card {
  padding: 10px !important;
}
</style>
