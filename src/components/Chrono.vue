<template>
  <div class="chrono-div">
    <div class="chrono">{{ clock }}</div>
  </div>
</template>

<script>
//https://codepen.io/raphael_octau/pen/XxeqRJ
import moment from "moment-timezone";
export default {
  name: "ChronoComponent",
  props: ["time"],
  data() {
    return {
      timeBegan: null,
      timeStopped: null,
      stoppedDuration: 0,
      started: null,
      running: false,
      clock: "00:00:00",
    };
  },
  watch: {
    time(val) {
      if (val) {
        this.reset();
        this.start(val);
      } else this.reset();
    },
  },
  methods: {
    start(val) {
      if (this.running) return;

      if (this.timeBegan === null) {
        this.reset();
        this.timeBegan = moment
          .unix(parseInt(val))
          .tz("Europe/Madrid")
          .format("YYYY-MM-DD HH:mm:ss");
        console.log(this.timeBegan);
        this.timeBegan = new Date(this.timeBegan);
      }

      if (this.timeStopped !== null) {
        this.stoppedDuration += new Date() - this.timeStopped;
      }

      this.started = setInterval(this.clockRunning, 10);
      this.running = true;
    },

    stop() {
      this.running = false;
      this.timeStopped = new Date();
      clearInterval(this.started);
    },

    reset() {
      this.running = false;
      clearInterval(this.started);
      this.stoppedDuration = 0;
      this.timeBegan = null;
      this.timeStopped = null;
      this.clock = "00:00:00"; //00:00:00.00
    },

    clockRunning() {
      var currentTime = new Date(),
        timeElapsed = new Date(
          currentTime - this.timeBegan - this.stoppedDuration
        ),
        hour = timeElapsed.getUTCHours(),
        min = timeElapsed.getUTCMinutes(),
        sec = timeElapsed.getUTCSeconds();
      //ms = Math.round(timeElapsed.getUTCMilliseconds() / 10);

      this.clock =
        this.zeroPrefix(hour, 2) +
        ":" +
        this.zeroPrefix(min, 2) +
        ":" +
        this.zeroPrefix(sec, 2);
    },

    zeroPrefix(num, digit) {
      var zero = "";
      for (var i = 0; i < digit; i++) {
        zero += "0";
      }
      return (zero + num).slice(-digit);
    },
  },
};
</script>

<style lang="scss">
@font-face {
  font-family: "DS-Digital";
  src: url("../assets/fonts/DS-Digital-Bold.woff2") format("woff2"),
    url("../assets/fonts/DS-Digital-Bold.woff") format("woff");
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "DS-Digital";
  src: url("../assets/fonts/DS-Digital.woff2") format("woff2"),
    url("../assets/fonts/DS-Digital.woff") format("woff");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

$digital: "DS-Digital";

.chrono-div {
  display: flex;
  align-items: center;
}

.chrono {
  font-size: 22px;
}
</style>
