<template>
  <div class="hello">
    <v-row>
      <!-- serial port -->

      <v-col cols="12">
        <v-card class="main-card mb-6" variant="outlined">
          <v-card-text class="py-3">
            <v-row align="center" no-gutters>
              <v-col class="main-title" cols="6">USB Reader</v-col>

              <v-col class="text-right" cols="6">
                <v-icon color="primary" icon="mdi-usb-port" size="55"></v-icon>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-item title="USB konexioak arakatu">
            <v-btn
              @click="_get_serial()"
              variant="outlined"
              color="primary"
              class="my-3"
              prepend-icon="mdi-usb-c-port"
              >Arakatu</v-btn
            >
          </v-card-item>
        </v-card>

        <div v-if="serials" class="pa-3">
          <v-select
            label="Serial Port"
            :items="serials"
            v-model="serial"
            variant="outlined"
          ></v-select>
          <v-btn
            @click="_set_serial()"
            color="primary"
            class="my-3"
            variant="flat"
            >USBa zehaztu</v-btn
          >
        </div>

        <v-card class="mx-auto mt-8" max-width="100%" variant="solo">
          <v-card-item>
            <div class="main-title" cols="6">TAG grabatzailea</div>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12">
        <p>{{ uploadMessage }}</p>
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
          icon="mdi-alert-circle-outline"
          variant="tonal"
          closable
          border="start"
        >
          {{ googleError }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row>
      <v-col lg="12" md="12" sm="12" no-gutter>
        <v-card class="main-card" variant="outlined">
          <v-row>
            <v-col lg="4" md="12" sm="12">
              <v-card-text>
                <p class="text-h6 font-weight-black">EPC zebakiak aldatu</p>

                <!-- <div class="text-medium-emphasis">
                  TAG baten kodea (EPC) aldatzeko, erabili azpiko botoia.
                </div> -->

                <v-btn
                  @click="_read_tag()"
                  variant="tonal"
                  prepend-icon="mdi-tag-edit"
                  class="my-3"
                  >Tag berriak grabatu</v-btn
                >
              </v-card-text>
            </v-col>
            <v-col lg="4" md="12" sm="12">
              <v-card-text>
                <p class="text-h6 font-weight-black">Dortsalak asignatu</p>

                <!-- <div class="text-medium-emphasis">
                  TAG bat dortsal bati asignatzeko <br />erabili azpiko
                  botoia.<br />
                  Hau da normalean egingo duguna.
                </div> -->

                <v-btn
                  @click="_assign_tag()"
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-account-tag"
                  class="my-3"
                  >Asignatu</v-btn
                >
              </v-card-text>
            </v-col>
            <v-col lg="4" md="12" sm="12">
              <v-card-text>
                <p class="text-h6 font-weight-black">
                  Google Drivean Gordetzeko
                </p>

                <!-- <div class="text-medium-emphasis">
                  Parte-hartzaileen zerrendan egindako<br />aldaketak DRIVEan
                  gordetzeko<br />
                  sakatu azpiko botoia.
                </div> -->
                <v-btn
                  color="success"
                  variant="flat"
                  prepend-icon="mdi-tag-arrow-up"
                  @click="copyTagsToClipboard()"
                  v-if="currentTags.length"
                  class="my-3"
                  >Zerrenda kopiatu</v-btn
                >

                <v-snackbar v-model="copied" timeout="3000" color="primary">
                  Tag-ak kopiatu dira!
                </v-snackbar>
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- dialog 1 -->
    <v-dialog v-model="dialog1">
      <v-card class="mx-auto pa-8" width="750">
        <v-row align="center" no-gutters>
          <v-col class="main-title2" cols="10">Txipak EPC Grabatu</v-col>

          <v-col class="text-right" cols="2">
            <v-btn
              density="comfortable"
              icon="mdi-close"
              variant="flat"
              @click="dialog1 = null"
            ></v-btn>
          </v-col>
        </v-row>

        <v-alert
          v-if="message"
          class="my-5"
          color="success"
          variant="tonal"
          closable
          border="start"
        >
          TAGa ondo grabatu da.
        </v-alert>

        <v-row class="my-5 pa-3">
          <v-text-field
            label="Prefijoa"
            v-model="prefix"
            variant="underlined"
          ></v-text-field>

          <v-text-field
            label="Zenbatzailea zehaztu"
            v-model="counter"
            variant="underlined"
            class="mx-2"
          ></v-text-field>

          <v-btn
            @click="_set_prefix()"
            color="primary"
            variant="flat"
            class="mx-3"
            >BALIOAK ZEHAZTU</v-btn
          >
        </v-row>

        <template v-if="read">
          <p><small>Momentuko TAG zenbakia:</small></p>
          <div class="tag-title mb-8">{{ read }}</div>
        </template>
        <v-alert
          v-else
          class="my-5"
          color="red"
          icon="mdi-alert-circle-outline"
          variant="tonal"
          closable
          border="start"
        >
          Ez da TAG bat bera ere ez irakurri
        </v-alert>

        <v-row>
          <v-col cols="12">
            <p><small>Gordeko den TAG zenbakia:</small></p>
            <input type="text" v-model="writeTag" class="bib-input" />
          </v-col>
          <v-col cols="12">
            <v-btn
              @click="_read_tag()"
              color="grey-lighten-3"
              size="large"
              variant="flat"
              class="mb-2"
              block
            >
              Irakurri
            </v-btn>
            <v-btn
              @click="_write_tag()"
              color="primary"
              variant="flat"
              block
              size="large"
              :disabled="disabledSave"
              >Gorde</v-btn
            >
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>

    <!-- dialog 2 -->
    <v-dialog v-model="dialog2">
      <v-card class="mx-auto pa-8" width="600">
        <v-row align="center" no-gutters>
          <v-col class="main-title2" cols="10">Dortsalak asignatu</v-col>

          <v-col class="text-right" cols="2">
            <v-btn
              density="comfortable"
              icon="mdi-close"
              variant="flat"
              @click="dialog2 = null"
            ></v-btn>
          </v-col>
        </v-row>

        <v-alert
          v-if="message"
          class="my-5"
          color="success"
          variant="tonal"
          border="start"
        >
          {{ this.message }}
        </v-alert>

        <v-alert
          class="my-5"
          color="red"
          icon="mdi-alert-circle-outline"
          variant="tonal"
          border="start"
          v-model="error"
        >
          {{ error }}
        </v-alert>

        <template v-if="read">
          <p><small>Momentuko TAG zenbakia:</small></p>
          <div class="tag-title mb-8">{{ read }}</div>
        </template>
        <v-alert
          v-else
          class="my-5"
          color="red"
          icon="mdi-alert-circle-outline"
          variant="tonal"
          border="start"
        >
          Ez da TAG bat bera ere ez irakurri
        </v-alert>

        <v-row>
          <v-col cols="12">
            <p><small>Asignaziorako dortsala:</small></p>
            <input type="text" v-model="bibNumber" class="bib-input" />
          </v-col>
          <v-col cols="12">
            <v-btn
              @click="_assign_tag()"
              color="grey-lighten-3"
              size="large"
              variant="flat"
              class="mb-2"
              block
            >
              Irakurri
            </v-btn>
            <v-btn
              @click="_save_items_tag()"
              color="primary"
              variant="flat"
              block
              size="large"
              >Gorde</v-btn
            >
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>

    <v-table class="chips" v-if="currentTags.length || ignoredTags.length">
      <thead>
        <tr class="ignored" v-if="ignoredTags.length">
          <th>IGNORADOS</th>
        </tr>
        <tr>
          <th>Dortsala</th>
          <th>Tag</th>
          <th>Ezabatu</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in _currentTags"
          :key="item.bib"
          :class="{ 'bib-out-of-order': bibsOutOfOrder.has(Number(item.bib)) }"
        >
          <td>
            <strong>{{ item.bib }}</strong>
          </td>
          <td>{{ item.tag }}</td>
          <td>
            <v-btn
              color="default"
              @click="_deleteTag(item)"
              variant="flat"
              density="comfortable"
              icon="mdi-close"
            >
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script>
import axios from "axios";
import Loader from "./Loader.vue";
export default {
  name: "SettingsUSBComponent",
  components: {
    Loader,
  },
  data() {
    return {
      serials: null,
      serial: null,
      writeTag: null,
      read: null,
      prefix: "0",
      counter: 0,
      message: false,
      disabledSave: false,
      bibNumber: 1,
      assign: false,
      dialog1: false,
      dialog2: false,
      error: false,
      items: false,
      loader: false,
      googleSuccess: false,
      googleError: false,
      uploadMessage: null,
      ignoredTags: [],
      copied: false,
    };
  },
  mounted() {
    this.items = this._items;
    this.serial = this._serial;
    this.prefix = this._tags.prefix;
    this.counter = parseInt(this._tags.counter);

    let that = this;
    window.ipc.handle(
      "fromMain",
      () =>
        function (event, data) {
          if (data[0] == "send-serials") {
            that.serials = JSON.parse(data[1]);
          }

          // usb tag irakurri
          if (data[0] == "serial-usb-read") {
            that.read = data[1];

            that.disabledSave = false;

            if (data[2] || !that.read) {
              that.disabledSave = true;
            }
          }

          // usb tag idatzi
          if (data[0] == "serial-usb-write") {
            let response = data[1];

            if (response) {
              that.disabledSave = true;

              //mantener disabled
              that._read_tag(true);

              that.message = true;

              that.counter = parseInt(that.counter) + 1;

              const tag = {
                prefix: that.prefix,
                counter: that.counter,
                currentTag: that.writeTag,
              };
              that.$store.commit("_SET_TAG", tag);
            }
          }
        }
    );
  },
  computed: {
    _currentTags() {
      if (this.ignoredTags.length) {
        return this.ignoredTags;
      } else {
        return this.currentTags;
      }
    },
    _serial() {
      return this.$store.state.serial;
    },
    _tags() {
      return this.$store.state.tags;
    },
    _items() {
      return this.$store.state.startList;
    },
    _race() {
      return this.$store.state.race;
    },
    _headers() {
      return this.$store.state.startListHeaders;
    },
    startList() {
      return this.$store.state.startList;
    },
    currentTags() {
      return this.$store.state.currentTags;
    },
    bibsOutOfOrder() {
      const bibs = this.currentTags
        .map((item) => Number(item.bib))
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);

      const outOfOrder = new Set();

      for (let i = 0; i < bibs.length - 1; i++) {
        if (bibs[i + 1] !== bibs[i] + 1) {
          outOfOrder.add(bibs[i + 1]); // el que rompe la secuencia
        }
      }

      return outOfOrder;
    },
  },
  methods: {
    copyTagsToClipboard() {
      const text = this.currentTags.map((item) => item.tag).join("\n"); // usa "\t" si quieres columnas
      navigator.clipboard.writeText(text).then(() => {
        this.copied = true;
      });
    },
    _get_serial() {
      window.ipc.send("toMain", ["get-serial"]);
    },
    _set_serial() {
      window.ipc.send("toMain", ["set-cookies", "serial", this.serial]);
      this.$store.commit("_SET_SERIAL_PORT", this.serial);
    },
    _set_read_delay() {
      this.$store.commit("_SET_READ_DELAY", this.readDelay);
      this.$store.commit("_SET_BEEP", this.beep);
    },
    _set_prefix() {
      const tag = {
        prefix: this.prefix,
        counter: parseInt(this.counter),
        currentTag: this._tags.currentTag,
      };
      this.$store.commit("_SET_TAG", tag);
    },
    generateEPC(prefix, counter) {
      const counterString = counter.toString().padStart(12, "0"); // Convierte el contador a un string de 12 dígitos
      const paddedPrefix = prefix.padEnd(12, "0"); // Completa el prefijo con ceros hasta 12 caracteres
      return paddedPrefix + counterString; // Combina el prefijo y el contador
    },
    _read_tag(disabled = false) {
      this.dialog1 = true;
      window.ipc.send("toMain", ["read-tag", this.serial, disabled]);
      this.writeTag = this.generateEPC(this.prefix, this._tags.counter + 1);
      this.message = false;
    },
    _write_tag() {
      window.ipc.send("toMain", ["write-tag", this.serial, this.writeTag]);
    },
    _normalize(str) {
      if (!str) return null;
      return str.replace(/^0+(?=\d)/, "");
    },
    _assign_tag(disabled = false) {
      this.ignoredTags = [];
      this.dialog2 = true;
      this.error = false;
      this.message = false;

      window.ipc.send("toMain", ["read-tag", this.serial, disabled]);
      this.message = false;
    },
    async _save_items_tag() {
      let exist = false;
      this.message = false;

      // ¿Ya existe este dorsal?
      if (this.currentTags.some((res) => res.bib == this.bibNumber)) {
        this.error = "Dortsal hau duplikatuta duzu.";
        return true;
      }

      // ¿Ya existe este tag?
      if (
        this.currentTags.some(
          (res) => this._normalize(res.tag) == this._normalize(this.read)
        )
      ) {
        this.error = "Txip hau dortsal bati asignatuta dago.";
        return true;
      }

      // Añadir nuevo tag y ordenar por dorsal
      let currents = [...this.currentTags];
      currents.push({ tag: this.read, bib: this.bibNumber });

      // 🔀 Ordenar por bib numérico
      currents.sort((a, b) => Number(a.bib) - Number(b.bib));

      // Guardar en el store
      this.$store.commit("_SET_CURRENT_TAGS", currents);

      this.message = "Ondo gorde da";
      this.bibNumber++;
    },
    async _deleteTag(item) {
      let del = null;
      // ea txip hau jadanik dortsal batek duen ala ez
      this.currentTags.forEach((res, index) => {
        if (res.bib == item.bib) del = index;
      });

      let currents = this.currentTags;
      if (del > -1) {
        currents.splice(del, 1);
        this.$store.commit("_SET_CURRENT_TAGS", currents);
      } else {
        this.error = "Arazo bat gertatu da.";
        return true;
      }
    },
    async _save_to_google() {
      if (!this.currentTags.length) {
        alert("Ez dago daturik aldatzeko");
        return;
      }

      this.googleError = false;
      this.googleSuccess = false;
      this.loader = true;
      this.uploadMessage = "Zerrenda eskuratzen Google Drivetik...";
      // hasierako atleta guztien excela montatu
      let items = await this.$store.dispatch("_get_participants");

      if (!items.data.success) {
        this.error = "Errorea: " + items.data.data.message;
        return;
      }

      setTimeout(async () => {
        items = this.startList;

        items.map((item) => {
          this.currentTags.forEach((cur) => {
            if (
              item.bib == cur.bib &&
              !items.some(
                (otherItem) => otherItem.tag == cur.tag.replace(/^0+/, "")
              )
            ) {
              // Si no existe ningún otro item con este tag, lo asigna
              item.tag = cur.tag;
            }
          });
        });

        // check ignored new tags
        this.ignoredTags = [];
        this.currentTags.forEach((cur) => {
          // Buscamos los items que tienen el mismo 'bib'
          const matchingItems = items.filter((item) => item.bib == cur.bib);
          // Si no existe ningún item con ese 'bib', se ignora este tag
          if (!matchingItems.length) {
            this.ignoredTags.push(cur);
            return;
          }
          // Normalizamos el tag a comparar (quitando ceros a la izquierda)
          const normalizedCurTag = cur.tag.replace(/^0+/, "");
          // Verificamos si en alguno de los items encontrados se asignó ese tag (normalizado)
          const tagAsignado = matchingItems.some(
            (item) =>
              item.tag && item.tag.replace(/^0+/, "") === normalizedCurTag
          );
          // Si el tag no se asignó (o aparece duplicado) se ignora
          if (!tagAsignado) {
            this.ignoredTags.push(cur);
          }
        });

        this.$store.commit("_SET_START_LIST", items);

        this.uploadMessage = "Google Driven gordetzen...";

        try {
          let response = await axios.post("/v1/save-drive", {
            items: JSON.stringify(items),
            post_id: this._race.ID,
            excel_headers: this._headers,
          });

          if (response.data.success == true) {
            this.uploadMessage =
              "Zerrenda lokala datu berriekin eguneratzen...";
            // hasierako atleta guztien excela montatu
            response = await this.$store.dispatch("_get_participants");

            if (response.data.success) {
              window.ipc.send("toMain", ["upload-inscritos", this._race.ID]);
              this.googleSuccess =
                "Egindako aldaketak Google Driven ondo gorde dira";
            } else {
              this.googleError = "Errorea: " + response.data.data.message;
            }
          } else this.googleError = response.data.data.message;

          this.uploadMessage = null;

          this.loader = false;

          if (this.ignoredTags.length)
            alert(
              `${this.ignoredTags.length} dortsal ez dira gorde. Errepasatu itzazu.`
            );
        } catch (err) {
          this.loader = false;
          console.log(err);
          this.googleError =
            "Errorea: Zerbitzarian errore bat gertatu da. Konprobatu ezazu dena ondo dagoela.";
          this.uploadMessage = null;
        }
      }, 500);
    },
  },
};
</script>

<style lang="scss">
.tag-title {
  font-weight: 500;
  font-size: 22px;
  background: #111;
  text-align: center;
  padding: 15px;
  color: rgb(0, 255, 170);
  border-radius: 3px;
}

.main-title2 {
  font-size: 20px;
  font-weight: 300;
}

.main-card {
  max-width: 100% !important;
}
.bib-input {
  font-size: 22px;
  text-align: center;
  width: 100%;
  text-align: center;
  padding: 10px;
  border: 2px solid rgba(black, 0.1);
  border-radius: 3px;
  outline: 0;
}

.chips {
  margin-top: 50px;
  text-align: left;

  thead {
    background: black;
    color: white;

    th:first-child {
      width: 50px;
    }

    .ignored {
      background: red;
    }
  }
}

.bib-out-of-order {
  background-color: rgba(255, 0, 0, 0.15);
  color: #c62828;
  font-weight: bold;
}
</style>
