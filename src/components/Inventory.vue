<template>
  <div class="hello">
    <v-navigation-drawer location="right" permanent width="300">
      <StartRace></StartRace>
      <PercentsComponent :minimal="true"></PercentsComponent>
    </v-navigation-drawer>

    <Loader v-if="loader" class="my-3"></Loader>

    <v-alert v-if="message" class="mb-6" :color="color" variant="tonal">
      {{ message }}
    </v-alert>

    <v-dialog v-model="changeSplit" width="400">
      <v-card class="pa-3">
        <template v-if="changeSplit">
          <v-select
            placeholder="Splita aldatu"
            variant="outlined"
            v-model="changeSplitSelected"
            class="my-3"
            :items="changeSplit"
            item-title="name"
            density="compact"
          ></v-select>

          <v-btn
            @click="_saveRow()"
            color="primary"
            class="mb-2"
            variant="flat"
          >
            Gorde</v-btn
          >
        </template>
      </v-card>
    </v-dialog>

    <v-alert
      v-if="!_canInventory"
      text="Ezin zara TAG irakurketa bat hasi Reader bat bera ere konektatu gabe. Joan Ezarpenak atalera."
      type="error"
      variant="tonal"
    ></v-alert>

    <div v-else>
      <v-btn
        @click="_inventory()"
        v-if="!_inventoryStatus"
        variant="flat"
        color="success"
        prepend-icon="mdi-play"
      >
        Irakurketa hasi
      </v-btn>

      <v-btn
        @click="_stop()"
        v-if="_inventoryStatus"
        variant="flat"
        color="error"
        prepend-icon="mdi-stop"
      >
        Irakurketa geratu</v-btn
      >

      <v-btn
        @click="_delete()"
        variant="outlined"
        color="error"
        prepend-icon="mdi-delete"
        class="mx-2"
      >
        Datuak ezabatu</v-btn
      >

      <v-btn
        @click="_saveData()"
        variant="outlined"
        color="primary"
        prepend-icon="mdi-upload"
        class="mx-2"
      >
        Internetera bidali</v-btn
      >

      <v-row class="my-1">
        <v-col cols="3">
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

        <v-col cols="3" v-if="eventsSplitsHosts">
          <v-select
            placeholder="Lasterketa"
            variant="outlined"
            v-model="searchEvent"
            class="my-3"
            :items="eventsSplitsHosts"
            item-title="name"
            density="compact"
          ></v-select>
        </v-col>

        <v-col cols="3">
          <v-text-field
            placeholder="Splita"
            variant="outlined"
            v-model="searchSplit"
            class="my-3"
            density="compact"
          ></v-text-field>
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
            <th class="text-left" style="width: 100px">Reader ID</th>
            <th class="text-left" style="width: 50px">Antena</th>
            <!-- <th class="text-left" style="width: 50px">ID</th> -->
          </tr>
          <tr
            v-for="(item, i) in sortItems"
            :key="i"
            :class="{ isWoman: _isWoman(item.sex) }"
          >
            <td>{{ item.dorsal }}</td>
            <td>{{ item.name }}</td>
            <!-- <td>{{ item.city }}</td> -->
            <td>{{ item.pretty_time }}</td>
            <!-- <td>{{ item.real_time }}</td> -->
            <td>{{ item.event }}</td>
            <td @click="_changeRow(item)" class="td-hover">
              {{ item.split }}
            </td>
            <td>{{ item.reader }}</td>
            <td>{{ item.ant }}</td>
            <!-- <td>{{ item.id }}</td> -->
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
export default {
  name: "InventoryComponent",
  components: {
    PercentsComponent,
    StartRace,
    Loader,
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
      tab: null,
      percents: null,
      changeItem: null,
      changeSplit: null,
      changeSplitSelected: null,
      message: null,
      color: null,
    };
  },
  mounted() {
    let that = this;

    window.ipc.handle(
      "fromMain",
      () =>
        function (event, data) {
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

      if (!items.length) return;
      // if (!this.search) return items;
      // if (!this.searchHerria) return items;

      let response = items;

      // Apply search filter if "search" is defined
      if (this.search) {
        response = response.filter((item) => {
          return item.tag.toLowerCase().includes(this.search.toLowerCase());
        });
      }
      if (this.searchName) {
        response = response.filter((item) => {
          return item.name
            .toLowerCase()
            .includes(this.searchName.toLowerCase());
        });
      }
      if (this.searchEvent) {
        response = response.filter((item) => {
          return item.event
            .toLowerCase()
            .includes(this.searchEvent.toLowerCase());
        });
      }
      if (this.searchSplit) {
        response = response.filter((item) => {
          return item.split
            .toLowerCase()
            .includes(this.searchSplit.toLowerCase());
        });
      }
      return response;
    },
    _canInventory() {
      return this.$store.getters.canInventory;
    },
    _inventoryStatus() {
      return this.$store.state.inventory;
    },
    startList() {
      return this.$store.state.startList;
    },
  },
  // watch: {
  //   items: {
  //     handler(val) {

  //     },
  //     deep: true, // Set deep to true to watch nested changes
  //   },
  // },
  methods: {
    _isWoman(s) {
      if (s == "E" || s == "F") return true;
    },
    _changeRow(item) {
      this.changeSplit = null;
      let find = this.startList.filter((res) => {
        if (res[1] == item.dorsal) return res;
      });

      this.changeSplit = find[0][4].splits;
      this.changeItem = item;
      this.changeSplitSelected = item.split;
    },
    _saveRow() {
      let find = null;
      this.startList.forEach((res) => {
        if (res[1] == this.changeItem.dorsal) {
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
    _delete() {
      if (confirm("Datuak ezabatu nahi al dituzu?"))
        window.ipc.send("toMain", ["delete"]);
    },
    _inventory() {
      window.ipc.send("toMain", [
        "inventory",
        this.readDelay * 1000,
        JSON.stringify(this.selectedSplits),
        JSON.stringify(this.race),
        this.sound,
      ]);
    },
    _saveData() {
      this.loader = true;
      this.message = false;
      window.ipc.send("toMain", ["upload-file", JSON.stringify(this.items)]);
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
</style>
