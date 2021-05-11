<template>
  <canvas class="d-block" ref="vScroll" :width="scaledWidth" :height="scaledHeight" />
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
    y: {
      type: Number,
      default: 0
    },
    cellHeight: {
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
      'storeRows'
    ])
  },
  watch: {
    y: function () {
      this.draw()
    },
    width: function () {
      this.reset()
    },
    height: function () {
      this.reset()
    },
    cellHeight: function () {
      this.reset()
    },
    storeDatasetId: function () {
      this.reset()
    }
  },
  methods: {
    draw: function () {
      if (!this.ctx) {
        return
      }

      this.ctx.clearRect(0, 0, this.width, this.height)

      // Compute the height of the scrollbar handle. At least 10 pixels.
      const h = Math.max(10, Math.round(this.height / (this.storeRows * this.cellHeight) * this.height))

      // Calculate the y position based on the origin and the overall height.
      const y = Math.round(Math.abs(-this.y / (this.storeRows * this.cellHeight) * this.height))

      // Background color
      this.ctx.fillStyle = '#f2f2f2'
      this.ctx.fillRect(0, 0, this.width, this.height)
      // Draw the handle
      this.ctx.fillStyle = '#8e8c84'
      this.ctx.fillRect(0, y, this.width, h)
    },
    reset: function () {
      const scale = window.devicePixelRatio
      const vsc = this.$refs.vScroll
      vsc.width = this.scaledWidth
      vsc.height = this.scaledHeight
      this.scaledWidth = this.width * window.devicePixelRatio
      this.scaledHeight = this.height * window.devicePixelRatio

      vsc.style.height = this.height + 'px'
      vsc.style.width = this.width + 'px'

      this.ctx = vsc.getContext('2d')
      this.ctx.scale(scale, scale)

      this.draw()
    }
  },
  mounted: function () {
    this.$nextTick(() => this.reset())
  }
}
</script>

<style>

</style>
