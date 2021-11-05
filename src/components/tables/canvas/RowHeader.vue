<template>
  <canvas class="cell d-block" ref="rowCanvas" :width="scaledWidth" :height="scaledHeight" />
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
    },
    markedRows: {
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
      'storeDarkMode',
      'storeRows',
      'storeInvertNumberingY',
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
    markedRows: function () {
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

      const minRow = Math.max(0, Math.floor(Math.abs(this.y) / this.cellHeight))
      const maxRow = Math.min(minRow + Math.ceil(this.height / this.cellHeight) + 1, this.storeRows)

      for (let row = minRow; row < maxRow; row++) {
        this.updateRowHeader(row)
      }
    },
    updateRowHeader: function (row) {
      if (this.markedRows && this.markedRows[row]) {
        this.ctx.fillStyle = this.fillStyleMarked
      } else if (row % 2 === 0) {
        this.ctx.fillStyle = this.fillStyleLightGray
      } else {
        this.ctx.fillStyle = this.fillStyleWhite
      }

      const x = 0
      const y = this.y + this.cellHeight * row

      this.ctx.fillRect(x, y, this.width, this.cellHeight)
      this.ctx.fillStyle = this.fillStyleText
      this.ctx.fillText(this.storeInvertNumberingY ? (this.storeRows - row) : (row + 1), x + this.padding, y + this.cellHeight / 2)

      if (this.traitStats) {
        const padding = 4
        const height = this.cellHeight - 2 * padding
        const barHeight = (height - (this.storeTraits.length - 1) * padding / 2) / this.storeTraits.length

        for (let trait = 0; trait < this.storeTraits.length; trait++) {
          const by = padding + y + trait * (barHeight + padding / 2)
          const value = this.traitStats[this.storeTraits[trait].name].rows[row].count / this.traitStats[this.storeTraits[trait].name].rows[row].total * this.statsSize
          this.ctx.fillStyle = this.storeTraitColors ? this.storeTraitColors[trait % this.storeTraitColors.length] : this.fillStyleHiddenTrait
          this.ctx.fillRect(this.width - value, by, this.width, barHeight)
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
        const rc = this.$refs.rowCanvas
        rc.width = this.scaledWidth
        rc.height = this.scaledHeight

        this.$nextTick(() => {
          rc.style.height = this.height + 'px'
          rc.style.width = this.width + 'px'

          this.ctx = rc.getContext('2d')
          this.ctx.scale(scale, scale)
          this.ctx.textBaseline = 'middle'
          this.ctx.textAlign = 'center'
          this.ctx.font = `${this.fontSize}px sans-serif`
          this.ctx.lineWidth = 1

          rc.onclick = this.onRowHeaderClicked

          this.draw()
          this.resizeRunning = false
        })
      })
    },
    onRowHeaderClicked: function (e) {
      const ev = this.getTouchPosition(e)
      const row = Math.floor((-this.y + ev.y) / this.cellHeight)

      if (row >= 0 && row < this.storeRows) {
        this.$emit('row-marked', row)

        this.updateRowHeader(row)
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
