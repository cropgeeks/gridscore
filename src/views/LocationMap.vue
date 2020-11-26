<template>
  <div>
    <h1>{{ $t('pageLocationsTitle') }}</h1>
    <p>{{ $t('pageLocationsText') }}</p>
    <b-row class="location-map">
      <LMap :zoom="3" :bounds="bounds" ref="locationMap" @ready="loadMap">
        <!-- Draw a polygon connecting all markers -->
        <LPolygon :lat-lngs="corners" v-if="corners" :fillOpacity="0.1" />
        <!-- Grid lines -->
        <LPolyline v-for="(line, index) in gridLines" :key="`grid-line-${index}`" :lat-lngs="line" :weight="1" />
        <LControl>
          <b-button v-b-tooltip="$t('tooltipDefineFieldLayout')" variant="light" @click="$refs.fieldLayoutModal.show()"><BIconBoundingBox /></b-button>
        </LControl>
        <LMarker v-if="geolocation" :latLng="geolocation">
          <LIcon :icon-anchor="[20, 40]">
            <BIconGeoFill variant="danger" :style="{ width: '40px', height: '40px'}" />
          </LIcon>
        </LMarker>
      </LMap>
      <!-- Popup content -->
      <div v-if="selectedLocation" ref="popupContent">
        <h4>{{ selectedLocation.name }}</h4>
        <b-badge class="text-white" target="_blank" :href="`https://www.google.com/maps/place/${selectedLocation.geolocation.lat},${selectedLocation.geolocation.lng}/@${selectedLocation.geolocation.lat},${selectedLocation.geolocation.lng},14z`" v-if="selectedLocation.geolocation"><BIconGeoAlt /> {{ selectedLocation.geolocation.lat.toFixed(4) }}; {{ selectedLocation.geolocation.lng.toFixed(4) }}</b-badge>
        <hr />
        <div v-for="(trait, index) in Object.keys(selectedLocationData)" :key="`selected-location-trait-${index}`">
          <h5>{{ trait }}</h5>
          <dl class="row">
            <dt class="col-6 text-muted"><span>{{ selectedLocationData[trait].value }}</span></dt>
            <dd class="col-6 text-right"><b-badge><BIconCalendar3 /> {{ selectedLocationData[trait].date }}</b-badge></dd>
          </dl>
        </div>
      </div>
      <FieldLayoutModal ref="fieldLayoutModal" />
    </b-row>
  </div>
</template>

<script>
import FieldLayoutModal from '@/components/modals/FieldLayoutModal'

import { BIconBoundingBox, BIconCalendar3, BIconGeoAlt, BIconGeoFill } from 'bootstrap-vue'
import { LMap, LControl, LPolygon, LPolyline, LMarker, LIcon } from 'vue2-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const fixPer = require('fix-perspective')

export default {
  components: {
    BIconBoundingBox,
    BIconCalendar3,
    BIconGeoAlt,
    BIconGeoFill,
    FieldLayoutModal,
    LControl,
    LMap,
    LMarker,
    LPolygon,
    LPolyline,
    LIcon
  },
  data: function () {
    return {
      selectedLocation: null
    }
  },
  computed: {
    selectedLocationData: function () {
      let result = {}

      this.dataset.traits.forEach((t, i) => {
        if (this.selectedLocation.values[i] !== null) {
          result[t.name] = {
            value: this.selectedLocation.values[i],
            date: this.selectedLocation.dates[i]
          }
        }
      })

      return result
    },
    /** The corner points of the field */
    corners: function () {
      if (this.dataset && this.dataset.cornerPoints && this.dataset.cornerPoints.length === 4) {
        // Convert locations to latLngs
        return this.dataset.cornerPoints.filter(l => l !== null).map(l => L.latLng(l[0], l[1]))
      } else {
        return null
      }
    },
    // The data recordig locations
    locations: function () {
      let locs = []

      if (this.dataset && this.dataset.data) {
        this.dataset.data.forEach(row => {
          row.forEach(c => {
            if (c.geolocation) {
              locs.push(L.latLng(c.geolocation.lat, c.geolocation.lng))
            }
          })
        })
      }

      return locs
    },
    /** The reversed perspective projection used to draw the lines */
    reverseProjection: function () {
      if (this.dataset.cornerPoints) {
        const to = this.dataset.cornerPoints.filter(l => l !== null).map(l => { return { x: l[0], y: l[1] } })

        if (to.length === 4) {
          const from = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 }
          ]
          return fixPer(from, to)
        } else {
          return null
        }
      } else {
        return null
      }
    },
    /** The grid lines to show on the map */
    gridLines: function () {
      let lines = []
      if (this.reverseProjection) {
        // The vertical lines
        for (let x = 1; x < this.dataset.cols; x++) {
          const start = this.reverseProjection((100.0 / this.dataset.cols) * x, 0)
          const end = this.reverseProjection((100.0 / this.dataset.cols) * x, 100)
          if (!isNaN(start.x) && !isNaN(start.y) && !isNaN(end.x) && !isNaN(end.y)) {
            lines.push([L.latLng(start.x, start.y), L.latLng(end.x, end.y)])
          }
        }
        // The horizontal lines
        for (let y = 1; y < this.dataset.rows; y++) {
          const start = this.reverseProjection(0, (100.0 / this.dataset.rows) * y)
          const end = this.reverseProjection(100, (100.0 / this.dataset.rows) * y)
          if (!isNaN(start.x) && !isNaN(start.y) && !isNaN(end.x) && !isNaN(end.y)) {
            lines.push([L.latLng(start.x, start.y), L.latLng(end.x, end.y)])
          }
        }
      }
      return lines
    },
    /** The bounds of the map */
    bounds: function () {
      let b = L.latLngBounds()

      if (this.locations) {
        this.locations.forEach(l => b.extend(l))
      }
      if (this.dataset.cornerPoints) {
        this.dataset.cornerPoints.filter(l => l !== null).forEach(c => b.extend(L.latLng(c[0], c[1])))
      }
      // if (this.geolocation) {
      //   b.extend(this.geolocation)
      // }

      if (b.isValid()) {
        return b.pad(0.1)
      } else {
        return null
      }
    }
  },
  methods: {
    loadMap: function () {
      // Add OSM as the default
      const openstreetmap = L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        id: 'OpenStreetMap',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 21,
        maxNativeZoom: 19
      })

      const map = this.$refs.locationMap.mapObject
      map.addLayer(openstreetmap)

      // Add an additional satellite layer
      const satellite = L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        id: 'Esri WorldImagery',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 21,
        maxNativeZoom: 19
      })

      const baseMaps = {
        'OpenStreetMap': openstreetmap,
        'Esri WorldImagery': satellite
      }

      L.control.layers(baseMaps).addTo(map)

      this.updateMarkers()
    },
    updateMarkers: function () {
      if (this.dataset && this.dataset.data) {
        const map = this.$refs.locationMap.mapObject
        this.dataset.data.forEach(row => {
          row.forEach(c => {
            if (c.geolocation) {
              let marker = L.marker(L.latLng(c.geolocation.lat, c.geolocation.lng)).bindPopup('')
              marker.on('click', e => {
                let popup = e.target.getPopup()
                this.selectedLocation = c
                // Set the popup content on click
                this.$nextTick(() => popup.setContent(this.$refs.popupContent))
              })
              marker.addTo(map)
            }
          })
        })
      }
    }
  }
}
</script>

<style>
.location-map {
  height: 100vh;
}
.leaflet-popup-content {
  min-width: 200px!important;
}
</style>
