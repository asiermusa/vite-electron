<template>
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
      color="error"
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
  mounted() {
    let that = this;
    window.ipc.handle(
      "fromMain",
      () =>
        async function (event, data) {
          // on start
          if (data[0] == "server-time") {
            const time = data[1];

            const start = that.start ? time.timestamp : null;
            const pretty = time.pretty;

            const params = {
              events: that.selectedOptions,
              start: start,
              start_pretty: pretty,
            };

            await axios.get("https://denborak.online/api/v2", {
              params: {
                post_id: that.race.ID,
                events: that.selectedOptions,
                start_date: start,
              },
            });

            let wp = await axios.post("/v1/start-race", {
              post_id: that.race.ID,
              starts: JSON.stringify(params),
            });
          }
        }
    );
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
      this.start = start;
    },
  },
};
</script>

<style lang="scss">
.start {
  padding: 15px !important;
  & > div {
    margin: 0;
    padding: 0;
  }
}
</style>
