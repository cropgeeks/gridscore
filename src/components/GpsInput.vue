<template>
  <b-input-group>
    <!-- Latitude and longitude inputs. Min, max and stepsize set -->
    <b-input :placeholder="$t('formPlaceholderLatitude')" number :min="-90" :max="90" :step="0.001" type="number" v-model="latitude" />
    <b-input :placeholder="$t('formPlaceholderLongitude')" number :min="-180" :max="180" :step="0.001" type="number" v-model="longitude" />

    <b-input-group-append>
      <!-- Button that sets user's current position -->
      <b-button @click="setGps">📍</b-button>
    </b-input-group-append>
  </b-input-group>
</template>

<script>
export default {
  props: {
    currentPosition: {
      type: Array,
      default: () => [null, null]
    },
    geolocation: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      latitude: null,
      longitude: null
    }
  },
  watch: {
    currentPosition: function () {
      this.updateCurrentPosition()
    },
    latitude: function () {
      // Notify parent
      if (this.latitude && this.longitude && !isNaN(this.latitude) && !isNaN(this.longitude)) {
        this.$emit('location-changed', [parseFloat(this.latitude), parseFloat(this.longitude)])
      }
    },
    longitude: function () {
      // Notify parent
      if (this.latitude && this.longitude && !isNaN(this.latitude) && !isNaN(this.longitude)) {
        this.$emit('location-changed', [parseFloat(this.latitude), parseFloat(this.longitude)])
      }
    }
  },
  methods: {
    setGps: function () {
      if (this.geolocation) {
        this.latitude = this.geolocation.lat
        this.longitude = this.geolocation.lng
      }
    },
    updateCurrentPosition: function () {
      if (this.currentPosition) {
        this.latitude = this.currentPosition[0]
        this.longitude = this.currentPosition[1]
      }
    }
  },
  mounted: function () {
    this.updateCurrentPosition()
  }
}
</script>

<style>

</style>
