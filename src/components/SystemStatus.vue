<template>
  <div class="hello">
    <v-row align="center" no-gutters v-if="!minimal">
      <v-col cols="6"><h2 class="main-title">Sistemaren egoera</h2> </v-col>

      <v-col class="text-right" cols="6">
        <v-icon color="primary" icon="mdi-cogs" size="55"></v-icon>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="10">
        <v-btn
          @click="_getCloud()"
          variant="flat"
          color="primary"
          prepend-icon="mdi-server"
          class="mb-4"
        >
          Sistema sinkronizatu</v-btn
        >

        <p class="mb-4">
          Datu hauek zerbitzarira igo diren fitxategiak dira. Sistema kargatze
          denean, Driveko excela kargatzen da ordenagailuan, hala ere
          beharrezkoa da datuak zerbitzarira bidaltzea. Eskuz neurtzen diren
          splitak egiteko adibidez, zerbitzariko izen-emate zerrenda erabiliko
          dugu, beraz beharrezkoa da lasterketa hasi aurretik fitxategia
          bidaltzea.
        </p>
      </v-col>
      <v-col cols="4">
        <v-list v-if="lastFileUploaded[0]">
          <v-list-item prepend-icon="mdi-list-box">
            <template #title>
              <div v-html="lastFileUploaded[0].name"></div>
            </template>

            <template #subtitle>
              <v-chip
                color="red"
                class="my-2"
                size="small"
                v-if="!lastFileUploaded[0].active"
              >
                Ez da daturik bidali zerbitzarira
              </v-chip>

              <div v-else>{{ _timeAgo(lastFileUploaded[0].time) }}</div>
            </template>
          </v-list-item>

          <v-divider></v-divider>
          <v-list-group
            v-if="lastFileUploaded[1]"
            :value="lastFileUploaded[1].name"
          >
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                prepend-icon="mdi-format-list-numbered"
              >
                <template #title>
                  <div class="d-flex align-center">
                    {{ lastFileUploaded[1].name }}
                    <v-chip
                      class="ms-2"
                      color="success"
                      size="small"
                      v-if="lastFileUploaded[1].active"
                    >
                      {{ lastFileUploaded[1].info.length }} Guztira
                    </v-chip>
                  </div>
                </template>

                <template #subtitle v-if="!lastFileUploaded[1].active">
                  <v-chip color="red" class="my-2" size="small">
                    Ez da daturik bidali zerbitzarira
                  </v-chip>
                </template>
              </v-list-item>
            </template>

            <template v-for="(item, i) in lastFileUploaded[1].info" :key="i">
              <v-list-item :title="item.user">
                <template #subtitle>
                  <div>{{ _timeAgo(item.time) }}</div>
                </template>
              </v-list-item>
            </template>
          </v-list-group>

          <v-divider class="mb-10"></v-divider>
        </v-list>
      </v-col>
    </v-row>

    <v-row>
      <v-col lg="4" md="12" sm="12">
        <v-card variant="outlined">
          <v-list nav>
            <v-list-item> <h3 class="main-title-2">Cloud</h3> </v-list-item>
            <v-list-item v-for="(item, k) in filteredStatus" :key="k">
              <template v-slot:prepend>
                <v-icon
                  v-if="!item"
                  icon="mdi-close-circle"
                  color="error"
                ></v-icon>

                <v-icon
                  v-else
                  icon="mdi-check-circle"
                  color="success"
                  style="opacity: 1"
                ></v-icon>
              </template>

              <v-list-item-title>{{ _statusNames(k) }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col lg="4" md="12" sm="12" v-for="(reader, r) in connected" :key="r">
        <!-- <template v-if="reader.active"> -->

        <v-card variant="outlined" v-if="reader.active">
          <v-list nav density="compact">
            <v-list-item>
              <h3 class="main-title-2">{{ reader.name }}</h3>
              <p>{{ reader.desc }}</p>
            </v-list-item>
            <v-list-item v-for="(ant, i) in reader.ants" :key="i">
              <template v-slot:prepend>
                <v-icon v-if="!ant" icon="mdi-close-circle" color="grey">
                </v-icon>

                <v-icon
                  v-else
                  icon="mdi-check-circle"
                  color="success"
                  style="opacity: 1"
                ></v-icon>
              </template>

              <v-list-item-title
                >Antena {{ i + 1 }} ({{
                  reader.power[i]
                }}
                dBm)</v-list-item-title
              >
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import axios from "axios";
import moment from "moment-timezone";
import "moment/locale/eu"; // Import the desired locale

export default {
  name: "SystemStatusComponent",
  data() {
    return {
      files: [],
      startList: null,
      devices: null,
    };
  },
  async mounted() {
    this._load();
  },
  computed: {
    lastFileUploaded() {
      const data = [];
      if (this.startList) {
        let active = false;
        if (this.startList.info) {
          active = true;
        }

        data.push({
          name: "Izen-emateak",
          time: this.startList.info.time,
          user: this.startList.info.user,
          active: active,
        });
      }

      if (this.devices) {
        let active = false;
        if (this.devices.length) {
          active = true;
        }

        data.push({
          name: "Sailkapenak",
          info: this.devices,
          active: active,
        });
      }

      console.log(data);

      return data;
    },
    filteredStatus() {
      const status = this.$store.state.status || {}; // Ensure status is an object
      // Create a new object excluding the `drive` key based on the condition
      return Object.fromEntries(
        Object.entries(status).filter(([key, value]) => {
          // Exclude the `drive` key if `value` is true and `this.race` is falsy
          return !(key == "drive" && !this.race);
        })
      );
    },
    connected() {
      return this.$store.state.connected;
    },
    race() {
      return this.$store.state.race;
    },
  },

  methods: {
    _getCloud() {
      this.$store.dispatch("_getCloudData");
      this._load();
    },
    async _load() {
      const leer = await axios.get("/v1/get-inscritos", {
        params: {
          post_id: this.race.ID,
        },
      });

      this.startList = leer.data.data;

      const clas = await axios.get("/v1/clasificacion-devices", {
        params: {
          post_id: this.race.ID,
        },
      });

      this.devices = clas.data.data;
    },
    _timeAgo(timestamp) {
      // Set the locale to Spanish
      moment.locale("eu");
      // Return the relative time
      return moment(timestamp).fromNow();
    },
    _statusNames(name) {
      switch (name) {
        case "wp":
          return "WordPress Zerbitzaria";
        case "socket":
          return "WebSocket Zerbitzaria";
        case "mongo":
          return "Mongo Datu-Basea";
        case "drive":
          return "Google Drive API";
      }
    },
  },
};
</script>

<style lang="scss">
.v-stepper.v-sheet {
  box-shadow: none !important;
}
</style>
