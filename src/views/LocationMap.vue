<template>
  <b-row class="location-map">
    <LMap :zoom="3" :bounds="bounds" ref="locationMap">
      <!-- Draw a polygon connecting all markers -->
      <LPolygon :lat-lngs="corners" v-if="corners" :fillOpacity="0.1" />
      <!-- Data points -->
      <LMarker v-for="(location, index) in locations" :key="`map-location-${index}`" :lat-lng="location" />
      <!-- Grid lines -->
      <LPolyline v-for="(line, index) in gridLines" :key="`grid-line-${index}`" :lat-lngs="line" :weight="1" />
    </LMap>
  </b-row>
</template>

<script>
import { LMap, LMarker, LPolygon, LPolyline } from 'vue2-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const fixPer = require('fix-perspective')

export default {
  computed: {
    corners: function () {
      if (this.dataset && this.dataset.cornerPoints && this.dataset.cornerPoints.length === 4) {
        // Convert locations to latLngs
        return this.dataset.cornerPoints.map(l => L.latLng(l[0], l[1]))
      } else {
        return null
      }
    },
    locations: function () {
      let locs = []

      if (this.dataset && this.dataset.data) {
        this.dataset.data.forEach(row => {
          Object.keys(row).forEach(key => {
            const col = row[key]

            if (col.geolocation) {
              locs.push(L.latLng(col.geolocation.lat, col.geolocation.lng))
            }
          })
        })
      }

      return locs
    },
    reverseProjection: function () {
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
    },
    gridLines: function () {
      let lines = []
      if (this.reverseProjection) {
        for (let x = 1; x < this.dataset.cols; x++) {
          const start = this.reverseProjection((100.0 / this.dataset.cols) * x, 0)
          const end = this.reverseProjection((100.0 / this.dataset.cols) * x, 100)
          if (!isNaN(start.x) && !isNaN(start.y) && !isNaN(end.x) && !isNaN(end.y)) {
            lines.push([L.latLng(start.x, start.y), L.latLng(end.x, end.y)])
          }
        }
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
    bounds: function () {
      let b = L.latLngBounds()

      if (this.locations) {
        this.locations.forEach(l => b.extend(l))
      }
      if (this.dataset.cornerPoints) {
        this.dataset.cornerPoints.forEach(c => b.extend(L.latLng(c[0], c[1])))
      }

      if (b.isValid()) {
        return b.pad(0.1)
      } else {
        return null
      }
    }
  },
  components: {
    LMap,
    LMarker,
    LPolygon,
    LPolyline
  },
  mounted: function () {
    // Add OSM as the default
    const openstreetmap = L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      id: 'OpenStreetMap',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c']
    })

    const map = this.$refs.locationMap.mapObject
    map.addLayer(openstreetmap)

    // Add an additional satellite layer
    const satellite = L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      id: 'Esri WorldImagery',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    })

    const baseMaps = {
      'OpenStreetMap': openstreetmap,
      'Esri WorldImagery': satellite
    }

    L.control.layers(baseMaps).addTo(map)
  }
}
</script>

<style>
.location-map {
  height: 100vh;
}
</style>
