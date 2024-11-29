import {
  createStore
} from 'vuex'

import axios from 'axios'

export default createStore({
  state: {
    _auth: null,
    connected: null,
    startChrono: false,
    startTime: null,
    startList: [],
    items: [],
    hostname: null,
    inventory: false,
    readDelay: 5, //seconds
    serial: null,
    race: null,
    events: [],
    selectedSplits: [],
    eventsSplitsHosts: null,
  },
  mutations: {
    _AUTH(state, val) {
      state._auth = val
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
    _SET_READ_DELAY(state, val) {
      state.readDelay = val
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
    }
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
            name: race.post_title
          }

          context.commit("_SET_RACE", race);
          window.ipc.send("toMain", [
            "set-cookies",
            "race",
            JSON.stringify(race),
          ]);


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

        console.log('errorea', error);
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
          console.log(splits)

          
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

      console.log(final)

      context.commit('_SET_EVENTS_SPLITS_HOSTS', final);
    },
    async _get_participants(context) {
      let race = context.state.race;
      if (!race) return;
      let params = {
        id: race.ID
      };

      let events = context.state.events;
      axios
        .get("/v1/resultados", {
          params
        })
        .then((response) => {
          if (events) {
            events.forEach((split) => {
              response.data.data.resultados.map((res) => {
                if (split.name == res[4]) {
                  res[4] = split;
                }
              });
            });
          }

          response.data.data.resultados.splice(0, 1)

          context.commit("_SET_START_LIST", response.data.data.resultados);
          window.ipc.send("toMain", [
            "start-list",
            JSON.stringify(response.data.data.resultados),
          ]);
        });
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