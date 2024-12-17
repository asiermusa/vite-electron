<template>
  <div class="hello">
    <v-alert
      v-if="message"
      class="my-5"
      color="success"
      icon="$success"
      :text="message"
    ></v-alert>

    <v-tabs v-model="tab">
      <v-tab v-for="(event, i) in eventsSplitsHosts" :key="i">{{
        event.name
      }}</v-tab>
    </v-tabs>

    <v-card-text class="px-0">
      <v-tabs-window v-model="tab">
        <v-tabs-window-item
          v-for="(event, i) in eventsSplitsHosts"
          :key="i"
          class="selected-splits"
        >
          <v-card class="main-card" variant="text">
            <v-card-item :title="event.name">
              <template v-slot:subtitle>
                {{ event.start_date }}
              </template>
            </v-card-item>

            <v-card-text class="py-0">
              <v-row align="center" no-gutters>
                <v-col class="main-title" cols="6"
                  >{{ (event.distance / 1000).toFixed(2) }} km
                </v-col>

                <v-col class="text-right" cols="6">
                  <v-icon color="primary" icon="mdi-run" size="55"></v-icon>
                </v-col>
              </v-row>
            </v-card-text>

            <v-timeline
              align="start"
              side="end"
              direction="horizontal"
              class="ma-3"
            >
              <template v-for="(s, index) in event.splits" :key="index">
                <v-timeline-item dot-color="primary" size="small">
                  <h4>{{ s.name }}</h4>

                  <template v-for="(host, s) in s.hosts" :key="s">
                    <v-chip
                      class="ma-2"
                      color="primary"
                      prepend-icon="mdi-laptop"
                      >{{ host }} </v-chip
                    ><br />
                  </template>
                </v-timeline-item>
              </template>
            </v-timeline>
          </v-card>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>

    <Loader v-if="loader" />

    <v-row class="mb-5">
      <v-col cols="4" v-for="(event, i) in events" :key="i">
        <v-card class="main-card" variant="outlined">
          <v-card-item :title="event.name">
            <template v-slot:subtitle>
              {{ event.start_date }}
            </template>
          </v-card-item>
          <div v-for="(s, index) in event.splits" :key="index">
            <v-checkbox
              :label="`${s.name}`"
              v-model="selectedSplit[s.unique_id]"
            ></v-checkbox>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-btn @click="setSplit()" color="primary" variant="flat"
      >Zehaztu Splitak</v-btn
    >
  </div>
</template>

<script>
import axios from "axios";
import Loader from "./Loader.vue";

export default {
  name: "EventsComponent",
  components: {
    Loader,
  },
  data() {
    return {
      selectedSplit: [],
      message: null,
      tab: null,
      loader: false,
    };
  },
  mounted() {
    if (!this.events.length) return;
    this.selectedSplit = [];

    this.$store.state.selectedSplits.forEach((res) => {
      this.selectedSplit[`${res.group.toLowerCase()}`] = false;
      res.items.forEach((s) => {
        if (s == this.hostname)
          this.selectedSplit[`${res.group.toLowerCase()}`] = true;
      });
    });
  },
  computed: {
    hostname() {
      return this.$store.state.hostname;
    },
    events() {
      return this.$store.state.events;
    },
    selectedSplits() {
      return this.$store.state.selectedSplits;
    },
    eventsSplitsHosts() {
      return this.$store.state.eventsSplitsHosts;
    },
    race() {
      return this.$store.state.race;
    },
  },
  methods: {
    _generateRandomString(length) {
      const characters = "0123456789abcdef"; // Hexadecimal characters
      let result = "";

      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
      }

      return result;
    },
    setSplit() {
      let race = this.race;
      if (!race) return;

      this.loader = true;
      let array = [];

      this.events.forEach((event, i) => {
        event.splits.forEach((s) => {
          let current = s.unique_id;
          if (this.selectedSplit[current]) array.push(current);
        });
      });

      axios
        .post("/v1/set-split", {
          splits: JSON.stringify(array),
          name: this.hostname,
          id: race.ID,
        })
        .then((response) => {
          this.$store.commit("_SET_SELECTED_SPLITS", response.data.data);

          this.selectedSplit = [];
          response.data.data.forEach((res) => {
            this.selectedSplit[`${res.group.toLowerCase()}`] = false;
            res.items.forEach((s) => {
              if (s == this.hostname)
                this.selectedSplit[`${res.group.toLowerCase()}`] = true;
            });
          });

          this.$store.dispatch("_mountEventsSplitsHosts");

          this.loader = false;
        });
    },
  },
};
</script>

<style lang="scss">
.v-input__details {
  display: none !important;
}

.v-timeline-item__body {
  padding-block-start: 10px !important;
  justify-content: flex-start !important;
}

.selected-splits {
  margin-bottom: 50px;
}
</style>
