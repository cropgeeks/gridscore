<template>
  <div>
    <span class="text-info">{{ $t('pageFieldLayoutText') }}</span>
    <b-row>
      <b-col cols=6>
        <b-form-group :label="$t('formLabelFieldLayoutRowCol', { row: 1, col: 1 })" label-for="top-left">
          <!-- Top left corner -->
          <GpsInput :currentPosition="locations[3]" @location-changed="location => updateLocation(3, location)" id="top-left" />
        </b-form-group>
        <b-form-group :label="$t('formLabelFieldLayoutRowCol', { row: rows, col: 1 })" label-for="bottom-left">
          <!-- Bottom left corner -->
          <GpsInput :currentPosition="locations[0]" @location-changed="location => updateLocation(0, location)" id="bottom-left" />
        </b-form-group>
      </b-col>
      <b-col cols=6>
        <b-form-group :label="$t('formLabelFieldLayoutRowCol', { row: 1, col: cols })" label-for="top-right">
          <!-- Top right corner -->
          <GpsInput :currentPosition="locations[2]" @location-changed="location => updateLocation(2, location)" id="top-right" />
        </b-form-group>
        <b-form-group :label="$t('formLabelFieldLayoutRowCol', { row: rows, col: cols })" label-for="bottom-right">
          <!-- Bottom right corner -->
          <GpsInput :currentPosition="locations[1]" @location-changed="location => updateLocation(1, location)" id="bottom-right" />
        </b-form-group>
      </b-col>
    </b-row>
    <!-- Map showing the corner points and user position -->
    <MapComponent :locations="locations" :rows="rows" :cols="cols" @set-corner="updateLocationLatLng" ref="map" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Vue from 'vue'

import GpsInput from '@/components/GpsInput'
import MapComponent from '@/components/MapComponent'

/**
 * Shows the field layout corner points selection components as well as the map
 */
export default {
  data: function () {
    return {
      locations: [null, null, null, null]
    }
  },
  props: {
    /** The number of rows the field has */
    rows: {
      type: Number,
      default: 1
    },
    /** The number of columns the field has */
    cols: {
      type: Number,
      default: 1
    },
    useCurrentDataset: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeCornerPoints'
    ])
  },
  watch: {
    storeCornerPoints: function () {
      // Watch changes to the dataset's corner points
      this.refresh()
    }
  },
  components: {
    GpsInput,
    MapComponent
  },
  methods: {
    /**
     * Sets the new field corner location
     * @param index The index of the field corner in the array
     * @param location The new location as a leaflet LatLng
     */
    updateLocationLatLng: function (update) {
      Vue.set(this.locations, update.corner, [update.location.lat, update.location.lng])
    },
    /**
     * Sets the new field corner location
     * @param index The index of the field corner in the array
     * @param location The new location
     */
    updateLocation: function (index, location) {
      Vue.set(this.locations, index, location)
    },
    /**
     * Invalidates the map size on uncollapsing of the collapse element to fix display issues
     */
    invalidateSize: function () {
      this.$nextTick(() => this.$refs.map.invalidateSize())
    },
    /**
     * Returns the selected corner points
     */
    getCornerPoints: function () {
      return this.locations
    },
    setCornerPoints: function (cornerPoints) {
      this.locations = cornerPoints
    },
    /**
     * Refreshes the local variables based on the dataset corner points
     */
    refresh: function () {
      if (this.useCurrentDataset && this.storeCornerPoints && this.storeCornerPoints.length === 4) {
        this.locations = this.storeCornerPoints.map(l => [l[0], l[1]])
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
