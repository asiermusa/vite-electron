<template>
  <div class="hello">
    <v-row align="center" no-gutters>
      <v-col cols="6"><h2 class="main-title">Sailkapenak sortu</h2> </v-col>

      <v-col class="text-right" cols="6">
        <v-icon
          color="primary"
          icon="mdi-format-list-numbered"
          size="55"
        ></v-icon>
      </v-col>
    </v-row>

    <v-alert
      v-if="error"
      :text="error"
      type="error"
      variant="tonal"
      class="my-2"
    ></v-alert>

    <v-alert
      v-if="success"
      :text="success"
      type="success"
      variant="tonal"
      class="my-2"
    ></v-alert>

    <Loader v-if="loader" class="my-2" />

    <v-btn
      @click="getClasificacionDevices()"
      color="primary"
      variant="flat"
      class="my-3"
      >Sailkapenak sortzeko gailuak</v-btn
    >

    <div v-if="devices" class="my-12">
      <v-card class="main-card" variant="outlined">
        <v-card-item title="Zehaztu sailkapenak">
          <template v-slot:subtitle>
            Zehaztu zein gailuren datuak erabiliko dituzun sailkapenak sortzeko.
          </template>

          <v-chip-group v-model="selectedChips" multiple class="my-4">
            <v-chip
              v-for="device in devices"
              :key="device.id_post"
              :value="device.filename"
              class="ma-2"
              color="success"
              outlined
            >
              {{ device.user }}
            </v-chip>
          </v-chip-group>

          <v-select
            placeholder="Lasterketa"
            variant="outlined"
            v-model="event"
            class="my-3"
            :items="eventsSplitsHosts"
            item-title="name"
            item-value="unique_id"
            density="compact"
          ></v-select>

          <div v-if="event" class="my-3">
            <h4>Select Chips</h4>

            <!-- Chip Group for Selection -->
            <v-chip-group v-model="selectedRows" multiple column>
              <v-chip
                v-for="(chip, index) in _computedRows"
                :key="index"
                :value="chip"
                color="primary"
                class="ma-2"
              >
                {{ Object.values(chip)[0] }}
              </v-chip>
            </v-chip-group>

            <h4>Selected Chips</h4>
            <v-row>
              <v-chip
                v-for="(chip, index) in selectedRows"
                :key="'selected-' + index"
                color="pink"
                class="ma-2"
                closable
                @click:close="removeChip(chip)"
              >
                {{ Object.values(chip)[0] }}
              </v-chip>
            </v-row>
          </div>

          <v-btn @click="sendData" variant="tonal" color="primary"
            >Sailkapena sortu</v-btn
          >
        </v-card-item>
      </v-card>
    </div>
  </div>
</template>

<script>
import Loader from "./Loader.vue";
import axios from "axios";
export default {
  name: "ResultsComponent",
  components: {
    Loader,
  },
  data() {
    return {
      selectedChips: [],
      devices: false,
      error: false,
      success: false,
      loader: false,
      event: null,
      selectedSplits: null,
      selectedRows: [],
    };
  },
  mounted() {},
  computed: {
    race() {
      return this.$store.state.race;
    },
    eventsSplitsHosts() {
      return this.$store.state.eventsSplitsHosts;
    },
    _computedRows() {
      if (!this.selectedSplits) return;

      let rows = [
        { dorsal: "Dorsala" },
        { name: "Izen-abizenak" },
        { sex: "Sexua" },
        { city: "Herria" },
        { cat: "Kategoria" },
      ];
      this.selectedSplits.splits.forEach((res, index) => {
        rows.push({
          ["split_" + res.unique_id]: res.name,
        });
      });
      return rows;
    },
  },
  watch: {
    event(val) {
      let sel = this.eventsSplitsHosts.filter((res) => {
        if (res.unique_id == val) return res;
      });

      this.selectedSplits = sel[0];
    },
  },
  methods: {
    async getClasificacionDevices() {
      this.loader = true;
      try {
        const response = await axios.get("/v1/clasificacion-devices", {
          params: {
            post_id: this.race.ID,
          },
        });

        if (response.data.success) {
          this.devices = response.data.data;
        } else {
          this.error = response.data.data.message;
        }
        this.loader = false;
      } catch (err) {
        this.error =
          "Errorea: Arazo bat gertatu da zerbitzarian datuak jasotzerakoan.";
        this.loader = false;
      }
    },
    async sendData() {
      if (this.selectedChips.length > 0) {
        const newRows = this.selectedRows.map((item) => Object.keys(item)[0]);

        try {
          const response = await axios.get("/v1/process-results", {
            params: {
              post_id: this.race.ID,
              devices: JSON.stringify(this.selectedChips),
              event: this.event,
              rows: JSON.stringify(newRows),
            },
          });

          console.log(response.data.data.data.data);

          if (response.data.success) {
            this.success = "Sailkapena ondo sortu da.";
            // window.ipc.send("toMain", [
            //   "excel",
            //   JSON.stringify(response.data.data),
            // ]);
          } else {
            this.error = response.data.data.message;
          }
          this.loader = false;
        } catch (err) {
          this.error = err;
          this.loader = false;
        }
      } else {
        console.log("No chips selected");
      }
    },
    removeChip(chip) {
      this.selectedRows = this.selectedRows.filter((item) => item !== chip);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
