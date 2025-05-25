<template>
  <div class="hello" v-if="race">
    <v-navigation-drawer location="right" permanent width="300">
      <StartRace />
      <ReadDelayReader />
      <PercentsComponent :minimal="true"></PercentsComponent>
    </v-navigation-drawer>

    <Loader v-if="loader" class="my-3"></Loader>

    <v-alert v-if="message" class="mb-3" :color="color" variant="tonal" closable>
      {{ message }}
    </v-alert>

  <!-- Botón flotante abajo a la derecha -->
      <v-btn
        color="primary"
        class="position-fixed"
        style="z-index: 999; bottom: 15px; right: 320px;"
        @click="_openAddDialog"
        variant="flat"
        rounded

      >
        <v-icon>mdi-plus</v-icon>
        Irakurketa berria
      </v-btn>



      <v-btn
        v-if="_inventoryStatus"
        @click="demoTagDialog = !demoTagDialog"
        color="primary"
        class="position-fixed"
        style="z-index: 999; bottom: 65px; right: 320px;"
        variant="outlined"
        rounded
      >
      <v-icon>mdi-lan-check</v-icon>
        Demo Test</v-btn
      >


    <v-dialog v-model="editDialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ editMode === 'add' ? 'Irakurketa berria gehitu' : 'Irakurketa editatu' }}
        </v-card-title>

        <v-card-text>
          
        <v-chip
            color="primary"
            variant="flat"
            v-if="editMode === 'edit'" class="mb-5">Dortsala: <strong>{{ editedItem.bib }}</strong></v-chip>

        <v-alert
          v-if="editMode === 'add'"
          type="info"
          variant="tonal"
          class="mb-3"
        >
          Hautatu parte-hartzailea eta gehitu eskuzko irakurketa berria.
        </v-alert>

        <v-autocomplete
          v-if="editMode === 'add'"
          :items="$store.state.startList"
          item-title="bib"
          item-value="tag"
          v-model="selectedRunner"
          label="Parte-hartzailea"
          return-object
          variant="outlined"
          density="compact"
          class="mb-5"
        />

        
          <v-select
            v-model="changeSplitSelected"
            :items="availableSplits.slice(1)"
            label="Aukeratu splita"
            variant="outlined"
            density="compact"
            class="mb-5"
          />


          <v-text-field
            v-model="editedTime"
            variant="outlined"
            density="compact"
            label="Denbora berria (HH:mm:ss:SSS)"
            class="mb-5"
          />

         <div class="d-flex align-center">
  <v-checkbox
    v-model="forceEdit"
    label="Aldaketa indartu"
    color="primary"
    density="compact"
    hide-details
  />
  <v-tooltip text="Behar bezala egindako zuzenketa bada, aktibatu. Bestela, ez.">
    <template #activator="{ props }">
      <v-icon v-bind="props" color="primary" class="ml-2">mdi-alert</v-icon>
    </template>
  </v-tooltip>
</div>



          <v-alert v-if="errorMessage" class="my-3" color="red" variant="tonal">
            {{ errorMessage }}
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-btn @click="editDialog = false">Itxi</v-btn>
<v-btn
  :color="editMode === 'add' ? 'primary' : 'primary'"
  @click="editMode === 'add' ? _addNewSplit() : _confirmEdit()"
>
  {{ editMode === 'add' ? 'Gehitu' : 'Gorde' }}
</v-btn>

        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="demoTagDialog" width="400">
      <v-sheet
        class="pa-4 text-center mx-auto"
        elevation="12"
        max-width="400"
        rounded="lg"
        width="100%"
      >

      <p class="mb-3">Irakurritako tag kopurua erakusten da hemen...</p>
        <template v-if="demoTag">
          <h2 class="text-h5 mb-6">{{ demoTag.reads }}</h2>

          <p class="mb-4 text-medium-emphasis text-body-2">
            {{ demoTag.epcRaw }}
          </p>

          <v-divider class="mb-4"></v-divider>
        </template>
        <v-btn
          @click="_checkDemoTag()"
          class="mb-2"
          variant="flat"
          rounded
          :color="demoTagCheck ? 'red' : 'success'"
        >
          Demo Check</v-btn
        >
      </v-sheet>
    </v-dialog>

    <v-alert
      v-if="race.stream"
      text="zuzeneko jarraipena aktibatuta dago. Online jarraipena egiteko datuak zerbitzarira bidaliko dira denbora-errealean."
      color="primary"
      class="mb-3"
      icon="mdi-video-outline"
    ></v-alert>

    <!-- <v-alert
      v-if="!_canInventory"
      text="Ezin zara TAG irakurketa bat hasi Reader bat bera ere konektatu gabe. Joan Ezarpenak atalera."
      color="red"
      variant="tonal"
      icon="mdi-alert-circle-outline"
    ></v-alert> -->

    <div>
      <v-btn
        @click="_inventory()"
        v-if="!_inventoryStatus && _canInventory"
        variant="flat"
        color="success"
        class="mr-2"
        prepend-icon="mdi-play"
        rounded
      >
        Irakurketa hasi
      </v-btn>

      <v-btn
       v-if="!_inventoryStatus && !_canInventory"
        
        variant="flat"
        class="mr-2"
        color="primary"
        prepend-icon="mdi-play"
        rounded
        disabled
      >
        Irakurketa hasi
      </v-btn>

      <v-btn
        @click="_stop()"
        v-if="_inventoryStatus"
        variant="flat"
        color="red"
        class="mr-2"
        prepend-icon="mdi-stop"
        rounded
      >
        Irakurketa geratu</v-btn
      >

      

      <v-btn
        @click="_delete()"
        variant="tonal"
        color="red"
        prepend-icon="mdi-delete"
        class="mx-2"
        rounded
      >
        Datuak ezabatu</v-btn
      >

      <v-btn
        v-if="sortItems && items.length"
        @click="_saveData()"
        variant="tonal"
        color="primary"
        prepend-icon="mdi-upload"
        class="mx-2"
        rounded
      >
        Zerbitzarian gorde</v-btn
      >


      <v-row class="my-1" dense>
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

        <v-col cols="2">
          <v-select
            v-model="selectedSplit"
            :items="availableSplits"
            class="my-3"
            label="Splitak"
            variant="outlined"
            hide-details
            density="compact"
          />
        </v-col>
      </v-row>
      <v-table density="compact">
        <tbody>
          <tr>
            <th class="text-left" style="width: 50px">Dortsala</th>
            <th class="text-left">Izen-abizenak</th>
            <!-- <th class="text-left">Herria</th> -->
            <th class="text-left" style="width: 130px">Denbora</th>
            <!-- <th class="text-left">Irak. ordua</th> -->
            <th class="text-left">Lasterketa</th>
            <th class="text-left">Split</th>
            <th class="text-left" style="width: 100px">Sexua</th>
            <th class="text-left" style="width: 100px">Reader ID</th>
            <th class="text-left" style="width: 50px">Antena</th>
            <th class="text-left" style="width: 50px"></th>
            <th class="text-left" style="width: 50px"></th>
          </tr>
          <tr
            v-for="(item, i) in sortItems"
            :key="i"
            :class="{
              isWoman: _isWoman(item.sex),
            }"
          >
            <td>{{ item.bib }}</td>
            <td>{{ item.name }}</td>
            <!-- <td>{{ item.city }}</td> -->
            <td>{{ item.pretty_time }}</td>
            <!-- <td>{{ item.real_time }}</td> -->
            <td>{{ item.event }}</td>
            <td>
              {{ item.split }}
            </td>
            <td>{{ getSexLabel(item.sex) }}</td>
            <td>{{ item.reader }}</td>
            <td>{{ item.ant }}</td>

            <td>
              <v-icon
                @click="_deleteItem(item)"
                variant="tonal"
                class="mx-2 my-2"
              >
                mdi-close
              </v-icon>
            </td>

            <td>
              <v-icon @click="_editTag(item)" variant="tonal" class="mx-2 my-2">
                mdi-pencil
              </v-icon>
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- <v-container>
        Eskuz sartu datuak
        <v-text-field label="Dortsala" v-model="customDorsal"></v-text-field>
        <v-text-field label="Denbora" v-model="customTime"></v-text-field>
        <v-btn @click="_addData()"> Gehitu</v-btn>
      </v-container> -->
    </div>
  </div>
</template>

<script>
import StartRace from "./StartRace.vue";
import Loader from "./Loader.vue";
import PercentsComponent from "./Percents.vue";
import ReadDelayReader from "./ReadDelayReader.vue";
import axios from "axios";
import { getSexLabel, validateEditedTime, validateManualSplit } from "../vue-plugins/vue-helpers.js";


export default {
  name: "InventoryComponent",
  components: {
    PercentsComponent,
    StartRace,
    Loader,
    ReadDelayReader,
  },
  data() {
    return {
      name: null,
      customDorsal: "",
      customTime: "14:45:02",
      alert: false,
      loader: false,
      search: null,
      searchName: null,
      searchEvent: null,
      searchSplit: null,
      searchSex: "Denak",
      tab: null,
      percents: null,
      changeItem: null,
      changeSplit: null,
      changeSplitSelected: null,
      message: null,
      color: null,
      demoTagDialog: false,
      demoTagCheck: false,
      selectedCat: "Denak",
      availableCats: [],
      selectedRace: "Denak",
      availableRaces: [],
      selectedSplit: "Denak",
      availableSplits: [],
      editDialog: false,
      editedItem: null,
      editedTime: "",
      errorMessage: false,
      forceEdit: false,
      editMode: "edit", // "edit" o "add"
      selectedRunner: null,
      serverTime: null
    };
  },
  mounted() {
    let that = this;

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

    // splits
    const allSplits = this.$store.state.startList
      .flatMap((i) => i.event.splits?.map((s) => s.name) || [])
      .filter(Boolean);

    this.availableSplits = ["Denak", ...new Set(allSplits)];

    window.ipc.send("toMain", [
        "set-race",
        JSON.stringify(this.race),
      ]);

    window.ipc.handle(
      "fromMain",
      () =>
        function (event, data) {

          if (data[0] === "server-time-info") {
            that.serverTime = data[1];
          }

          if (data[0] == "upload-response") {
            that.loader = false;
            that.message = null;

            const response = data[1];

            if (response) {
              that.message = "Fitxategia ondo igo da zerbitzarira";
              that.color = "success";
            } else {
              that.message =
                "Fitxategia igotzerakoan errore bat gertatu da edo hutsik zegoen...";
              that.color = "error";
            }
          }
        }
    );
  },
  computed: {
    events() {
      return this.$store.state.events;
    },
    readDelay() {
      return this.$store.state.readDelay;
    },
    demoTag() {
      return this.$store.state.demoTag;
    },
    sound() {
      return this.$store.state.sound;
    },
    selectedSplits() {
      return this.$store.state.selectedSplits;
    },
    eventsSplitsHosts() {
      return this.$store.state.eventsSplitsHosts;
    },
    items() {
      return this.$store.getters.getItems;
    },
    startList() {
      return this.$store.state.startList;
    },
    race() {
      return this.$store.state.race;
    },
    hostname() {
      return this.$store.state.hostname;
    },
    sortItems() {
      let items = this.$store.state.items;

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
        filtered = filtered.filter((item) => {
          const match =
            item.event?.toLowerCase() === this.selectedRace.toLowerCase();
          return match;
        });
      }

      if (this.selectedSplit && this.selectedSplit !== "Denak") {
        filtered = filtered.filter((item) => {
          const match =
            item.split?.toLowerCase() === this.selectedSplit.toLowerCase();
          return match;
        });
      }

      if (this.searchSex && this.searchSex !== "Denak") {
        filtered = filtered.filter(
          (item) => this._isWoman(item.sex) === (this.searchSex === "Ema")
        );
      }

      //return filtered.sort((a, b) => a.timestamp - b.timestamp); REVERSE
      return filtered.sort((a, b) => b.timestamp - a.timestamp);
    },
    _canInventory() {
      return this.$store.getters.canInventory;
    },
    _inventoryStatus() {
      return this.$store.state.inventory;
    }
  },
  // watch: {
  //   items: {
  //     handler(val) {

  //     },
  //     deep: true, // Set deep to true to watch nested changes
  //   },
  // },
  methods: {
    getSexLabel,
    validateEditedTime,
    _openAddDialog() {
  this.editMode = "add";
  this.editDialog = true;
  this.editedTime = "0:00:00:000";
  this.selectedRunner = null;
  this.changeSplitSelected = null;
  this.editStart = null;
  this.errorMessage = false;
},
    _editTag(item) {
  this.editedItem = item;
  this.editedTime = item.pretty_time;
  this.changeSplitSelected = item.split; // ✅ seleccionar split actual por defecto
  this.editDialog = true;
  this.editMode = 'edit'
  this.errorMessage = false;
},
    _confirmEdit() {
      this.errorMessage = false;

      const error = this.validateEditedTime(
  this.editedTime,
  this.editedItem,
  this.startList,
  this.items,
  this.changeSplitSelected,
  this.forceEdit
);

      if (error) {
        this.errorMessage = error;
        return;
      }

      window.ipc.send("toMain", [
        "edit-time",
        {
          id: this.editedItem.id,
          newTime: this.editedTime,
          newSplit: this.changeSplitSelected
        },
      ]);
      this.editDialog = false;
    },

   _addNewSplit() {
  this.errorMessage = false;

  if (!this.selectedRunner || !this.changeSplitSelected || !this.editedTime) {
    this.errorMessage = "Datu guztiak bete behar dira.";
    return;
  }

  // Validar entrada (formato, existencia de splits, duplicados, etc.)
  const error = validateManualSplit(
    this.selectedRunner,
    this.changeSplitSelected,
    this.editedTime,
    this.$store.state.startList,
    this.$store.state.items, // Lecturas ya existentes
    this.forceEdit
  );

  if (error) {
    this.errorMessage = error;
    return;
  }

  // Preparar payload para enviarlo al proceso main
  const payload = this.sanitizeReadingPayload(
    this.selectedRunner,
    this.changeSplitSelected,
    this.editedTime,
    null, // no enviamos timestamp
   null
  );

  // Enviar al proceso principal
  window.ipc.send("toMain", ["add-split-reading", payload]);

  this.editDialog = false;
},sanitizeReadingPayload(runner, split, time, timestamp, prettyTime) {
  const event = runner?.event || {};

  return {
    tag: runner.tag || "",
    bib: runner.bib || "",
    name: runner.name || "",
    city: runner.city || "",
    sex: runner.sex || "",
    cat: runner.cat || "",
    club: runner.club || "",
    event: {
      name: event.name || "",
      ID: event.ID || event.id || "",
    },
    split: split || "",
    newTime: time || "",
    pretty: prettyTime || "", // solo para mostrar, opcional
  };
},
    _deleteItem(item) {
      if (confirm(`${item.bib} dortsalaren denbora hau ezabatu nahi duzu?`))
        window.ipc.send("toMain", ["delete-item", item.id]);
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
    _changeRow(item) {
      this.changeSplit = null;
      let find = this.startList.filter((res) => {
        if (res[1] == item.bib) return res;
      });

      this.changeSplit = find[0][4].splits;
      this.changeItem = item;
      this.changeSplitSelected = item.split;
    },
    _saveRow() {
      let find = null;
      this.startList.forEach((res) => {
        if (res[1] == this.changeItem.bib) {
          res[4].splits.forEach((s) => {
            if (s.name == this.changeSplitSelected) {
              find = s;
            }
          });
        }
      });

      if (find) {
        this.changeSplit.split = find.name;
        this.changeSplit.split_slug = find.slug;

        this.items.map((item) => {
          if (item.id == this.changeItem.id) {
            item.split = this.changeSplit.split;
            item.split_slug = this.changeSplit.split_slug;
            window.ipc.send("toMain", [
              "change-item",
              JSON.stringify(this.changeItem),
            ]);
          }
        });
      }
      setTimeout(() => {
        this.changeSplit = null;
        this.changeItem = null;
      }, 300);
    },
    _stop() {
      window.ipc.send("toMain", ["stop"]);
    },
    async _delete() {
      if (confirm("Datuak ezabatu nahi al dituzu?")) {
        let params = {
          id: this.race.ID,
        };
        let probisionalAxios = await axios.post(
          "https://denborak.online/api/v2/delete-data",
          params
        );

        window.ipc.send("toMain", ["delete"]);
      }
    },
    _checkDemoTag() {
      window.ipc.send("toMain", [
        "check-demo-tag",
        (this.demoTagCheck = !this.demoTagCheck),
      ]);
    },
    _inventory() {
      window.ipc.send("toMain", [
        "inventory",
        this.readDelay * 1000,
        JSON.stringify(this.selectedSplits),
        JSON.stringify(this.race),
        this.sound,
        this.race.stream,
      ]);
    },
    _saveData() {
      
      this.loader = true;
      this.message = false;
      window.ipc.send("toMain", [
        "upload-file",
        JSON.stringify(this.items),
        this.race.ID,
      ]);
    },
    _addData() {
      //"tag":"000000000000000000003333","total":1,"ant":4,"time":"1719314445710","name":"Asier Musatadi","city":"Gernika","pretty_time":"00h:00:00:071"

      let search = this._filterByDorsal(this.customDorsal);

      if (search[0] == "UNKNOWN") return;

      window.ipc.send("toMain", ["manual", search[0], this.customTime]);
    },

    _filterByDorsal(dorsal) {
      let find = null;

      find = this.$store.state.startList.filter((res, i) => {
        if (i == 0) return;
        if (parseInt(res[1]) == parseInt(dorsal)) return res;
      });

      if (!find.length) return ["UNKNOWN"];

      return find[0];
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>


v-card-item .percent-name {
  font-weight: 300;
}

.percent-number {
  font-weight: 800;
}

.td-hover {
  cursor: pointer;
}
.isWoman {
  background: rgba(233, 206, 247, 0.2) !important;
}

table {
  th {
    width: 10%;
  }

  th:nth-child(2) {
    width: 35%;
  }
}
</style>
