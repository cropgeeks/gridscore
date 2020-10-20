<template>
  <div>
    <span class="text-info">{{ $t('pageFieldLayoutText') }}</span>
    <b-row>
      <b-col cols=6>
        <b-form-group :label="$t('formLabelFieldLayoutRowCol', { row: 1, col: 1 })" label-for="top-left">
          <!-- Top left corner -->
          <GpsInput :currentPosition="locations[3]" :geolocation="geolocation" @location-changed="location => updateLocation(3, location)" id="top-left" />
        </b-form-group>
        <b-form-group :label="$t('formLabelFieldLayoutRowCol', { row: rows, col: 1 })" label-for="bottom-left">
          <!-- Bottom left corner -->
          <GpsInput :currentPosition="locations[0]" :geolocation="geolocation" @location-changed="location => updateLocation(0, location)" id="bottom-left" />
        </b-form-group>
      </b-col>
      <b-col cols=6>
        <b-form-group :label="$t('formLabelFieldLayoutRowCol', { row: 1, col: cols })" label-for="top-right">
          <!-- Top right corner -->
          <GpsInput :currentPosition="locations[2]" :geolocation="geolocation" @location-changed="location => updateLocation(2, location)" id="top-right" />
        </b-form-group>
        <b-form-group :label="$t('formLabelFieldLayoutRowCol', { row: rows, col: cols })" label-for="bottom-right">
          <!-- Bottom right corner -->
          <GpsInput :currentPosition="locations[1]" :geolocation="geolocation" @location-changed="location => updateLocation(1, location)" id="bottom-right" />
        </b-form-group>
      </b-col>
    </b-row>
    <!-- Map showing the corner points and user position -->
    <Map :locations="locations" :rows="rows" :cols="cols" :position="geolocation" ref="map" />
  </div>
</template>

<script>
import Vue from 'vue'

import GpsInput from '@/components/GpsInput'
import Map from '@/components/Map'

export default {
  data: function () {
    return {
      locations: [null, null, null, null]
    }
  },
  props: {
    geolocation: {
      type: Object,
      default: () => null
    },
    rows: {
      type: Number,
      default: 1
    },
    cols: {
      type: Number,
      default: 1
    }
  },
  watch: {
    'dataset.cornerPoints': function (newValue) {
      this.refresh()
    }
  },
  components: {
    GpsInput,
    Map
  },
  methods: {
    updateLocation: function (index, location) {
      Vue.set(this.locations, index, location)
    },
    invalidateSize: function () {
      this.$nextTick(() => this.$refs.map.invalidateSize())
    },
    getCornerPoints: function () {
      return this.locations
    },
    refresh: function () {
      if (this.dataset && this.dataset.cornerPoints && this.dataset.cornerPoints.length === 4) {
        this.locations = this.dataset.cornerPoints.map(l => [l[0], l[1]])
      }
    }
  },
  mounted: function () {
    this.refresh()
  }
}
</script>

<style>

</style>
