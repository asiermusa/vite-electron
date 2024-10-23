<template>
  <div class="hello">
    <v-progress-linear
      color="lime"
      indeterminate
      reverse
      v-if="loader"
    ></v-progress-linear>

    <v-alert
      v-if="alert"
      class="my-5"
      color="success"
      variant="outlined"
      icon="mdi-cloud-arrow-up-outline"
    >
      Praesent venenatis metus at tortor pulvinar varius. Aenean commodo ligula
      eget dolor. Praesent ac massa at ligula laoreet iaculis. Vestibulum
      ullamcorper mauris at ligula.
    </v-alert>

    <h1>Inventory</h1>

    <v-alert
      v-if="!_canInventory"
      text="No puedes comenzar las lecturas antes de conectar un Reader."
      title="Atencion!"
      type="info"
      variant="tonal"
    ></v-alert>

    <div v-else>
      <v-btn @click="_inventory()" color="primary"> Irakurketa hasi </v-btn>

      <v-btn @click="_stop()"> Irakurketa geratu</v-btn>

      <v-btn @click="_delete()" color="warning"> Datuak ezabatu</v-btn>

      <v-text-field placeholder="Bilatu" v-model="search"></v-text-field>

      <v-table>
        <thead>
          <tr>
            <th class="text-left">Izena</th>
            <th class="text-left">Herria</th>
            <th class="text-left">Denbora</th>
            <th class="text-left">Irak. ordua</th>
            <th class="text-left">Split</th>
            <th class="text-left">Reader ID</th>
            <th class="text-left">Antena</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in sortItems" :key="i">
            <td>{{ item.name }}</td>
            <td>{{ item.city }}</td>
            <td>{{ item.pretty_time }}</td>
            <td>{{ item.real_time }}</td>
            <td>{{ item.split }}</td>
            <td>{{ item.reader }}</td>
            <td>{{ item.ant }}</td>
          </tr>
        </tbody>
      </v-table>

      <v-btn @click="_saveData()" color="secondary"> Internetera bidali</v-btn>

      <v-container>
        Eskuz sartu datuak
        <v-text-field label="Dortsala" v-model="customDorsal"></v-text-field>
        <v-text-field label="Denbora" v-model="customTime"></v-text-field>
        <v-btn @click="_addData()"> Gehitu</v-btn>
      </v-container>
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
    };
  },
  computed: {
    readDelay() {
      return this.$store.state.readDelay;
    },
    selectedSplits() {
      return this.$store.state.selectedSplits;
    },
    items() {
      return this.$store.state.items;
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
  },

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
<style scoped></style>
