<template>
  <div class="field-map">
    <LMap :zoom="3" ref="fieldMap">
      <!-- Draw a polygon connecting all markers -->
      <LPolygon :lat-lngs="markers" v-if="markers" :fillOpacity="0.1" />
      <!-- Show current position as a marker -->
      <LMarker v-if="position" :lat-lng="position" />
      <!-- Grid lines -->
      <LPolyline v-for="(line, index) in gridLines" :key="`grid-line-${index}`" :lat-lngs="line" :weight="1" />
    </LMap>
  </div>
</template>

<script>
import { LMap, LMarker, LPolygon, LPolyline } from 'vue2-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const fixPer = require('fix-perspective')

export default {
  props: {
    locations: {
      type: Array,
      default: () => null
    },
    position: {
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
  computed: {
    markers: function () {
      if (this.locations) {
        // Convert locations to latLngs
        return this.locations.filter(l => l !== null).map(l => L.latLng(l[0], l[1]))
      } else {
        return null
      }
    },
    reverseProjection: function () {
      const to = this.locations.filter(l => l !== null).map(l => { return { x: l[0], y: l[1] } })

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
    },
    gridLines: function () {
      let lines = []
      if (this.reverseProjection) {
        for (let x = 1; x < this.cols; x++) {
          const start = this.reverseProjection((100.0 / this.cols) * x, 0)
          const end = this.reverseProjection((100.0 / this.cols) * x, 100)
          if (!isNaN(start.x) && !isNaN(start.y) && !isNaN(end.x) && !isNaN(end.y)) {
            lines.push([L.latLng(start.x, start.y), L.latLng(end.x, end.y)])
          }
        }
        for (let y = 1; y < this.rows; y++) {
          const start = this.reverseProjection(0, (100.0 / this.rows) * y)
          const end = this.reverseProjection(100, (100.0 / this.rows) * y)
          if (!isNaN(start.x) && !isNaN(start.y) && !isNaN(end.x) && !isNaN(end.y)) {
            lines.push([L.latLng(start.x, start.y), L.latLng(end.x, end.y)])
          }
        }
      }
      return lines
    }
  },
  watch: {
    locations: {
      deep: true,
      handler: function (newValue) {
        if (newValue) {
          this.updateMarkers()
          this.updateBounds()
        }
      }
    }
  },
  components: {
    LMap,
    LMarker,
    LPolygon,
    LPolyline
  },
  methods: {
    updateMarkers: function () {
    },
    updateBounds: function () {
      // Calculate bounds around all locations
      var bounds = L.latLngBounds()
      this.locations.filter(l => l !== null).forEach(l => bounds.extend(l))
      // If the bounds are valid, move the map
      if (bounds.isValid()) {
        this.$refs.fieldMap.fitBounds(bounds.pad(0.1))
      } else if (bounds.getCenter()) {
        this.$refs.fieldMap.panTo(bounds.getCenter())
      }
    },
    invalidateSize: function () {
      this.$nextTick(() => {
        // Invalidate the map and update markers and bounds
        this.$refs.fieldMap.mapObject.invalidateSize()
        this.updateMarkers()
        this.updateBounds()
      })
    }
  },
  mounted: function () {
    // Add OSM as the default
    var openstreetmap = L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      id: 'OpenStreetMap',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c']
    })

    var map = this.$refs.fieldMap.mapObject
    map.addLayer(openstreetmap)

    // Add an additional satellite layer
    var satellite = L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      id: 'Esri WorldImagery',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    })

    var baseMaps = {
      'OpenStreetMap': openstreetmap,
      'Esri WorldImagery': satellite
    }

    L.control.layers(baseMaps).addTo(map)
  }
}
</script>

<style>
.field-map {
  height: 300px !important;
}
</style>
