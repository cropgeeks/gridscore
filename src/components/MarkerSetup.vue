<template>
  <div>
    <b-form @submit.prevent>
      <b-row>
        <b-col cols=12 sm=6 md=3>
          <b-form-group label-for="markersUse" :label="$t('formLabelMarkersUse')">
            <b-form-checkbox switch v-model="markersUse">
              {{ markersUse ? $t('buttonYes') : $t('buttonNo') }}
            </b-form-checkbox>
          </b-form-group>
        </b-col>
        <b-col cols=12 sm=6 md=3>
          <b-form-group label-for="markersCorner" :label="$t('formLabelMarkersCorner')">
            <b-form-select :options="markerCornerOptions" v-model="markersCorner" :disabled="!markersUse" />
          </b-form-group>
        </b-col>
        <b-col cols=12 sm=6 md=3>
          <b-form-group label-for="markersEveryRow" :label="$t('formLabelMarkersEveryRow')">
            <b-input id="markersEveryRow" v-model.number="markersEveryRow" type="number" :min="1" :max="rows" :disabled="!markersUse" />
          </b-form-group>
        </b-col>
        <b-col cols=12 sm=6 md=3>
          <b-form-group label-for="markersEveryCol" :label="$t('formLabelMarkersEveryCol')">
            <b-input id="markersEveryCol" v-model.number="markersEveryCol" type="number" :min="1" :max="cols" :disabled="!markersUse" />
          </b-form-group>
        </b-col>
      </b-row>
    </b-form>
    <div ref="canvasWrapper" class="canvas-wrapper mh-100">
      <canvas class="cell d-block" ref="canvas" :width="scaledWidth" :height="scaledHeight" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  props: {
    rows: {
      type: Number,
      default: 1
    },
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
    ...mapGetters([
      'storeTraitColors',
      'storeDarkMode',
      'storeMarkers'
    ]),
    markerCornerOptions: function () {
      return [
        { text: this.$t('formSelectMarkersTopLeft'), value: 'topleft' },
        { text: this.$t('formSelectMarkersTopRight'), value: 'topright' },
        { text: this.$t('formSelectMarkersBottomLeft'), value: 'bottomleft' },
        { text: this.$t('formSelectMarkersBottomRight'), value: 'bottomright' }
      ]
    }
  },
  watch: {
    rows: function () {
      this.draw()
    },
    cols: function () {
      this.draw()
    },
    markersCorner: function () {
      this.draw()
    },
    markersEveryCol: function () {
      this.draw()
    },
    markersEveryRow: function () {
      this.draw()
    },
    markersUse: function () {
      this.draw()
    },
    storeDarkMode: function () {
      this.draw()
    }
  },
  data: function () {
    return {
      scaledWidth: 5,
      scaledHeight: 10,
      markersUse: false,
      markersEveryCol: 1,
      markersEveryRow: 1,
      markersCorner: 'topleft'
    }
  },
  methods: {
    getMarkerConfig: function () {
      if (this.markersUse) {
        return {
          corner: this.markersCorner,
          everyCol: this.markersEveryCol,
          everyRow: this.markersEveryRow
        }
      } else {
        return null
      }
    },
    draw: function () {
      if (!this.ctx) {
        return
      }
      if (this.markersEveryCol === '' || this.markersEveryRow === '') {
        return
      }
      if (this.redrawRunning) {
        return
      }
      this.redrawRunning = true

      const dx = Math.max(1, this.markersEveryCol)
      const dy = Math.max(1, this.markersEveryRow)

      this.ctx.clearRect(0, 0, this.width, this.height)
      this.ctx.lineWidth = 1
      this.ctx.strokeStyle = this.storeDarkMode ? 'white' : 'black'

      // Add extra padding, so the circles aren't cut off
      const extraPadding = 6
      // Calculate the actual dimensions of the drawable area
      const drawWidth = this.width - 2 * extraPadding
      const drawHeight = this.height - 2 * extraPadding
      // Calculate the size of each "cell"
      const w = Math.floor(drawWidth / this.cols)
      const h = Math.floor(drawHeight / this.rows)
      // Calculate the padding that's the result of the remainder of the floor division
      const px = (drawWidth - w * this.cols) / 2 + extraPadding
      const py = (drawHeight - h * this.rows) / 2 + extraPadding

      // Draw the vertical lines
      for (let x = 0; x <= this.cols; x++) {
        this.ctx.beginPath()
        this.ctx.moveTo(px + x * w, py)
        this.ctx.lineTo(px + x * w, this.height - py)
        this.ctx.stroke()
      }
      // Draw the horizontal lines
      for (let y = 0; y <= this.rows; y++) {
        this.ctx.beginPath()
        this.ctx.moveTo(px, py + y * h)
        this.ctx.lineTo(this.width - px, py + y * h)
        this.ctx.stroke()
      }

      // If there's nothing to draw, return
      if (w === 0 || h === 0 || !this.markersUse) {
        this.redrawRunning = false
        return
      }

      // Start position
      let x = px
      let y = py
      // While we haven't left the drawing area yet
      while (x <= this.width - px) {
        while (y <= this.height - py) {
          let finalX = x
          let finalY = y

          // Adjust the position based on the starting corner
          switch (this.markersCorner) {
            case 'topright':
              finalX = 2 * px + this.cols * w - x
              break
            case 'bottomleft':
              finalY = 2 * py + this.rows * h - y
              break
            case 'bottomright':
              finalX = 2 * px + this.cols * w - x
              finalY = 2 * py + this.rows * h - y
              break
          }

          // Draw the circle
          this.ctx.fillStyle = this.storeTraitColors[1]
          this.ctx.beginPath()
          this.ctx.arc(finalX, finalY, 6, 0, 2 * Math.PI)
          this.ctx.fill()

          // Increase y
          y += h * dy
        }
        // Increase x
        x += w * dx
        // Reset y
        y = py
      }

      this.redrawRunning = false
    },
    reset: function () {
      if (this.resizeRunning) {
        return
      }

      if (this.useCurrentDataset && this.storeMarkers) {
        this.markersEveryCol = this.storeMarkers.everyCol
        this.markersEveryRow = this.storeMarkers.everyRow
        this.markersCorner = this.storeMarkers.corner
        this.markersUse = true
      }

      this.width = this.$refs.canvasWrapper.offsetWidth
      this.height = this.$refs.canvasWrapper.offsetHeight

      this.resizeRunning = true
      const scale = window.devicePixelRatio
      this.scaledWidth = this.width * window.devicePixelRatio
      this.scaledHeight = this.height * window.devicePixelRatio

      this.$nextTick(() => {
        const cc = this.$refs.canvas
        cc.width = this.scaledWidth
        cc.height = this.scaledHeight

        this.$nextTick(() => {
          cc.style.height = this.height + 'px'
          cc.style.width = this.width + 'px'

          this.ctx = cc.getContext('2d')
          this.ctx.scale(scale, scale)
          this.ctx.lineWidth = 1

          this.draw()
          this.resizeRunning = false
        })
      })
    }
  },
  mounted: function () {
    window.addEventListener('resize', this.reset)

    this.$nextTick(() => this.reset())
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.reset)
  }
}
</script>

<style scoped>
.canvas-wrapper {
  height: 400px;
}
</style>
