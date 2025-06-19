<template>
  <div class="hello">
    <v-row>
      <!-- serial port -->
      <v-col cols="12">
        <v-card class="main-card mb-6" variant="outlined">
          <v-card-text class="py-3">
            <v-row align="center" no-gutters>
              <v-col class="main-title" cols="6">GPS</v-col>

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
              rounded
              >Arakatu</v-btn
            >
          </v-card-item>
        </v-card>

        <div v-if="serials" class="pa-3">
          <v-select
            label="Serial Port"
            :items="serials"
            v-model="gps"
            variant="outlined"
          ></v-select>
          <v-btn
            @click="_set_serial()"
            color="primary"
            class="my-3"
            variant="flat"
            rounded
            >USBa zehaztu</v-btn
          >
        </div>

        <v-card class="mx-auto mt-8" max-width="100%" variant="solo">
          <v-card-item>
            <div class="main-title" cols="6">Oharrak</div>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import Loader from "./Loader.vue";
export default {
  name: "SettingsUSBComponent",
  components: {
    Loader,
  },
  data() {
    return {
      serials: null,
      gps: null
    };
  },
  mounted() {
    this.items = this._items;
    this.gps = this._gps;

    let that = this;
    window.ipc.handle(
      "fromMain",
      () =>
        function (event, data) {
          if (data[0] == "send-serials") {
            that.serials = JSON.parse(data[1]);
          }
        }
    );
  },
  computed: {
    _gps() {
      return this.$store.state.gps;
    }
  },
  methods: {
    _get_serial() {
      window.ipc.send("toMain", ["get-serial"]);
    },
    _set_serial() {
      window.ipc.send("toMain", ["set-cookies", "gps", this.gps]);
      this.$store.commit("_SET_GPS_PORT", this.gps);
    }
  },
};
</script>

<style lang="scss">

</style>
