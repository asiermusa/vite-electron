<template>
  <div class="hello">
    <v-alert
      v-if="message"
      class="my-5"
      color="success"
      icon="$success"
      :text="message"
    ></v-alert>

    <pre>{{ _selectedSplits }}</pre>

    <!-- <template v-for="(event, i) in events" :key="i">
      <h4>{{ event.name }} - {{ event.start_date }}</h4>
      <v-timeline align="start" side="end" direction="horizontal">
        <template v-for="(s, index) in event.splits" :key="index">
          <v-timeline-item dot-color="primary" size="small">
            {{ s.name }}

            <template v-for="(sel, s) in selectedSplits" :key="s">


              <v-chip class="ma-2" color="primary" prepend-icon="mdi-wifi-alert"
                >aaa
              </v-chip>
            </template>
          </v-timeline-item>
        </template>
      </v-timeline>
    </template> -->

    <template v-for="(event, i) in events" :key="i">
      <h4>{{ event.name }} - {{ event.start_date }}</h4>
      <div v-for="(s, index) in event.splits" :key="index">
        <v-checkbox
          :label="`${s.name}`"
          v-model="selectedSplit[`${i}_${s.name.toLowerCase()}`]"
        ></v-checkbox>
        <!-- selectedSplit[`${i}_${s.name.toLowerCase()}`]-->
      </div>
    </template>

    <v-btn @click="setSplit()">Zehaztu Splitak</v-btn>

    <v-btn @click="_get_data()" color="primary"
      >Obtener datos del servidor
    </v-btn>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "EventsComponent",
  data() {
    return {
      selectedSplit: [],
      message: null,
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
    _selectedSplits() {
      let final = [];
      this.events.forEach((e, index) => {
        final.push({
          name: e.name,
          splits: [],
        });

        e.splits.forEach((s, splitIndex) => {
          final[index].splits.push({
            name: s.name,
            hosts: [],
          });

          this.selectedSplits.forEach((sel) => {
            if (sel.group == s.slug) {
              sel.items.forEach((i) => {
                final[index].splits[splitIndex].hosts.push(i);
              });
            }
          });
        });
      });

      console.log("final array", final);
    },
    hostname() {
      return this.$store.state.hostname;
    },
    events() {
      return this.$store.state.events;
    },
    selectedSplits() {
      return this.$store.state.selectedSplits;
    },
  },
  methods: {
    async _get_data() {
      // obtener todos los eventos de la carrera (generales)
      await this.$store.dispatch("_get_events");

      // hasierako atleta guztien excela montatu
      await this.$store.dispatch("_get_participants");

      // Obtener los cronos iniciales de la/s carrera/s
      await this.$store.dispatch("_get_cronos");

      // Ordenagailu honentzako splitak ekarri
      await this.$store.dispatch("_get_current_pc_splits");
    },
    setSplit() {
      // let that = this;
      //console.log(JSON.stringify(this.selectedSplit));
      let array = [];

      this.events.forEach((event, i) => {
        event.splits.forEach((s) => {
          let current = `${i}_${s.name.toLowerCase()}`;
          if (this.selectedSplit[current]) array.push(current);
        });
      });

      axios
        .post("/v1/set-split", {
          splits: JSON.stringify(array),
          name: this.hostname,
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
        });
    },
  },
};
</script>

<style lang="scss">
.v-input__details {
  display: none;
}

.v-timeline-item__body {
  padding-block-start: 10px !important;
}
</style>
