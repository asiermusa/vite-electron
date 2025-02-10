<template>
  <v-card-item title="Lasterketa abiarazi/geratu"> </v-card-item>
  <div v-if="events" class="start">
    <div v-for="(event, i) in events" :key="i">
      <v-checkbox
        v-model="selectedOptions"
        :label="event.name"
        :value="event.unique_id"
      >
      </v-checkbox>
    </div>
    <v-btn
      @click="_start()"
      variant="outlined"
      prepend-icon="mdi-timer-play"
      size="small"
      >Hasi</v-btn
    >
    <v-btn
      @click="_start(false)"
      color="red"
      variant="flat"
      prepend-icon="mdi-timer-off"
      size="small"
      class="mx-2"
      >Geratu</v-btn
    >
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "StartRaceComponent",
  data() {
    return {
      selectedOptions: [],
      start: false,
    };
  },
  props: {
    minimal: {
      type: Boolean,
    },
  },
  computed: {
    events() {
      return this.$store.state.events;
    },
    race() {
      return this.$store.state.race;
    },
  },
  methods: {
    _start(start = true) {
      if (!this.selectedOptions.length) return;
      window.ipc.send("toMain", ["get-server-time"]);

      const params = {
        start: start,
        options: this.selectedOptions,
      };

      this.$store.commit("_START_SOCKET", params);
    },
  },
};
</script>

<style lang="scss">
.start {
  padding: 0 15px !important;
  & > div {
    margin: 0;
    padding: 0;
  }
}
</style>
