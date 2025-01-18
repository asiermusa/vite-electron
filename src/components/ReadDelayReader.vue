<template>
  <div>
    <!-- serial port -->

    <div class="my-4">
      <v-card-item title="Irakurketaren interbaloa">
        <template v-slot:subtitle
          >Zehaztu irakurketa bakoitzaren denbora azerapen minimoa
          segundotan.</template
        >

        <v-text-field
          label="Irakurketa atzerapena"
          variant="outlined"
          v-model="readDelay"
          class="my-3"
        ></v-text-field>

        <v-checkbox
          v-model="sound"
          label="Soinu aktibatu irakurketa bat jasotzerakoan"
        />

        <v-btn
          @click="_set_read_delay()"
          variant="flat"
          color="primary"
          size="small"
          >Aldaketak gorde
        </v-btn>
      </v-card-item>
    </div>
  </div>
</template>

<script>
export default {
  name: "SettingsReadDelayComponent",
  data() {
    return {
      readDelay: null,
      sound: false,
    };
  },
  mounted() {
    this.readDelay = this.$store.state.readDelay;
    this.sound = this.$store.state.sound;
  },
  methods: {
    _set_read_delay() {
      this.$store.commit("_SET_READ_DELAY", this.readDelay);
      this.$store.commit("_SET_SOUND", this.sound);
    },
  },
};
</script>

<style lang="scss">
.main-card {
  padding: 10px !important;
}
</style>
