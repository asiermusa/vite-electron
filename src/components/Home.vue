<template>
  <div class="hello">
    <v-progress-linear
      color="lime"
      indeterminate
      reverse
      v-if="loader"
    ></v-progress-linear>

    <v-alert
      v-if="!_canInventory"
      text="No puedes comenzar las lecturas antes de conectar un Reader."
      title="Atencion!"
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

      <v-text-field
        placeholder="Bilatu"
        v-model="search"
        variant="outlined"
        class="my-2"
      ></v-text-field>

      <v-table>
        <tbody>
          <tr>
            <th class="text-left">Izena</th>
            <th class="text-left">Herria</th>
            <th class="text-left">Denbora</th>
            <th class="text-left">Irak. ordua</th>
            <th class="text-left">Event</th>
            <th class="text-left">Split</th>
            <th class="text-left">Reader ID</th>
            <th class="text-left">Antena</th>
          </tr>
          <tr v-for="(item, i) in sortItems" :key="i">
            <td>{{ item.name }}</td>
            <td>{{ item.city }}</td>
            <td>{{ item.pretty_time }}</td>
            <td>{{ item.real_time }}</td>
            <td>{{ item.event }}</td>
            <td>{{ item.split }}</td>
            <td>{{ item.reader }}</td>
            <td>{{ item.ant }}</td>
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
//import axios from "axios";
export default {
  name: "HomeComponent",

  data() {
    return {
      name: null,
      customDorsal: "",
      customTime: "14:45:02",
      alert: false,
      loader: false,
      search: null,
      tab: null,
      percents: null,
    };
  },

  computed: {
    events() {
      return this.$store.state.events;
    },
    readDelay() {
      return this.$store.state.readDelay;
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
    hostname() {
      return this.$store.state.hostname;
    },
    sortItems() {
      let items = this.$store.state.items;
      if (!items.length) return;
      if (!this.search) return items;
      return items.filter((item) => {
        return item.name.toLowerCase().includes(this.search.toLowerCase());
      });
    },
    _canInventory() {
      return this.$store.getters.canInventory;
    },
    _inventoryStatus() {
      return this.$store.state.inventory;
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
      ]);
    },
    _saveData() {
      console.log(this.items);
      window.ipc.send("toMain", ["excel", JSON.stringify(this.items)]);
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
</style>
