<template>
  <div
    class="hello"
    style="height: 100vh; display: flex; flex-direction: column"
  >
    <div>
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

      <v-btn
        @click="_get_data()"
        variant="flat"
        class="mr-2 mt-2"
        color="primary"
        prepend-icon="mdi-download"
      >
        Eguneratu
      </v-btn>

      <v-btn
        @click="this.$router.push('/usb-reader')"
        variant="outlined"
        color="primary"
        prepend-icon="mdi-account-tag"
        class="mx-2 mt-2"
      >
        Tag grabatzailea
      </v-btn>

      <v-row class="my-1" dense>
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
        <v-col cols="2">
          <v-text-field
            placeholder="Izen-abizenak"
            variant="outlined"
            v-model="searchName"
            class="my-3"
            density="compact"
          ></v-text-field>
        </v-col>

        <v-col cols="1">
          <v-select
            placeholder="Sexua"
            variant="outlined"
            v-model="searchSex"
            label="Sexua"
            class="my-3"
            :items="['Denak', 'Ema', 'Giz']"
            density="compact"
          ></v-select>
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
          <v-select
            v-model="selectedRace"
            :items="availableRaces"
            label="Lasterketa"
            variant="outlined"
            density="compact"
            class="my-3"
          ></v-select>
        </v-col>

        <v-col cols="2">
          <v-select
            v-model="selectedCat"
            :items="availableCats"
            label="Kategoria"
            variant="outlined"
            class="my-3"
            density="compact"
          ></v-select>
        </v-col>

        <v-col cols="1">
          <v-checkbox
            :value="tags"
            label="Tags"
            @click="tags = !tags"
            class="mt-1"
          ></v-checkbox>
        </v-col>
        <v-col cols="12" v-if="sortItems">
          <v-chip>
            Guztira: <strong class="mx-1">{{ sortItems.length }}</strong>
          </v-chip>
        </v-col>
      </v-row>
    </div>

    <div
      ref="scrollContainer"
      style="overflow-y: auto"
      @scroll="loadMoreOnScroll"
    >
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
            v-for="(item, i) in visibleItems"
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
                <v-icon icon="mdi-check-circle" color="success"></v-icon>
                <v-tooltip activator="parent" location="right"
                  >Tag: {{ _normalize(item.tag) }}</v-tooltip
                >
              </div>
            </td>
            <td @click="_select(i)">{{ item.bib }}</td>
            <td>{{ item.name }}</td>
            <td>{{ _filterColumn(item.event, i) }}</td>
            <td>{{ getSexLabel(item.sex) }}</td>
            <td>{{ item.city }}</td>
            <td>{{ item.cat }}</td>
            <td>{{ item.club }}</td>
          </tr>
        </tbody>
      </v-table>
      <div v-if="scrollLoading" class="text-center py-3">
        <v-progress-circular indeterminate color="primary" />
      </div>
    </div>
  </div>
</template>

<script>
import Loader from "./Loader.vue";
import axios from "axios";
import { getSexLabel } from "../vue-plugins/vue-helpers.js";

export default {
  name: "RunnersComponent",
  components: { Loader },
  data() {
    return {
      search: "",
      searchTag: "",
      searchName: "",
      searchCity: "",
      searchRace: "",
      searchSex: "Denak",
      tags: false,
      loader: false,
      googleSuccess: false,
      googleError: false,
      inscritos: false,
      visibleItems: [],
      loadBatch: 50,
      scrollIndex: 1,
      scrollLoading: false,
      selectedCat: "Denak",
      availableCats: [],
      selectedRace: "Denak",
      availableRaces: [],
    };
  },
  computed: {
    sortItems() {
      let items = this.$store.state.startList || [];
      let filtered = [...items];

      if (this.tags) {
        filtered = filtered.filter((item) => !item.tag);
      }

      if (this.search) {
        filtered = filtered.filter((item) =>
          item.bib?.toLowerCase().includes(this.search.toLowerCase())
        );
      }
      // filtros adicionales...
      if (this.searchTag) {
        filtered = filtered.filter((item) =>
          item.bib?.toLowerCase().includes(this.searchTag.toLowerCase())
        );
      }

      if (this.searchName) {
        filtered = filtered.filter((item) =>
          item.name?.toLowerCase().includes(this.searchName.toLowerCase())
        );
      }

      if (this.selectedCat && this.selectedCat !== "Denak") {
        filtered = filtered.filter((item) => item.cat === this.selectedCat);
      }

      if (this.searchCity) {
        filtered = filtered.filter((item) =>
          item.city?.toLowerCase().includes(this.searchCity.toLowerCase())
        );
      }

      if (this.selectedRace && this.selectedRace !== "Denak") {
        filtered = filtered.filter(
          (item) => item.event?.name === this.selectedRace
        );
      }

      if (this.searchSex && this.searchSex !== "Denak") {
        filtered = filtered.filter(
          (item) => this._isWoman(item.sex) === (this.searchSex === "Ema")
        );
      }

      return filtered;
    },
  },
  watch: {
    sortItems() {
      this.scrollIndex = 1;
      this.visibleItems = this.sortItems.slice(0, this.loadBatch);
    },
  },
  mounted() {
    this.loader = true;
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.scrollIndex = 1;
        this.visibleItems = this.sortItems.slice(0, this.loadBatch);

        // cats
        const allCats = this.$store.state.startList
          .map((i) => i.cat)
          .filter(Boolean);
        this.availableCats = ["Denak", ...new Set(allCats)];

        // events
        const allRaces = this.$store.state.startList
          .map((i) => i.event?.name)
          .filter(Boolean);
        this.availableRaces = ["Denak", ...new Set(allRaces)];

        this._getInscritos();
      }, 100);
    });

    window.ipc.handle("fromMain", () => (event, data) => {
      if (data[0] === "upload-response") {
        this.loader = false;
        this.googleSuccess = null;
        this.googleError = null;
        const response = data[1];
        if (response) {
          this.googleSuccess =
            "Fitxategia ondo eskuratu da eta gainontzeko gailuetara bidali da zerrenda.";
        } else {
          this.googleError =
            "Fitxategia igotzerakoan errore bat gertatu da edo hutsik zegoen...";
        }
      }
    });
  },
  methods: {
    getSexLabel,
    loadMoreOnScroll() {
      const container = this.$refs.scrollContainer;
      if (!container || this.scrollLoading) return;

      // ✅ NO cargar más si ya estamos mostrando todos
      if (this.visibleItems.length >= this.sortItems.length) return;

      const threshold = 100;
      if (
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - threshold
      ) {
        this.scrollLoading = true;
        setTimeout(() => {
          const nextIndex = this.scrollIndex + 1;
          this.visibleItems = this.sortItems.slice(
            0,
            nextIndex * this.loadBatch
          );
          this.scrollIndex = nextIndex;
          this.scrollLoading = false;
        }, 300);
      }
    },
    async _getInscritos() {
      this.loader = true;
      try {
        const response = await axios.get("/v1/get-inscritos", {
          params: { post_id: this.$store.state.race.ID },
        });
        if (!response.data.data.data) {
          this.inscritos =
            "Gogoratu! Oraindik ez duzu parte-hartzaile zerrenda zerbitzarira bidali.";
        }
      } catch (err) {
        this.inscritos = "Errorea: " + err;
      } finally {
        this.loader = false;
      }
    },
    async _get_data() {
      this.loader = true;
      this.googleError = false;
      this.googleSuccess = false;
      const response = await this.$store.dispatch("_get_participants");
      if (response.data.success) {
        this._saveData();
      } else {
        this.googleError = "Errorea: " + response.data.data.message;
      }
      this.loader = false;
    },
    _saveData() {
      this.inscritos = false;
      this.loader = true;
      window.ipc.send("toMain", [
        "upload-inscritos",
        this.$store.state.race.ID,
      ]);
    },
    _select(i) {
      this.selected = this.visibleItems[i];
    },
    _filterColumn(col) {
      return col?.name || "-";
    },
    _normalize(str) {
      return str ? str.replace(/^0+(?=\d)/, "") : null;
    },
    _isWoman(s) {
      if (!s) return false;
      const normalized = s.toLowerCase().trim();
      return [
        "e",
        "f",
        "emakumea",
        "femenina",
        "feminas",
        "fem",
        "woman",
        "chicas",
      ].includes(normalized);
    },
  },
};
</script>

<style scoped>
.deactive {
  background: rgba(202, 79, 79, 0.15);
}
.isWoman {
  background: rgba(233, 206, 247, 0.2) !important;
}

table {
  th:nth-child(3) {
    width: 30%;
  }

  th:nth-child(1),
  th:nth-child(2) {
    width: 30px !important;
  }
}
</style>
