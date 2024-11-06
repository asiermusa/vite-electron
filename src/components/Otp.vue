<template>
  <div class="hello">
    <v-row align="center" no-gutters>
      <v-col cols="6"><h2 class="main-title">OTP</h2> </v-col>

      <v-col class="text-right" cols="6">
        <v-icon color="primary" icon="mdi-cloud-key" size="55"></v-icon>
      </v-col>
    </v-row>

    <v-card variant="outlined" class="main-card my-5">
      <!-- <v-card-item :title="event.name"> </v-card-item> -->

      <h3 prepend-icon="mdi-run" class="my-2 mx-3">Lasterketa ekarri</h3>

      <v-card-item
        >Sartu 6 digituko lasterketaren kodea ezaugarri guztiak kargatzeko.

        <v-otp-input length="6" v-model="otp"></v-otp-input>
      </v-card-item>
    </v-card>

    <!-- <v-alert
      text="Datu hauek Google Driveko excel fitxategi batetik ekarri dira eta ezin dira hemen zuzenean editatu."
      type="info"
      icon="mdi-microsoft-excel"
      variant="tonal"
    ></v-alert> -->

    <v-btn
      @click="_set_data()"
      variant="flat"
      class="my-4"
      color="primary"
      prepend-icon="mdi-download"
      >Lasterketa ekarri
    </v-btn>
  </div>
</template>

<script>
export default {
  name: "OtpComponent",
  data() {
    return {
      otp: null,
    };
  },
  mounted() {},
  computed: {
    serial() {
      return this.$store.state.serial;
    },
  },
  methods: {
    async _set_data() {
      // wordpress post bat ekarri OTP bidez
      this.$store.dispatch("_set_race", this.otp);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.v-otp-input {
  justify-content: flex-start;
}
</style>
