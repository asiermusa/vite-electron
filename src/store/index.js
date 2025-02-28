import {
  createStore
} from 'vuex'

import axios from 'axios'
import socket from "../socket";

function toSlug(str) {

  if (typeof str !== 'string') {
    return null;
  }

  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading or trailing hyphens
}

export default createStore({
  state: {
    _auth: null,
    _globalError: false,
    connected: null,
    startChrono: false,
    startTime: null,
    startList: [],
    startListHeaders: [],
    items: [],
    hostname: null,
    inventory: false,
    readDelay: 10, //seconds
    sound: false,
    serial: null,
    race: null,
    events: [],
    selectedSplits: [],
    eventsSplitsHosts: null,
    currentTags: [],
    status: {
      wp: false,
      socket: false,
      mongo: false,
      drive: false
    },
    tags: {
      prefix: "0",
      counter: 0,
      currentTag: null,
    },
    start: null
  },
  mutations: {
    _AUTH(state, val) {
      state._auth = val
    },
    _GLOBAL_ERROR(state, val) {
      state._globalError = val
    },
    _CONNECTED(state, val) {
      state.connected = val
    },
    _SET_EVENTS(state, val) {
      state.events = val
    },
    _SET_SELECTED_SPLITS(state, val) {
      state.selectedSplits = val
    },
    _START_TIME(state, val) {
      state.startTime = val
    },
    _START_CHRONO(state, val) {
      state.startChrono = val
    },
    _SAVE_ITEMS(state, val) {
      state.items.push(val)
    },
    _RESET_ITEMS(state, val) {
      state.items = val
    },
    _SET_START_LIST(state, val) {
      state.startList = val
    },
    _SET_START_LIST_HEADERS(state, val) {
      state.startListHeaders = val
    },
    _SET_READ_DELAY(state, val) {
      state.readDelay = val
    },
    _SET_SOUND(state, val) {
      state.sound = val
    },
    _SET_HOSTNAME(state, val) {
      state.hostname = val
    },
    _SET_SERIAL_PORT(state, val) {
      state.serial = val
    },
    _SET_INVENTORY_STATUS(state, val) {
      state.inventory = val
    },
    _SET_EVENTS_SPLITS_HOSTS(state, val) {
      state.eventsSplitsHosts = val;
    },
    _SET_RACE(state, val) {
      state.race = val
    },
    _SET_STATUS(state, val) {
      state.status[val.desc] = val.value
    },
    _SET_TAG(state, val) {
      state.tags = val
    },
    _SET_CURRENT_TAGS(state, val) {
      state.currentTags = val
    },
    _START_SOCKET(state, val) {
      state.start = val
    },
  },
  actions: {
    async _set_race(context, val) {
      let params = {
        otp: val
      };

      try {
        let response = await axios.get("/v1/get-race-id", {
          params
        });
        let race = response.data.data;
        if (race) {
          race = {
            ID: race.ID,
            name: race.post_title,
            stream: race.stream
          }
          context.commit("_SET_RACE", race);
          window.ipc.send("toMain", [
            "set-cookies",
            "race",
            JSON.stringify(race),
          ]);

          socket.emit("check-status");

          // obtener todos los eventos de la carrera (generales)
          await context.dispatch("_get_events");

          // hasierako atleta guztien excela montatu
          await context.dispatch("_get_participants");

          // Obtener los cronos iniciales de la/s carrera/s
          await context.dispatch("_get_cronos");

          // Ordenagailu honentzako splitak ekarri
          await context.dispatch("_get_current_pc_splits");

          return true;
        }

      } catch (error) {

      }

    },
    async _get_events(context) {
      let race = context.state.race;
      if (!race) return;

      let params = {
        id: race.ID
      };
      let response = await axios.get("/v1/get-race", {
        params
      });

      let events = response.data.data;
      events.forEach((event) => {
        event['start'] = null;
      });
      context.commit("_SET_EVENTS", events);

      context.commit("_SET_STATUS", {
        desc: "wp",
        value: true,
      });

    },
    async _get_cronos(context) {
      let race = context.state.race;
      if (!race) return;
      let params = {
        id: race.ID
      };
      let starts = await axios.get(
        "/v1/get-starts", {
          params
        }
      );

      starts = starts.data.data;
      let events = context.state.events;
      events.map((res) => {
        starts.forEach((start) => {
          if (start.unique_id == res.unique_id) {
            res.start = start.start;
          }
        });
      });

      context.commit("_SET_EVENTS", events);
      window.ipc.send("toMain", ["start-time", JSON.stringify(events)]);
    },
    async _get_current_pc_splits(context) {
      let race = context.state.race;
      if (!race) return;

      let params = {
        id: race.ID
      };

      await axios
        .get("/v1/get-split", {
          params
        })
        .then((response) => {
          let resp = response.data.data;

          let splits = [];
          if (resp != '') splits = resp;
          context.commit("_SET_SELECTED_SPLITS", splits);

        });

      context.dispatch('_mountEventsSplitsHosts');

    },
    async _mountEventsSplitsHosts(context) {
      // crear objeto con todos los datos: eventos, splits, hosts, porcentages...

      let final = [];
      context.state.events.forEach((e, index) => {
        final.push({
          name: e.name,
          distance: e.distance,
          start_date: e.start_date,
          unique_id: e.unique_id,
          splits: [],
        });

        e.splits.forEach((s, splitIndex) => {
          final[index].splits.push({
            active: false,
            name: s.name,
            unique_id: s.unique_id,
            percent: 0,
            hosts: [],
          });
          context.state.selectedSplits.forEach((sel) => {
            if (sel.group == s.unique_id) {

              sel.items.forEach((host) => {
                if (context.state.hostname == host)
                  final[index].splits[splitIndex].active = true;

                final[index].splits[splitIndex].hosts.push(host);
              });
            }
          });
        });
      });

      context.commit('_SET_EVENTS_SPLITS_HOSTS', final);
    },
    async _get_participants(context) {
      let race = context.state.race;
      if (!race) return;
      let params = {
        post_id: race.ID
      };

      try {
        let response = await axios.get("/v1/get-drive", {
          params
        })

        if (!response.data.success) return response;

        context.commit("_SET_STATUS", {
          desc: "drive",
          value: true,
        });

        let participants = response.data.data.resultados;
        let events = context.state.events;


        window.ipc.send("toMain", [
          "start-list",
          JSON.stringify(participants),
          JSON.stringify(events),
        ]);

        return response;
      } catch (err) {
        return err;
      }

    },
    async _assocEventsSplits(context, {
      data1,
      data2
    }) {

      let events = context.state.events;
      if (events) {
        events.forEach((event) => {
          data1.map((res) => {
            if (toSlug(event.name) == toSlug(res.event)) {
              res.event = event;
            }
          });
        });
      }

      context.commit("_SET_START_LIST_HEADERS", data2);
      context.commit("_SET_START_LIST", data1);
    },
    async _getCloudData(context, checkStatus = true) {

      if (checkStatus) {
        const status = ["wp", "socket", "drive", "mongo"];
        status.forEach((res) => {
          context.commit("_SET_STATUS", {
            desc: res,
            value: false,
          });
        });
        socket.emit("check-status");
      }

      const check_wp = await axios.get("/v1/check")
      if (check_wp.data.success) {
        context.commit("_SET_STATUS", {
          desc: "wp",
          value: true,
        });
      }

      // obtener todos los eventos de la carrera (generales)
      await context.dispatch("_get_events");

      // hasierako atleta guztien excela montatu
      await context.dispatch("_get_participants");

      // Obtener los cronos iniciales de la/s carrera/s
      await context.dispatch("_get_cronos");

      // Ordenagailu honentzako splitak ekarri
      await context.dispatch("_get_current_pc_splits");
    }

  },
  getters: {
    canInventory(state) {
      let active = false;
      if (state.connected) {
        state.connected.forEach(res => {
          if (res.active) active = true;
        })
      }
      return active;
    },
    getItems(state) {
      return state.items;
    }
  },
  modules: {}
})