<template>
  <div class="hello">
    <v-row no-gutters>
      <v-col>
        <!-- <v-row align="center" no-gutters>
          <v-col cols="6"><h2 class="main-title">Parte-hartzaileak</h2> </v-col>

          <v-col class="text-right" cols="6">
            <v-icon color="primary" icon="mdi-account-group" size="55"></v-icon>
          </v-col>
        </v-row> -->

        <Loader v-if="loader" class="mb-2" />

        <v-alert
          v-if="googleSuccess"
          class="my-5"
          color="success"
          variant="tonal"
          closable
          border="start"
        >
          {{ googleSuccess }}
        </v-alert>

        <v-alert
          v-if="googleError"
          class="my-5"
          color="red"
          variant="tonal"
          closable
          border="start"
          icon="mdi-alert-circle-outline"
        >
          {{ googleError }}
        </v-alert>

        <v-alert
          v-if="inscritos"
          class="my-2"
          color="red"
          variant="tonal"
          closable
          icon="mdi-alert-circle-outline"
        >
          {{ inscritos }}
        </v-alert>

        <!-- <v-alert
          text="Datu hauek Google Driveko excel fitxategi batetik ekarri dira eta ezin dira hemen zuzenean editatu."
          type="info"
          icon="mdi-microsoft-excel"
          variant="tonal"
        ></v-alert> -->

        <!-- <v-btn
          @click="_saveData()"
          variant="tonal"
          color="orange"
          prepend-icon="mdi-upload"
          class="mx-2 mt-4"
        >
          Zerbitzarian gorde</v-btn
        > -->

        <v-btn
          @click="this.$router.push('/usb-reader')"
          variant="outlined"
          color="primary"
          prepend-icon="mdi-account-tag"
          class="mx-2 mt-4"
        >
          Tag grabatzailea</v-btn
        >

        <v-row class="my-1">
          <v-col cols="2">
            <v-btn
              @click="_get_data()"
              variant="flat"
              class="my-4"
              color="primary"
              prepend-icon="mdi-download"
              block
              >Eguneratu
            </v-btn>
          </v-col>

          <v-col cols="1">
            <v-text-field
              placeholder="Tag"
              variant="outlined"
              v-model="searchTag"
              class="my-3"
              density="compact"
            ></v-text-field>
          </v-col>

          <v-col cols="1">
            <v-text-field
              placeholder="Dortsala"
              variant="outlined"
              v-model="search"
              class="my-3"
              density="compact"
            ></v-text-field>
          </v-col>

          <v-col cols="3">
            <v-text-field
              placeholder="Izen-abizenak"
              variant="outlined"
              v-model="searchName"
              class="my-3"
              density="compact"
            ></v-text-field>
          </v-col>

          <v-col cols="2">
            <v-text-field
              placeholder="Herria"
              variant="outlined"
              v-model="searchCity"
              class="my-3"
              density="compact"
            ></v-text-field>
          </v-col>
          <v-col cols="2">
            <v-text-field
              placeholder="Lasterketa"
              variant="outlined"
              v-model="searchRace"
              class="my-3"
              density="compact"
            ></v-text-field>
          </v-col>

          <v-col cols="1">
            <v-checkbox
              :value="tags"
              label="Tags"
              @click="tags = !tags"
              class="mt-1"
            ></v-checkbox>
          </v-col>
        </v-row>

        <v-table class="custom-table rankig" density="compact">
          <tbody>
            <tr>
              <th class="text-left" style="width: 50px">Tag</th>
              <th class="text-left" style="width: 50px">Dorsala</th>
              <th class="text-left">Izena</th>
              <th class="text-left">Lasterketa</th>
              <th class="text-left">Sexua</th>
              <th class="text-left">Herria</th>
              <th class="text-left">Kategoria</th>
              <th class="text-left">Kluba</th>
            </tr>
            <tr
              v-for="(item, i) in sortItems"
              :key="i"
              :class="{
                isWoman: _isWoman(item.sex),
                deactive: !_filterColumn(item.event),
              }"
            >
              <td>
                <v-icon
                  v-if="!item.tag"
                  icon="mdi-close-circle"
                  color="grey"
                  style="opacity: 0.6"
                ></v-icon>

                <div v-else>
                  <v-icon
                    icon="mdi-check-circle"
                    color="success"
                    style="opacity: 1"
                  >
                  </v-icon>
                  <v-tooltip activator="parent" location="right"
                    >Tag: {{ this._normalize(item.tag) }}</v-tooltip
                  >
                </div>
              </td>
              <td @click="_select(i)">{{ item.bib }}</td>
              <td>{{ item.name }}</td>
              <td>{{ _filterColumn(item.event, i) }}</td>
              <td>{{ item.sex }}</td>
              <td>{{ item.city }}</td>
              <td>{{ item.cat }}</td>
              <td>{{ item.club }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import Loader from "./Loader.vue";
import axios from "axios";
export default {
  name: "RunnersComponent",
  components: {
    Loader,
  },
  data() {
    return {
      search: null,
      searchTag: null,
      searchCity: null,
      searchName: null,
      searchRace: null,
      header: null,
      selected: null,
      loader: false,
      googleSuccess: false,
      googleError: false,
      tags: false,
      inscritos: false,
    };
  },
  mounted() {
    let items = this.$store.state.startList;
    this.header = items[0];

    let that = this;
    this._getInscritos();
    window.ipc.handle(
      "fromMain",
      () =>
        function (event, data) {
          if (data[0] == "upload-response") {
            that.loader = false;
            that.googleSuccess = null;
            that.googleError = null;
            const response = data[1];

            if (response) {
              that.googleSuccess =
                "Fitxategia ondo eskuratu da eta gainontzeko gailuetara bidali da zerrenda.";
              that.color = "success";
            } else {
              that.googleError =
                "Fitxategia igotzerakoan errore bat gertatu da edo hutsik zegoen...";
            }
          }
        }
    );
  },
  computed: {
    sortItems() {
      let items = this.startList;

      if (!items.length) return;
      // if (!this.search) return items;
      // if (!this.searchHerria) return items;

      let response = items;

      if (this.tags) {
        response = response.filter((item) => {
          if (!item.tag) return item;
        });
      }

      // Apply search filter if "search" is defined
      if (this.search) {
        response = response.filter((item) => {
          return item.bib.toLowerCase().includes(this.search.toLowerCase());
        });
      }

      if (this.searchTag) {
        console.log(this.searchTag);
        response = response.filter((item) => {
          if (!item.tag) return;
          return item.tag.toLowerCase().includes(this.searchTag.toLowerCase());
        });
      }

      // Apply searchHerria filter if "searchHerria" is defined
      if (this.searchName) {
        response = response.filter((item) => {
          return item.name
            .toLowerCase()
            .includes(this.searchName.toLowerCase());
        });
      }

      // Apply searchHerria filter if "searchHerria" is defined
      if (this.searchCity) {
        response = response.filter((item) => {
          return item.city
            .toLowerCase()
            .includes(this.searchCity.toLowerCase());
        });
      }

      // Apply search filter if "search" is defined
      if (this.searchRace) {
        response = response.filter((item) => {
          return item.event.name
            ?.toLowerCase()
            .includes(this.searchRace.toLowerCase());
        });
      }

      return response;
    },
    serial() {
      return this.$store.state.serial;
    },
    startList() {
      return this.$store.state.startList;
    },
    race() {
      return this.$store.state.race;
    },
    _globalError() {
      return this.$store.state._globalError;
    },
  },
  watch: {
    sortItems() {
      this.loader = false;
    },
    _globalError(val) {
      if (val) {
        this.googleError = val.message;
      }
    },
  },
  methods: {
    async _getInscritos() {
      this.loader = true;
      try {
        const response = await axios.get("/v1/get-inscritos", {
          params: {
            post_id: this.race.ID,
          },
        });

        if (!response.data.data.data) {
          this.inscritos =
            "Gogoratu! Oraindik ez duzu parte-hartzaile zerrenda zerbitzarira bidali.";
        }
        this.loader = false;
      } catch (err) {
        this.inscritos = "Errorea: " + err;
        this.loader = false;
      }
    },
    _toSlug(s) {
      return s
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Remove special characters
        .replace(/[\s_-]+/g, "-"); // Replace spaces and underscores with hyphens
    },
    _normalize(str) {
      if (!str) return null;
      return str.replace(/^0+(?=\d)/, "");
    },
    _isWoman(s) {
      if (!s) return false;
      const normalized = this._toSlug(s);
      // Valid words normalized
      const validWords = [
        "e",
        "f",
        "emakumea",
        "femenina",
        "feminas",
        "fem",
        "woman",
        "chicas",
        "fem",
      ].map(this._toSlug);
      return validWords.includes(normalized);
    },
    _select(val) {
      this.selected = this.$store.state.startList[val];
    },
    _saveData() {
      this.inscritos = false;
      this.loader = true;
      this.message = false;
      window.ipc.send("toMain", ["upload-inscritos", this.race.ID]);
    },
    _filterColumn(col, i) {
      if (!col) return;
      if (col.name) return col.name;
      else return false;
    },
    async _get_data() {
      this.loader = true;
      this.googleError = false;
      this.googleSuccess = false;

      // hasierako atleta guztien excela montatu
      let response = await this.$store.dispatch("_get_participants");

      if (response.data.success) {
        this._saveData();
      } else {
        this.googleError = "Errorea: " + response.data.data.message;
      }
      this.loader = false;
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.deactive {
  background: rgba(202, 79, 79, 0.15) !important;
}
.isWoman {
  background: rgb(116, 32, 91, 0.2) !important;
}
.v-row {
  margin: 0;
}
.v-col {
  padding: 5px;
}
</style>
