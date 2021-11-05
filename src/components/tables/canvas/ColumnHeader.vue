<template>
  <canvas class="cell d-block" ref="colCanvas" :width="scaledWidth" :height="scaledHeight" />
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
    },
    markedColumns: {
      type: Array,
      default: () => []
    },
    fontSize: {
      type: Number,
      default: 14
    },
    padding: {
      type: Number,
      default: 16
    },
    traitStats: {
      type: Object,
      default: () => null
    },
    statsSize: {
      type: Number,
      default: 25
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
      'storeDarkMode',
      'storeInvertNumberingX',
      'storeTraits',
      'storeTraitColors'
    ]),
    fillStyleMarked: function () {
      return this.storeDarkMode ? '#392d21' : '#c6d2de'
    },
    fillStyleLightGray: function () {
      return this.storeDarkMode ? '#0d0d0d' : '#f2f2f2'
    },
    fillStyleWhite: function () {
      return this.storeDarkMode ? '#000000' : '#ffffff'
    },
    fillStyleHiddenTrait: function () {
      return this.storeDarkMode ? '#2c2c2c' : '#d3d3d3'
    },
    fillStyleText: function () {
      return this.storeDarkMode ? '#ffffff' : '#000000'
    }
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
    markedColumns: function () {
      this.draw()
    },
    padding: function () {
      this.reset()
    },
    fontSize: function () {
      this.reset()
    },
    statsSize: function () {
      this.reset()
    },
    storeDarkMode: function () {
      this.reset()
    }
  },
  methods: {
    draw: function () {
      if (!this.ctx) {
        return
      }

      this.ctx.clearRect(0, 0, this.width, this.height)

      const minCol = Math.max(0, Math.floor(Math.abs(this.x) / this.cellWidth))
      const maxCol = Math.min(minCol + Math.ceil(this.width / this.cellWidth) + 1, this.storeCols)

      for (let col = minCol; col < maxCol; col++) {
        this.updateColumnHeader(col)
      }
    },
    updateColumnHeader: function (col) {
      if (this.markedColumns && this.markedColumns[col]) {
        this.ctx.fillStyle = this.fillStyleMarked
      } else if (col % 2 === 0) {
        this.ctx.fillStyle = this.fillStyleLightGray
      } else {
        this.ctx.fillStyle = this.fillStyleWhite
      }

      const x = this.x + this.cellWidth * col
      const y = 0

      this.ctx.fillRect(x, y, this.cellWidth, this.height)
      this.ctx.fillStyle = this.fillStyleText
      this.ctx.fillText(this.storeInvertNumberingX ? (this.storeCols - col) : (col + 1), x + this.cellWidth / 2, y + this.padding + this.fontSize / 2)

      if (this.traitStats) {
        const padding = 4
        const width = this.cellWidth - 2 * padding
        const barWidth = (width - (this.storeTraits.length - 1) * padding) / this.storeTraits.length

        for (let trait = 0; trait < this.storeTraits.length; trait++) {
          const bx = padding + x + trait * (barWidth + padding)
          const value = this.traitStats[this.storeTraits[trait].name].cols[col].count / this.traitStats[this.storeTraits[trait].name].cols[col].total * this.statsSize
          this.ctx.fillStyle = this.storeTraitColors ? this.storeTraitColors[trait % this.storeTraitColors.length] : this.fillStyleHiddenTrait
          this.ctx.fillRect(bx, this.height - value, barWidth, this.height)
        }
      }
    },
    reset: function () {
      if (this.resizeRunning) {
        return
      }
      this.resizeRunning = true
      const scale = window.devicePixelRatio
      this.scaledWidth = this.width * window.devicePixelRatio
      this.scaledHeight = this.height * window.devicePixelRatio

      this.$nextTick(() => {
        const cc = this.$refs.colCanvas
        cc.width = this.scaledWidth
        cc.height = this.scaledHeight

        this.$nextTick(() => {
          cc.style.height = this.height + 'px'
          cc.style.width = this.width + 'px'

          this.ctx = cc.getContext('2d')
          this.ctx.scale(scale, scale)
          this.ctx.textBaseline = 'middle'
          this.ctx.textAlign = 'center'
          this.ctx.font = `${this.fontSize}px sans-serif`
          this.ctx.lineWidth = 1

          cc.onclick = this.onColHeadClick

          this.draw()
          this.resizeRunning = false
        })
      })
    },
    onColHeadClick: function (e) {
      const ev = this.getTouchPosition(e)
      const col = Math.floor((-this.x + ev.x) / this.cellWidth)

      if (col >= 0 && col < this.storeCols) {
        this.$emit('column-marked', col)

        this.updateColumnHeader(col)
      }
    }
  },
  mounted: function () {
    this.$nextTick(() => this.reset())
  }
}
</script>

<style>

</style>
