<template>
  <canvas class="d-block" ref="hScroll" :width="scaledWidth" :height="scaledHeight" />
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  props: {
    width: {
      type: Number,
      default: 5
    },
    height: {
      type: Number,
      default: 10
    },
    x: {
      type: Number,
      default: 0
    },
    cellWidth: {
      type: Number,
      default: 10
    }
  },
  data: function () {
    return {
      scaledWidth: 5,
      scaledHeight: 10
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeCols',
      'storeDatasetId',
      'storeDarkMode'
    ])
  },
  watch: {
    x: function () {
      this.draw()
    },
    width: function () {
      this.reset()
    },
    height: function () {
      this.reset()
    },
    cellWidth: function () {
      this.reset()
    },
    storeDatasetId: function () {
      this.reset()
    },
    storeDarkMode: function () {
      this.draw()
    }
  },
  methods: {
    draw: function () {
      if (!this.ctx) {
        return
      }

      this.ctx.clearRect(0, 0, this.width, this.height)

      // Compute the height of the scrollbar handle. At least 10 pixels.
      const w = Math.max(10, this.width / (this.storeCols * this.cellWidth) * this.width)

      // Calculate the y position based on the origin and the overall width.
      const x = Math.abs(-this.x / (this.storeCols * this.cellWidth) * this.width)

      // Background color
      this.ctx.fillStyle = this.storeDarkMode ? '#8e8c84' : '#f2f2f2'
      this.ctx.fillRect(0, 0, this.width, this.height)
      // Draw the handle
      this.ctx.fillStyle = this.storeDarkMode ? '#f2f2f2' : '#8e8c84'
      this.ctx.fillRect(x, 0, w, this.height)
    },
    reset: function () {
      const scale = window.devicePixelRatio
      const hsc = this.$refs.hScroll
      hsc.width = this.scaledWidth
      hsc.height = this.scaledHeight
      this.scaledWidth = this.width * window.devicePixelRatio
      this.scaledHeight = this.height * window.devicePixelRatio

      hsc.style.height = this.height + 'px'
      hsc.style.width = this.width + 'px'

      this.ctx = hsc.getContext('2d')
      this.ctx.scale(scale, scale)

      this.$nextTick(() => {
        this.draw()
      })
    }
  },
  mounted: function () {
    this.$nextTick(() => this.reset())
  }
}
</script>

<style>

</style>
