<template>
  <div class="hello">
    <!-- <v-row align="center" no-gutters>
      <v-col cols="6"><h2 class="main-title">Sailkapenak sortu</h2> </v-col>

      <v-col class="text-right" cols="6">
        <v-icon
          color="primary"
          icon="mdi-format-list-numbered"
          size="55"
        ></v-icon>
      </v-col>
    </v-row> -->

    <v-alert
      v-if="error"
      :text="error"
      color="red"
      icon="mdi-alert-circle-outline"
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

    <v-alert
      v-if="race.separate_sex"
      text="Sailkapenak sexuz bereizita agertuko dira. Denak batera baina postua eta diferentziak sexuz bereizita."
      type="info"
      variant="tonal"
      class="my-2"
    ></v-alert>

    <Loader v-if="loader" class="my-2" />

    <v-select
      placeholder="Lasterketa"
      variant="outlined"
      v-model="event"
      class="my-6"
      :items="eventsSplitsHosts"
      item-title="name"
      item-value="unique_id"
      density="compact"
    ></v-select>

    <!-- <v-btn
      @click="getClasificacionDevices()"
      color="primary"
      variant="flat"
      class="my-3"
      >Sailkapenak sortu</v-btn
    > -->

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-item title="Ezabatu"></v-card-item>
        <v-card-text
          >Ezabatu gailu batek zerbitzarian gordetako sailkapena.</v-card-text
        >
        <v-card-item class="my-0">
          <v-select
            v-if="devices"
            placeholder="Gailuak"
            variant="outlined"
            v-model="removeUserFile"
            :items="userItems"
            item-title="user"
            item-value="user"
            density="compact"
          ></v-select>
        </v-card-item>

        <v-card-actions>
          <v-spacer></v-spacer>
          <!-- Button to Close Dialog -->
          <v-btn color="red" text @click="removeClasificacion()">Ezabatu</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div v-if="devices" class="my-3">
      <v-card class="main-card" variant="outlined">
        <v-btn
          @click="dialog = true"
          color="red"
          variant="tonal"
          size="small"
          class="mt-2 mb-2 mx-3"
          >Sailkapena ezabatu</v-btn
        >

        <v-card-item title="Zehaztu sailkapenak" v-if="eventsSplitsHosts">
          <template v-slot:subtitle>
            Zehaztu zein gailuren datuak erabiliko dituzun sailkapenak sortzeko.
          </template>

          <div>
            <v-chip-group v-model="selectedChips" multiple class="my-4">
              <v-chip
                v-for="device in devices"
                :key="device.id_post"
                :value="device.filename"
                class="ma-2"
                color="primary"
                outlined
              >
                {{ device.user }}
              </v-chip>
            </v-chip-group>

            <v-chip
              v-for="(chip, index) in selectedChips"
              :key="'selected-' + index"
              color="success"
              class="ma-2"
              closable
              @click:close="removeDevice(chip)"
            >
              {{ chip }}
            </v-chip>
          </div>

          <div v-if="event" class="mt-8">
            <v-card-title>Aukeratu erakusteko zutabeak eta ordena</v-card-title>

            <!-- Chip Group for Selection -->
            <v-chip-group v-model="selectedRows" multiple column class="my-4">
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

            <v-chip
              v-for="(chip, index) in selectedRows"
              :key="'selected-' + index"
              color="success"
              class="ma-2"
              closable
              @click:close="removeChip(chip)"
            >
              {{ Object.values(chip)[0] }}
            </v-chip>
          </div>

          <v-btn
            @click="sendData"
            variant="outlined"
            color="primary"
            class="mt-6"
            >Sailkapena sortu</v-btn
          >
        </v-card-item>
      </v-card>

      <v-card class="main-card my-5" variant="outlined">
        <v-card-item title="CSV batetik sortu sailkapena">
          <template v-slot:subtitle>
            Aurrez editatuko fitxagi bat igo eta sortu sailkapena. <br />Ez da
            kontutan hartuko lasterketa. Zerbitzarian igota dagoen csv
            fitxategiarekin sortuko da sailkapena.
          </template>
        </v-card-item>
        <v-card-item>
          <v-file-input
            v-model="csvFile"
            label="Arrastra y suelta tu archivo CSV o haz clic para seleccionar"
            accept=".csv"
            prepend-icon="mdi-file-upload"
            outlined
            dense
            dropzone
            @change="uploadFile"
          ></v-file-input>

          <v-btn
            @click="sendExcelClas()"
            variant="outlined"
            color="primary"
            class="mt-6"
            >Sailkapena sortu</v-btn
          >
        </v-card-item>
      </v-card>

      <v-row class="my-6">
        <v-col>
          <v-sheet v-if="pdf" class="pa-4 text-left" rounded="lg" width="100%">
            <h2 class="text-h5 mb-1">Sailkapenak deskargatu</h2>

            <p class="mb-0 text-medium-emphasis text-body-2">
              PDF eta EXCEL formatuak
            </p>

            <div class="text-left">
              <v-btn
                @click="download(pdf, 'pdf')"
                variant="flat"
                color="red"
                class="mt-3 mr-3"
                v-if="pdf"
                prepend-icon="mdi-file-pdf-box"
                >Deskargatu PDF</v-btn
              >

              <v-btn
                @click="download(excel, 'xlsx')"
                variant="flat"
                color="green"
                class="mt-3"
                v-if="excel"
                prepend-icon="mdi-file-excel"
                >Deskargatu EXCEL</v-btn
              >
            </div>
          </v-sheet>
        </v-col>

        <v-col>
          <v-card variant="flat" v-if="info" class="main-card">
            <v-card-item title="Irakurketa %">
              <template v-slot:subtitle>
                Zehaztutako gailuetan irakurritako portzentaiak.
              </template>
              <div
                v-for="(split, index) in info.splits"
                :key="index"
                class="mt-3"
              >
                <div v-for="(value, key) in split" :key="key" class="mb-3">
                  <div class="percent-name">
                    {{ key }}
                    <span class="percent-number">{{ value }}%</span>
                  </div>

                  <v-progress-linear
                    :color="_getColor(Number(value))"
                    height="12"
                    :model-value="Number(value)"
                    striped
                  ></v-progress-linear>
                </div>
              </div>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>
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
      csvFile: false,
      devices: false,
      error: false,
      success: false,
      loader: false,
      event: null,
      selectedSplits: null,
      selectedChips: [],
      selectedRows: [],
      pdf: false,
      excel: false,
      info: false,
      removeUserFile: null,
      dialog: false,
    };
  },
  mounted() {
    this.getClasificacionDevices();
  },
  computed: {
    userItems() {
      // Convert object to array
      return Object.values(this.devices);
    },
    race() {
      return this.$store.state.race;
    },
    eventsSplitsHosts() {
      return this.$store.state.eventsSplitsHosts;
    },
    hostname() {
      return this.$store.state.hostname;
    },
    _computedRows() {
      if (!this.selectedSplits) return;

      let rows = [
        { bib: "Dorsala" },
        { name: "Izen-abizenak" },
        { sex: "Sexua" },
        { city: "Herria" },
        { cat: "Kategoria" },
        { diff: "Diferentzia" },
      ];
      this.selectedSplits.splits.forEach((res, index) => {
        rows.push({
          ["split_" + res.unique_id]: res.name,
        });
      });
      return rows;
    },
    _computedRowsToSend() {
      if (!this.selectedSplits) return;
      let rows = ["bib", "tag", "name", "sex", "city", "cat", "diff"];
      this.selectedSplits.splits.forEach((res, index) => {
        rows.push("split_" + res.unique_id);
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
    async uploadFile(file) {
      // Verifica que se haya seleccionado un archivo
      if (!file) return;

      // Crea un objeto FormData y añade el archivo
      const formData = new FormData();
      formData.append("csv_file", this.csvFile);
      formData.append("id", this.race.ID);
      // Configura la URL de tu endpoint en WordPress

      try {
        const response = await axios.post("/v1/upload-excel", formData);

        if (response.status == 200) {
          this.success = "Fitxategia ondo prozesatu da.";
        } else {
          this.error = "Errorea: Fitxategia ez da ondo prozesatu.";
        }
      } catch (error) {
        this.error = "Errorea: " + error;
      }
    },
    _getColor(val) {
      let color = "primary";
      if (val < 100) color = "red";
      return color;
    },
    async removeClasificacion() {
      if (!confirm("Zure sailkapenak ezabatu nahi al dituzu?")) return;

      this.loader = true;
      try {
        const response = await axios.post("/v1/remove-clasificacion-devices", {
          post_id: this.race.ID,
          user: this.removeUserFile,
        });

        if (response.data.success) {
          this.devices = response.data.data;
          this.success = "Sailkapena ondo ezabatu da.";
        } else {
          this.error =
            "Errorea: Arazo bat geratu da ezabatzerakoan. Saiatu berriro.";
        }
        this.loader = false;
        this.dialog = false;
      } catch (err) {
        this.error =
          "Errorea: Arazo bat gertatu da zerbitzarian datuak jasotzerakoan.";
        this.loader = false;
        this.dialog = false;
      }
    },
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
      if (
        this.selectedChips.length < 1 ||
        this.selectedRows.length < 1 ||
        !this.event
      ) {
        this.error = "Errorea: Aukeraketak egin behar dituzu.";
        return;
      }

      this.pdf = false;
      this.error = false;
      this.success = false;
      this.loader = true;
      this.info = false;

      let newRows = this.selectedRows.map((item) => Object.keys(item)[0]);
      newRows.push("tag");

      try {
        const response = await axios.get("/v1/process-results", {
          params: {
            post_id: this.race.ID,
            devices: JSON.stringify(this.selectedChips),
            event: this.event,
            rows: JSON.stringify(this._computedRowsToSend),
            selected_rows: JSON.stringify(newRows),
            mode: "new",
          },
        });

        if (response.data.data.success) {
          this.success = "Sailkapena ondo sortu da.";
          this.pdf = response.data.data.pdf;
          this.excel = response.data.data.excel;
          this.info = response.data.data.data;
          // window.ipc.send("toMain", [
          //   "excel",
          //   JSON.stringify(response.data.data),
          // ]);
        } else {
          this.error =
            "Errorea: Ez da sailkapenak sortzeko behar besteko daturik aurkitu. (parte-hartzaile zerrenda, sailkapenak, splitak...)";
        }
        this.loader = false;
      } catch (err) {
        this.error = err;
        this.loader = false;
      }
    },

    async sendExcelClas() {
      if (!this.event) {
        this.error = "Errorea: Aukeratu lasterketa.";
        return;
      }
      this.pdf = false;
      this.error = false;
      this.success = false;
      this.loader = true;
      this.info = false;

      try {
        const response = await axios.get("/v1/process-results", {
          params: {
            post_id: this.race.ID,
            event: this.event,
            mode: "excel",
          },
        });

        if (response.data.data.success) {
          this.success = "Sailkapena ondo sortu da.";
          this.pdf = response.data.data.pdf;
          this.excel = response.data.data.excel;
          this.info = response.data.data.data;
          // window.ipc.send("toMain", [
          //   "excel",
          //   JSON.stringify(response.data.data),
          // ]);
        } else {
          this.error =
            "Errorea: Ez da sailkapenak sortzeko behar besteko daturik aurkitu. (parte-hartzaile zerrenda, sailkapenak, splitak...)";
        }
        this.loader = false;
      } catch (err) {
        this.error = "Errorea: " + err;
        this.loader = false;
      }
    },
    removeChip(chip) {
      this.selectedRows = this.selectedRows.filter((item) => item !== chip);
    },
    removeDevice(chip) {
      this.selectedChips = this.selectedChips.filter((item) => item !== chip);
    },
    _toSlug(str) {
      if (typeof str !== "string") {
        return null;
      }

      return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Remove non-alphanumeric characters
        .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ""); // Remove leading or trailing hyphens
    },
    download(ruta, type = "pdf") {
      const pdfUrl = ruta; // Reemplaza con tu URL

      let eventName = this.eventsSplitsHosts.filter((res) => {
        if (res.unique_id == this.event) return res;
      });

      const fileName = `${this._toSlug(this.race.name)}-${this._toSlug(
        eventName[0].name
      )}.${type}`; // Nombre del archivo que se descargará

      window.ipc.send("toMain", ["download-pdf", pdfUrl, fileName, type]);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
