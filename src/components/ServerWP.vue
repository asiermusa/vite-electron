<template>
  <div class="hello">


     <v-row align="center" no-gutters v-if="!minimal">
      <v-col cols="6"><h2 class="main-title">WordPress zerbitzaria</h2> </v-col>

      <v-col class="text-right" cols="6">
        <v-btn
          @click="_logout()"
          icon="mdi-logout"
          variant="tonal"
          class="mx-3"
          color="red"
        ></v-btn>
      </v-col>
    </v-row>


    <v-row>
      <v-col cols="12">

        <v-btn
          @click="_newRaceDialog()"
          class="mb-2"
          variant="flat"
          color="primary"
          prepend-icon="mdi-plus"
          rounded
        >
          Lasterketa berria</v-btn
        >
      </v-col>
      <v-col class="text-right" cols="6">
        
      </v-col>
    </v-row>

    <Loader v-if="loader" />

    <v-dialog v-model="NewDialog" width="400">
      <v-sheet
        class="pa-4 text-center mx-auto"
        elevation="12"
        max-width="400"
        rounded="lg"
        width="100%"
      >
        <h2 class="text-h5 mb-6">Lasterketaren izena</h2>

        <v-alert
          v-if="errorDialog"
          :text="errorDialog"
          color="red"
          icon="mdi-alert-circle-outline"
          variant="tonal"
        ></v-alert>

        <v-text-field
          placeholder="Izena"
          variant="outlined"
          v-model="newRace.title"
          class="my-3"
          density="compact"
        ></v-text-field>

        <v-text-field
          placeholder="Deskribapena"
          variant="outlined"
          v-model="newRace.content"
          class="my-3"
          density="compact"
        ></v-text-field>

        <v-divider class="mb-4"></v-divider>

        <v-btn
          @click="_newRace()"
          class="mb-2"
          variant="flat"
          color="success"
          rounded
        >
          Berria sortu</v-btn
        >
      </v-sheet>
    </v-dialog>

    <div v-if="item" class="events">
      <v-btn
        @click="item = null"
        prepend-icon="mdi-arrow-left"
        variant="tonal"
        class="my-3"
        size="small"
        rounded
        >Atzera joan</v-btn
      >

      <v-row>
        <v-col cols="12" class="my-6">
          <h2>{{ item.title }}</h2>
        </v-col>
      </v-row>

      <v-row align="center" no-gutters>
        <v-col cols="3">
          <v-text-field
            v-model="item.otp"
            label="Lasterketaren kodea (6 digitu)"
            variant="outlined"
          ></v-text-field>
        </v-col>
        <v-col cols="12">
          <v-checkbox
            v-model="deleteUsersSplits"
            label="Ezabatu split guztietako erabiltzaileak"
          />

          <v-checkbox
            v-model="probisionalData"
            label="Datu probisionalak ezabatu zuzeneko emisiotik (Mongo)"
            class="pa-0 ma-0"
          />
        </v-col>
      </v-row>

      <v-alert color="primary" class="my-8" prominent border="bottom">
        <h3>Zuzeneko emisoa eta sailkapenak:</h3>
        <v-checkbox
          v-model="item.stream"
          label="Zuzeneko jarraipena egin (Mongo datu-basera bidalketak egin)"
          class="pa-0 ma-0"
        />

        <v-checkbox
          v-model="item.stream_show"
          label="Zuzeneko denborak erakutsi webgunean (probisionalak)"
          class="pa-0 ma-0"
        />

        <v-checkbox
          v-model="item.chip_time"
          label="Chip-time erakutsi"
          class="pa-0 ma-0"
          hide-details
        />

        <v-checkbox
          v-model="item.separate_sex"
          label="Sailkapenak sexuz bereizita erakutsi"
          class="pa-0 ma-0"
          hide-details
        />
      </v-alert>

      <v-row align="center">
        <v-col cols="6">
          <v-text-field
            v-model="item.google_drive_id"
            label="Google Drive karpeta"
            variant="outlined"
          ></v-text-field>
        </v-col>

        <v-col cols="6">
          <v-text-field
            v-model="item.excel_name"
            label="Excel fitxategiaren izena"
            variant="outlined"
          ></v-text-field>
        </v-col>
      </v-row>

      <!-- Repeatable Forms -->

      <v-row
        v-for="(event, index) in item.events"
        :key="index"
        class="my-4 events__row"
      >
        <v-col cols="4">
          <v-text-field
            v-model="event.name"
            label="Izena"
            variant="outlined"
          ></v-text-field>
          <small>Adibidez: Luzea</small>
        </v-col>
        <v-col cols="2">
          <v-text-field
            label="Distantzia"
            v-model="event.distance"
            variant="outlined"
          ></v-text-field>
          <small>Metrotan: 21320</small>
        </v-col>

        <v-col cols="4">
          <v-text-field
            label="Hasiera data"
            v-model="event.start_date"
            variant="outlined"
          ></v-text-field>
          <small>Formatua: 2025-09-04 16:30</small>
        </v-col>
        <v-col cols="1">
          <v-btn
            color="red"
            @click="_removeEvent(index)"
            variant="tonal"
            density="comfortable"
            icon="mdi-delete"
          >
          </v-btn>
        </v-col>

        <v-col cols="12" class="splits">
          <v-row
            v-for="(split, s) in event.splits"
            :key="s"
            class="splits__row"
          >
            <template v-if="errors[0]">
              <v-col cols="12" class="py-0">
                <v-alert
                  v-if="errors[index][s]"
                  :text="errors[index][s]"
                  color="red"
                  class="my-4"
                  icon="mdi-alert-circle-outline"
                  variant="tonal"
                ></v-alert>
              </v-col>
            </template>
            <v-col cols="3">
              <v-text-field
                label="Splitaren izena"
                v-model="split.name"
                density="compact"
                variant="outlined"
              ></v-text-field>
            </v-col>

            <v-col cols="1">
              <v-text-field
                label="Kilometroak"
                v-model="split.km"
                density="compact"
                variant="outlined"
                placeholder="Adibidez 0,5 edo 21"
                :error="!!errors[index]?.[s]"
                :error-messages="errors[index]?.[s] || ''"
              ></v-text-field>
            </v-col>

            <v-col cols="3">
              <v-text-field
                label="Denbora minimoa"
                v-model="split.min_time"
                density="compact"
                variant="outlined"
                placeholder="Adibidez 10 minutu: 00:10:00"
                :error="!!errors[index]?.[s]"
                :error-messages="errors[index]?.[s] || ''"
              ></v-text-field>
            </v-col>

            <v-col cols="3">
              <v-text-field
                label="Denbora maximoa"
                v-model="split.max_time"
                density="compact"
                variant="outlined"
                placeholder="Adibidez irteerako baliogarria da"
                :error="!!errors[index]?.[s]"
                :error-messages="errors[index]?.[s] || ''"
              ></v-text-field>
            </v-col>

            <v-col cols="2">
              <v-btn
                color="default"
                @click="_removeSplit(index, s)"
                variant="flat"
                density="comfortable"
                icon="mdi-close"
              >
              </v-btn>
            </v-col>
          </v-row>

          <v-btn
            @click="_addSplit(index)"
            prepend-icon="mdi-plus-circle"
            variant="tonal"
            class="my-3"
            size="small"
          >
            Split berria
          </v-btn>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="4" class="mb-6">
          <v-file-input
            v-model="selectedFile"
            label="Irudia aukeratu"
            accept="image/*"
            prepend-icon="mdi-image"
            @change="uploadImage"
            required
          ></v-file-input>
        </v-col>

        <v-col cols="12" class="mb-12">
          <v-img
            :width="200"
            aspect-ratio="16/9"
            cover
            :src="attachmentUrl"
          ></v-img>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <div class="mb-6">
            <Loader v-if="loader" />

            <v-alert
              v-if="error"
              :text="error"
              color="red"
              icon="mdi-alert-circle-outline"
              variant="tonal"
            ></v-alert>

            <v-alert
              v-if="success"
              v-html="success"
              color="success"
              icon="mdi-alert-circle-outline"
              variant="tonal"
            ></v-alert>
          </div>

          <v-btn
            color="success"
            variant="flat"
            @click="_submitForm()"
            prepend-icon="mdi-cloud-upload"
            rounded
            >Datuak gorde</v-btn
          >

          <v-btn
            color="primary"
            @click="_addEvent()"
            prepend-icon="mdi-plus-circle"
            variant="tonal"
            class="mx-3"
            rounded
          >
            Ebento berria
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <v-data-table
      v-if="items && !item"
      :headers="headers"
      :items="items"
      color="white"
      class="wp-table"
    >
      <template v-slot:item.actions="{ item }" slot="end">
        <div class="d-flex justify-end">
          <v-icon class="my-2" size="default" @click="_editItem(item)">
            mdi-pencil
          </v-icon>

          <v-icon
            color="red"
            @click="_removeRace(item.id)"
            variant="tonal"
            class="mx-2 my-2"
          >
            mdi-delete
          </v-icon>
        </div>
      </template>
      <template v-slot:no-data>
        <v-btn color="primary" @click="initialize"> Reset </v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<script>
// @ is an alias to /src
import axios from "axios";
import Loader from "./Loader.vue";
export default {
  name: "ServerWPComponent",
  components: {
    Loader,
  },
  data() {
    return {
      headers: [
        { title: "ID", key: "id" },
        { title: "Ekitaldia", key: "name" },
        { title: null, key: "actions" },
      ],
      items: null,
      item: null,
      error: false,
      errors: [],
      success: false,
      loader: false,
      menu: false,
      deleteUsersSplits: false,
      attachmentId: null,
      attachmentUrl: null,
      selectedFile: false,
      NewDialog: false,
      probisionalData: false,
      errorDialog: false,
      newRace: {
        title: null,
        content: null,
      },
    };
  },
  mounted() {
    // document.title = "Hasiera - Loraldia QR aplikazioa";
    if (!this._auth) this.$router.push("/login");

    this._get_races();
  },

  computed: {
    _auth() {
      return this.$store.state._auth;
    },
    _race() {
      return this.$store.state.race;
    },
  },
  watch: {
    item(val) {
      if (val) {
        this.attachmentId = val.featured_image_id;
        this.attachmentUrl = val.featured_image[0];
      }
    },
  },
  methods: {
    _newRaceDialog() {
      this.NewDialog = true;
    },
    async _newRace() {
      if (!this.newRace.title) {
        this.errorDialog = "Errorea: Izena ezin da hutsik egon.";
        return;
      }

      try {
        // Enviar la imagen al endpoint de medios (puedes usar el endpoint nativo de WP /wp-json/wp/v2/media)
        const newPost = await axios.post("wp/v2/races", {
          title: this.newRace.title,
          content: this.newRace.content,
          status: "publish",
        });

        if (newPost.status == 201) {
          this._get_races();
          this.NewDialog = false;
        } else {
          this.errorDialog = "Errorea: Ezin izan da lasterketa sortu.";
        }
      } catch (err) {
        this.errorDialog = "Errorea: " + err;
      }
    },
    async _removeRace(id) {
      if (confirm("Lasterketa hau ezabatu nahi duzu?")) {
        try {
          // Enviar la imagen al endpoint de medios (puedes usar el endpoint nativo de WP /wp-json/wp/v2/media)
          const deletePost = await axios.delete("wp/v2/races/" + id);
          if (deletePost.status == 200) {
            this._get_races();
          }
        } catch (err) {
          this.error = "Errorea: " + err;
        }
      }
    },
    validateTimeInput() {
      this.errors = []; // Reset errors
      const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
      let isValid = true;

      this.item.events.forEach((event, eventIndex) => {
        this.errors[eventIndex] = [];
        event.splits.forEach((split, splitIndex) => {
          if (!timeRegex.test(split.min_time)) {
            isValid = false;
            this.errors[eventIndex][splitIndex] =
              "Denbora formatua HH:MM:SS izan behar da";
          }
        });
      });

      return isValid;
    },
    async _get_races() {
      this.loader = true;
      try {
        let res = await axios.get("/v1/get-races");
        this.loader = false;

        if (res.status === 200) {
          this.items = [];
          res.data.data.forEach((r) => {
            this.items.push({
              id: r.ID,
              name: r.post_title,
            });
          });
        }
      } catch (error) {
        this.loader = false;
      }
    },
    async uploadImage() {
      // Creamos un FormData y anexamos la imagen
      const formData = new FormData();
      formData.append("file", this.selectedFile);

      try {
        // Enviar la imagen al endpoint de medios (puedes usar el endpoint nativo de WP /wp-json/wp/v2/media)
        const mediaResponse = await axios.post("wp/v2/media", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Obtenemos el ID del attachment
        this.attachmentId = mediaResponse.data.id;
        this.attachmentUrl = URL.createObjectURL(this.selectedFile);
        this.success = "Irudia ondo igo da.";
      } catch (err) {
        this.error = "Errorea: " + err;
      }
    },
    onDragEnd(event) {
      console.log("Drag ended!", event);
    },
    async _editItem(item) {
      this.loader = true;
      this.success = false;
      const params = {
        id: item.id,
      };
      try {
        let res = await axios.get("/v1/get-race-by-id", { params });

        this.loader = false;

        if (res.status === 200) {
          this.item = res.data.data;
        } else {
          this.error = "Sartutako datuak ez dira zuzenak.";
        }
      } catch (error) {
        this.loader = false;
      }
    },

    async _submitForm() {
      this.error = false;
      this.success = false;

      this.errors = this.item.events.map((event) => ({
        splits: event.splits.map((split) => {
          if (!split.min_time) {
            return "Denbora ezin da hutsik egon"; // Cannot be empty
          }
          if (!/^\d{2}:\d{2}:\d{2}$/.test(split.min_time)) {
            return "Denbora formatua HH:MM:SS izan behar da"; // Invalid format
          }
          return ""; // No error
        }),
      }));

      if (!this.validateTimeInput()) return;
      this.loader = true;

      this.item.events.map((res) => {
        if (!res.unique_id) res.unique_id = this._generateRandomString(14);
      });

      let params = {
        data: this.item,
        featured_image: this.attachmentId,
        deleteSplits: this.deleteUsersSplits,
      };
      let probisionalAxios = null;
      try {
        let res = await axios.post("/v1/set-race-by-id", params);
        this.loader = false;

        let race = res.data;

        if (res.status === 200) {
          this.$store.dispatch("_getCloudData", false);

          if (this.probisionalData) {
            params = {
              id: race.data.ID,
            };

            probisionalAxios = await axios.post(
              "https://denborak.online/api/v2/delete-data",
              params
            );
          }

          let defi = "";
          if (this.deleteUsersSplits || probisionalAxios) {
            defi = "";
            if (this.deleteUsersSplits)
              defi += `<br>Ordenagailu hau split guztietatik ezabatua izan da.`;

            if (probisionalAxios)
              defi += `<br>Mongo datubasea garbitu da ekintza honetarako.`;
          }
          this.success = "Datuak ondo gorde dira zerbitzarian.";
          this.success = this.success + defi;

          race = {
            ID: race.data.ID,
            name: race.data.post_title,
            stream: race.data.stream,
            stream_show: race.data.stream_show,
            separate_sex: race.data.separate_sex,
            chip_time: race.data.chip_time,
          };

          this.$store.commit("_SET_RACE", race);
        } else {
          this.error = "Errore bat gertatu da datuak gordetzerakoan.";
        }
      } catch (error) {
        this.loader = false;
        this.error = error;
      }
    },
    _addEvent() {
      this.item.events.push({
        name: null,
        distance: null,
        start_date: null,
        unique_id: this._generateRandomString(14),
        splits: [],
      });
    },
    _removeEvent(index) {
      this.item.events.splice(index, 1);
    },
    _addSplit(index) {
      this.item.events[index].splits.push({
        name: null,
        min_time: null,
        unique_id: this._generateRandomString(14),
      });
    },
    _removeSplit(index, s) {
      this.item.events[index].splits.splice(s, 1);
    },
    _generateRandomString(length) {
      const characters = "0123456789abcdef"; // Hexadecimal characters
      let result = "";

      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
      }

      return result;
    },
    _logout() {
      this.$store.commit("_AUTH", null);
      window.ipc.send("toMain", ["remove-cookies", "auth"]);
      this.$router.push("/login");
    },
    async login(e) {
      e.preventDefault();

      if (!this.username || !this.password) return;

      this.loader = true;
      this.error = null;
      let params = {
        username: this.username,
        password: this.password,
      };
      setTimeout(async () => {
        try {
          let res = await axios.post("/jwt-auth/v1/token", params);
          this.loader = false;

          if (res.status === 200) {
            let authObject = {
              token: res.data.token,
              ID: res.data.ID,
              user: res.data.user_nicename,
            };

            window.ipc.send("toMain", [
              "set-cookies",
              "auth",
              JSON.stringify(authObject),
            ]);
            this.$store.commit("_AUTH", authObject);
            this.$router.push("/home");

            setTimeout(() => {
              this.error = false;
            }, 3500);

            return true;
          } else {
            this.error = "Sartutako datuak ez dira zuzenak.";
          }
        } catch (error) {
          this.error = "Sartutako datuak ez dira zuzenak.";

          setTimeout(() => {
            this.error = false;
          }, 3500);

          this.loader = false;
        }
      }, 0);
    },
  },
};
</script>

<style lang="scss">
.server {
  overflow-y: auto;
}
.events {
  &__row:nth-child(odd) {
    padding: 40px 10px 20px 10px;
    background: rgba(grey, 0.08);
    border-radius: 5px !important;
  }
}
.splits {
  &__row {
    padding: 0;
  }
}

.draggable-item {
  border: 1px solid #ccc;
  margin: 4px 0;
  padding: 8px;
  border-radius: 8px;
  background: #f9f9f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.v-messages__message {
  display: block !important;
}

.stream {
  background: rgba(#1867c0, 0.2);
  margin: 30px 0 !important;
}

.wp-table {
  thead th:first-child {
    width: 50px;
  }
}
</style>
