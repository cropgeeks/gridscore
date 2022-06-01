<template>
  <div ref="canvasWrapper" class="grid">
    <div />
    <ColumnHeader :width="canvasWidth"
                  :height="columnHeaderHeight"
                  :traitStats="traitStats"
                  :cellWidth="cellWidth"
                  :padding="padding"
                  :statsSize="statsSize"
                  :fontSize="fontSize"
                  :x="origin.x"
                  :markedColumns="markedColumns"
                  ref="colHead"
                  @column-marked="onColumnMarked" />
    <div />
    <RowHeader :width="rowHeaderWidth"
               :height="canvasHeight"
               :traitStats="traitStats"
               :cellHeight="cellHeight"
               :padding="padding"
               :statsSize="statsSize"
               :fontSize="fontSize"
               :y="origin.y"
               :markedRows="markedRows"
               ref="rowHead"
               @row-marked="onRowMarked" />
    <div class="cell d-block position-relative">
      <canvas id="main-canvas" class="position-absolute" ref="dataCanvas" :width="scaledCanvasWidth" :height="scaledCanvasHeight" />
      <canvas id="user-position-canvas" class="position-absolute" ref="userCanvas" :width="scaledCanvasWidth" :height="scaledCanvasHeight" />
    </div>
    <VScroll :height="canvasHeight" :width="vScrollWidth" :y="origin.y" :cellHeight="cellHeight" ref="vScroll" />
    <div />
    <HScroll :height="hScrollHeight" :width="canvasWidth" :x="origin.x" :cellWidth="cellWidth" ref="hScroll" />
    <div />

    <OffscreenCanvas :circleRadius="circleRadius" ref="offscreenCanvas" />
  </div>
</template>

<script>
import ColumnHeader from '@/components/tables/canvas/ColumnHeader'
import HScroll from '@/components/tables/canvas/HScroll'
import RowHeader from '@/components/tables/canvas/RowHeader'
import VScroll from '@/components/tables/canvas/VScroll'
import OffscreenCanvas from '@/components/tables/canvas/OffscreenCanvas'

import { mapGetters } from 'vuex'
const emitter = require('tiny-emitter/instance')

export default {
  components: {
    ColumnHeader,
    HScroll,
    OffscreenCanvas,
    RowHeader,
    VScroll
  },
  props: {
    traitStats: {
      type: Object,
      default: () => null
    },
    /** The current user position in the field, x and y are scaled to 0-100 */
    highlightPosition: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      vScrollWidth: 5,
      hScrollHeight: 5,
      canvasWidth: 10,
      scaledCanvasWidth: 10,
      canvasHeight: 10,
      scaledCanvasHeight: 10,
      circleRadius: 8,
      statsSize: 25,
      padding: 16,
      fontSize: 14,
      drag: false,
      origin: {
        x: 0,
        y: 0
      },
      originStart: {
        x: 0,
        y: 0
      },
      markedColumns: null,
      markedRows: null,
      flingInterval: null,
      followUser: false
    }
  },
  watch: {
    highlightPosition: {
      deep: true,
      handler: function (newValue) {
        // TODO: Only update relevant cell + directly adjacent cells
        if (this.followUser) {
          this.scrollTo(newValue.x, 100 - newValue.y)
        } else {
          this.updateUserPosition()
        }
      }
    },
    traitStats: function () {
      this.reset()
    },
    storeCols: function (newValue) {
      if (newValue) {
        this.markedColumns = Array.from(Array(newValue).keys()).map(i => false)
      } else {
        this.markedColumns = []
      }
    },
    storeRows: function (newValue) {
      if (newValue) {
        this.markedRows = Array.from(Array(newValue).keys()).map(i => false)
      } else {
        this.markedRows = []
      }
    },
    storeVisibleTraits: function () {
      this.update()
    },
    storeDarkMode: function () {
      this.$nextTick(() => this.update())
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeColumnWidth',
      'storeCols',
      'storeDarkMode',
      'storeDatasetId',
      'storeHideToggledTraits',
      'storeHideMarkers',
      'storeIgnoreEmptyCells',
      'storeInvertNumberingX',
      'storeInvertNumberingY',
      'storeInvertView',
      'storeMarkers',
      'storeRows',
      'storeTraits',
      'storeTraitColors',
      'storeUseGps',
      'storeVisibleTraits',
      'storeNavigationMode'
    ]),
    /** The row the user is currently in */
    highlightRow: function () {
      if (this.storeUseGps && this.highlightPosition) {
        const result = this.storeRows - Math.ceil(this.storeRows * this.highlightPosition.y / 100.0)
        if (result >= 0 && result <= this.storeRows) {
          return result
        } else {
          return null
        }
      } else {
        return null
      }
    },
    /** The column the user is currently in */
    highlightCol: function () {
      if (this.storeUseGps && this.highlightPosition) {
        const result = Math.floor(this.storeCols * this.highlightPosition.x / 100.0)
        if (result >= 0 && result <= this.storeCols) {
          return result
        } else {
          return null
        }
      } else {
        return null
      }
    },
    highlightX: function () {
      if (this.storeUseGps && this.highlightPosition) {
        const dataWidth = this.cellWidth * this.storeCols
        return this.origin.x + dataWidth * this.highlightPosition.x / 100.0
      } else {
        return null
      }
    },
    highlightY: function () {
      if (this.storeUseGps && this.highlightPosition) {
        const dataHeight = this.cellHeight * this.storeRows
        return this.origin.y + dataHeight - dataHeight * this.highlightPosition.y / 100.0
      } else {
        return null
      }
    },
    markerPositions: function () {
      if (!this.storeHideMarkers && this.storeMarkers && this.storeMarkers.corner && this.storeMarkers.everyRow && this.storeMarkers.everyCol) {
        const markV = this.cellHeight * this.storeMarkers.everyRow
        const markH = this.cellWidth * this.storeMarkers.everyCol

        const coords = []

        const width = this.storeCols * this.cellWidth
        const height = this.storeRows * this.cellHeight
        let x = 0
        let y = 0
        while (x <= width) {
          while (y <= height) {
            let finalX = x
            let finalY = y

            switch (this.storeMarkers.corner) {
              case 'topright':
                finalX = width - x
                break
              case 'bottomleft':
                finalY = height - y
                break
              case 'bottomright':
                finalX = width - x
                finalY = height - y
                break
            }

            coords.push([finalX, finalY])
            y += markV
          }
          x += markH
          y = 0
        }

        return coords
      } else {
        return []
      }
    },
    columnHeaderHeight: function () {
      return this.traitStats ? (2 * this.padding + this.fontSize + this.statsSize) : (2 * this.padding + this.fontSize)
    },
    rowHeaderWidth: function () {
      return this.traitStats ? (2 * this.padding + this.fontSize + this.statsSize) : (2 * this.padding + this.fontSize)
    },
    textPartHeight: function () {
      return this.fontSize + 2 * this.padding
    },
    coreWidth: function () {
      return this.cellWidth - this.padding * 2
    },
    circleWidth: function () {
      return this.circleRadius * 2
    },
    circlesPerRow: function () {
      for (let t = this.visibleTraitCount; t > 0; t--) {
        const x = this.circleWidth * t + this.padding / 2 * (t - 1)

        if (x <= this.coreWidth) {
          return t
        }
      }

      return 1
    },
    visibleTraitCount: function () {
      if (this.storeHideToggledTraits && this.storeVisibleTraits) {
        return this.storeVisibleTraits.filter(t => t).length
      } else {
        return this.storeTraits.length
      }
    },
    positionToIndex: function () {
      let counter = 0
      const result = {}

      this.storeTraits.forEach((t, index) => {
        if (!this.storeHideToggledTraits || this.storeVisibleTraits[index]) {
          result[counter++] = index
        }
      })

      return result
    },
    circleRows: function () {
      return Math.ceil(this.visibleTraitCount / this.circlesPerRow)
    },
    cellHeight: function () {
      return Math.max(this.textPartHeight + this.circleRows * (this.circleWidth + this.padding), this.canvasHeight / this.storeRows)
    },
    cellWidth: function () {
      const minReq = Math.max(this.storeColumnWidth, 120)

      return Math.max(minReq, this.canvasWidth / this.storeCols)
    },
    fillStyleWhite: function () {
      return this.storeDarkMode ? '#000000' : '#ffffff'
    },
    fillStyleLightGray: function () {
      return this.storeDarkMode ? '#0d0d0d' : '#f2f2f2'
    },
    fillStyleDarkGray: function () {
      return this.storeDarkMode ? '#1f1f1f' : '#e0e0e0'
    },
    fillStyleHighlight: function () {
      return this.storeDarkMode ? '#833471' : '#A3CB38'
    },
    fillStyleMarked: function () {
      return this.storeDarkMode ? '#415971' : '#c6d2de'
    },
    fillStyleHiddenTrait: function () {
      return this.storeDarkMode ? '#2c2c2c' : '#d3d3d3'
    },
    fillStyleText: function () {
      return this.storeDarkMode ? '#ffffff' : '#000000'
    }
  },
  methods: {
    onColumnMarked: function (col) {
      this.markedColumns[col] = !this.markedColumns[col]

      const minRow = Math.max(0, Math.floor(Math.abs(this.origin.y) / this.cellHeight))
      const maxRow = Math.min(minRow + Math.ceil(this.canvasHeight / this.cellHeight) + 1, this.storeRows)

      for (let row = minRow; row < maxRow; row++) {
        this.updateCell(row, col)
      }

      this.updateMarkers()

      // if (this.storeUseGps && this.highlightPosition) {
      //   this.updateUserPosition()
      // }
    },
    onRowMarked: function (row) {
      this.markedRows[row] = !this.markedRows[row]

      const minCol = Math.max(0, Math.floor(Math.abs(this.origin.x) / this.cellWidth))
      const maxCol = Math.min(minCol + Math.ceil(this.canvasWidth / this.cellWidth) + 1, this.storeCols)

      for (let col = minCol; col < maxCol; col++) {
        this.updateCell(row, col)
      }

      this.updateMarkers()

      // if (this.storeUseGps && this.highlightPosition) {
      //   this.updateUserPosition()
      // }
    },
    init: function () {
      if (this.isInitting) {
        return
      }
      this.isInitting = true

      const scale = window.devicePixelRatio
      const c = this.$refs.dataCanvas
      const uc = this.$refs.userCanvas
      c.width = this.scaledCanvasWidth
      c.height = this.scaledCanvasHeight
      uc.width = this.scaledCanvasWidth
      uc.height = this.scaledCanvasHeight

      this.$nextTick(() => {
        c.style.width = this.canvasWidth + 'px'
        c.style.height = this.canvasHeight + 'px'
        uc.style.width = this.canvasWidth + 'px'
        uc.style.height = this.canvasHeight + 'px'

        this.$nextTick(() => {
          this.ctx = c.getContext('2d', { alpha: false })
          this.ctx.scale(scale, scale)
          this.ctx.textBaseline = 'middle'
          this.ctx.textAlign = 'center'
          this.ctx.font = `${this.fontSize}px sans-serif`

          this.uctx = uc.getContext('2d', { alpha: true })
          this.uctx.scale(scale, scale)

          this.drag = false
          this.dragStart = null
          this.dragStartTime = null
          this.dragPosition = null
          this.originStart = {
            x: 0,
            y: 0
          }

          if (this.storeNavigationMode === 'scroll') {
            c.onmousedown = this.onMouseDown
            c.ontouchstart = this.onMouseDown
            c.onmouseup = this.onMouseUp
            c.ontouchend = this.onMouseUp
            c.onmouseleave = this.onMouseLeave
            c.ontouchleave = this.onMouseLeave
            c.onmousemove = this.onMouseMove
            c.ontouchmove = this.onMouseMove
            c.onwheel = this.onMouseWheel
          } else {
            c.onmousedown = this.onMouseDown
            c.ontouchstart = this.onMouseDown
            c.onmouseup = this.onMouseUp
            c.ontouchend = this.onMouseUp
          }

          this.update()

          this.isInitting = false
        })
      })
    },
    onMouseWheel: function (e) {
      let newX = this.origin.x
      let newY = this.origin.y

      if (e.deltaX) {
        newX = Math.round(Math.max(Math.min(0, this.origin.x - e.deltaX), -(this.storeCols * this.cellWidth - this.canvasWidth)))
      } else if (e.shiftKey) {
        newX = Math.round(Math.max(Math.min(0, this.origin.x - e.deltaY), -(this.storeCols * this.cellWidth - this.canvasWidth)))
      } else {
        newY = Math.round(Math.max(Math.min(0, this.origin.y - e.deltaY), -(this.storeRows * this.cellHeight - this.canvasHeight)))

        // Prevent scrolling up the page while the table hasn't reached the top yet
        if (e.deltaY < 0 && newY !== 0) {
          e.preventDefault()
          e.stopPropagation()
        }
      }

      const cvdx = this.origin.x - newX
      const cvdy = this.origin.y - newY

      this.origin.x = newX
      this.origin.y = newY

      this.updateFast(cvdx, cvdy)
    },
    onMouseDown: function (e) {
      // Stop any fling motion
      if (this.flingInterval !== null) {
        clearInterval(this.flingInterval)
        this.flingInterval = null
      }
      const ev = this.getTouchPosition(e)
      if (ev) {
        this.drag = true
        this.dragStart = {
          x: ev.x,
          y: ev.y
        }
        this.originStart = {
          x: this.origin.x,
          y: this.origin.y
        }
        this.dragPosition = ev
        this.dragStartTime = Date.now()
      }
    },
    onMouseUp: function (e) {
      this.drag = false

      const ev = this.getTouchPosition(e)

      if (ev !== null && (Math.sqrt(Math.pow(ev.x - this.dragStart.x, 2) + Math.pow(ev.y - this.dragStart.y, 2)) < 10)) {
        // This is a click
        const row = Math.floor((-this.origin.y + ev.y) / this.cellHeight)
        const col = Math.floor((-this.origin.x + ev.x) / this.cellWidth)

        const cell = this.$store.getters.storeData.get(`${row}-${col}`)

        if (this.storeIgnoreEmptyCells === true && !cell.name) {
          return
        }

        if (row >= 0 && row < this.storeRows && col >= 0 && col < this.storeCols) {
          // Emit an event to handle user selections
          this.$emit('cell-clicked', {
            row,
            col
          })
        }
      } else if (this.storeNavigationMode === 'scroll' && (e.type === 'touchend' || e.type === 'touchcancel')) {
        const deltaT = Math.abs(Date.now() - this.dragStartTime)
        // We have to use dragPosition here, because the end/cancel events don't provide location information
        const deltaX = Math.round((this.dragPosition.x - this.dragStart.x) / deltaT * 10)
        const deltaY = Math.round((this.dragPosition.y - this.dragStart.y) / deltaT * 10)
        this.dragPosition = null

        let counter = 0
        // Define an update interval
        this.flingInterval = setInterval(() => {
          // Run 50 iterations
          if (counter++ < 25) {
            const i = 1 - counter / 25.0
            // Calculate the velocity in both dimensions
            const velocityX = (1 - Math.pow(1 - i, 5)) * deltaX
            const velocityY = (1 - Math.pow(1 - i, 5)) * deltaY
            // Adjust the origin accordingly
            const newX = Math.round(Math.max(Math.min(0, this.origin.x + velocityX), -(this.storeCols * this.cellWidth - this.canvasWidth)))
            const newY = Math.round(Math.max(Math.min(0, this.origin.y + velocityY), -(this.storeRows * this.cellHeight - this.canvasHeight)))

            // const cvdx = this.origin.x - newX
            // const cvdy = this.origin.y - newY

            this.origin.x = newX
            this.origin.y = newY

            if (requestAnimationFrame in window) {
              requestAnimationFrame(() => this.update())
            } else {
              this.update()
            }
          } else {
            if (this.flingInterval) {
              clearInterval(this.flingInterval)
              this.flingInterval = null
            }
          }
        }, 10)
      }
    },
    onMouseLeave: function () {
      this.drag = false
    },
    onMouseMove: function (e) {
      if (this.drag) {
        const ev = this.getTouchPosition(e)
        if (ev) {
          const now = Date.now()

          const deltaYSinceLast = ev.y - this.dragPosition.y
          // Prevent scrolling up the page while the table hasn't reached the top yet
          if (deltaYSinceLast >= 0 && this.origin.y !== 0 && e.cancelable) {
            e.preventDefault()
          }

          // Throttle to one draw per 20 milliseconds
          if (!this.lastMove || (now - this.lastMove) > 20) {
            const deltaX = Math.round(ev.x - this.dragStart.x)
            const deltaY = Math.round(ev.y - this.dragStart.y)
            const newX = Math.round(Math.max(Math.min(0, this.originStart.x + deltaX), -(this.storeCols * this.cellWidth - this.canvasWidth)))
            const newY = Math.round(Math.max(Math.min(0, this.originStart.y + deltaY), -(this.storeRows * this.cellHeight - this.canvasHeight)))

            // const cvdx = this.origin.x - newX
            // const cvdy = this.origin.y - newY

            this.origin.x = newX
            this.origin.y = newY

            this.dragPosition = ev

            if (requestAnimationFrame in window) {
              requestAnimationFrame(() => this.update())
            } else {
              this.update()
            }

            this.lastMove = now
          }
        }
      }
    },
    getTouchPosition: function (e) {
      if (e.touches) {
        if (e.touches.length === 1) {
          const rect = this.$refs.dataCanvas.getBoundingClientRect()
          return {
            x: e.touches[0].clientX + rect.left,
            y: e.touches[0].clientY + rect.top
          }
        } else {
          return null
        }
      } else {
        return {
          x: e.offsetX,
          y: e.offsetY
        }
      }
    },
    updateFast: function (cvdx, cvdy) {
      cvdx = Math.round(cvdx)
      cvdy = Math.round(cvdy)
      this.ctx.drawImage(this.$refs.dataCanvas, 0, 0, this.scaledCanvasWidth, this.scaledCanvasHeight, -cvdx, -cvdy, this.canvasWidth, this.canvasHeight)

      const minCol = Math.max(0, Math.floor(Math.abs(this.origin.x) / this.cellWidth))
      const maxCol = Math.min(minCol + Math.ceil(this.canvasWidth / this.cellWidth) + 2, this.storeCols)
      const minRow = Math.max(0, Math.floor(Math.abs(this.origin.y) / this.cellHeight))
      const maxRow = Math.min(minRow + Math.ceil(this.canvasHeight / this.cellHeight) + 2, this.storeRows)

      const rowCount = Math.ceil(Math.abs(cvdy) / this.cellHeight) + 2
      const colCount = Math.ceil(Math.abs(cvdx) / this.cellWidth) + 2

      // Prevent drawing cells twice
      const done = new Set()

      if (cvdy !== 0) {
        for (let y = 0; y <= rowCount; y++) {
          const row = cvdy > 0 ? (maxRow - y - 1) : (minRow + y - 1)
          for (let col = minCol; col < maxCol; col++) {
            done.add(`${row}-${col}`)
            this.updateCell(row, col)
          }
        }
      }

      if (cvdx !== 0) {
        for (let x = 0; x <= colCount; x++) {
          const col = cvdx > 0 ? (maxCol - x - 1) : (minCol + x - 1)
          for (let row = minRow; row < maxRow; row++) {
            if (!done.has(`${row}-${col}`)) {
              this.updateCell(row, col)
            }
          }
        }
      }

      this.updateMarkers()

      if (this.storeUseGps && this.highlightPosition) {
        this.updateUserPosition()
      }
    },
    update: function () {
      if (!this.ctx) {
        return
      }
      if (this.isDrawing) {
        return
      }
      this.isDrawing = true

      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)

      if (!this.$store.getters.storeData || this.$store.getters.storeData.size < 1) {
        return
      }

      // Calculate row and column bounds that need to be redrawn
      const minRow = Math.max(0, Math.floor(Math.abs(this.origin.y) / this.cellHeight))
      const maxRow = Math.min(minRow + Math.ceil(this.canvasHeight / this.cellHeight) + 1, this.storeRows)
      const minCol = Math.max(0, Math.floor(Math.abs(this.origin.x) / this.cellWidth))
      const maxCol = Math.min(minCol + Math.ceil(this.canvasWidth / this.cellWidth) + 1, this.storeCols)

      // Draw all cells
      for (let row = minRow; row < maxRow; row++) {
        for (let col = minCol; col < maxCol; col++) {
          this.updateCell(row, col)
        }
      }

      this.updateMarkers()

      // if (this.$refs.colHead) {
      //   this.$refs.colHead.reset()
      // }
      // if (this.$refs.rowHead) {
      //   this.$refs.rowHead.reset()
      // }

      if (this.storeUseGps && this.highlightPosition) {
        this.updateUserPosition()
      }

      this.isDrawing = false
    },
    updateMarkers: function () {
      // Draw markers
      if (this.markerPositions && this.markerPositions.length > 0) {
        this.ctx.fillStyle = '#8e8c84'

        this.markerPositions.forEach(m => {
          const x = m[0] - Math.abs(this.origin.x)
          const y = m[1] - Math.abs(this.origin.y)
          const diameter = 6
          if (x >= 0 && x <= this.canvasWidth && y >= 0 && y <= this.canvasHeight) {
            this.ctx.beginPath()
            // Draw the arc (circle)
            this.ctx.arc(
              Math.min(this.canvasWidth - diameter, Math.max(diameter, x)),
              Math.min(this.canvasHeight - diameter, Math.max(diameter, y)),
              diameter, 0, 2 * Math.PI)
            this.ctx.fill()
          }
        })
      }
    },
    updateUserPosition: function () {
      this.uctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)

      if (this.highlightRow !== null && this.highlightCol !== null) {
        this.uctx.fillStyle = this.fillStyleHighlight
        // Calculate x and y of this grid cell
        const x = this.origin.x + this.cellWidth * this.highlightCol
        const y = this.origin.y + this.cellHeight * this.highlightRow

        // Fill the background
        this.uctx.globalAlpha = 0.3
        this.uctx.fillRect(x, y, this.cellWidth, this.cellHeight)
        this.uctx.globalAlpha = 1.0
      }

      this.uctx.save()
      this.uctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, this.highlightX * window.devicePixelRatio, this.highlightY * window.devicePixelRatio)
      if (this.highlightPosition && this.highlightPosition.heading) {
        this.uctx.rotate(((this.highlightPosition.heading + 45) % 360) * Math.PI / 180)
      } else {
        this.uctx.rotate(-45 * Math.PI / 180)
      }
      this.uctx.drawImage(this.userPositionImg, -8, -8)
      this.uctx.restore()
    },
    fittingString: function (str, maxWidth) {
      let width = this.ctx.measureText(str).width
      const ellipsis = '…'
      const ellipsisWidth = this.ctx.measureText(ellipsis).width
      if (width <= maxWidth || width <= ellipsisWidth) {
          return str
      } else {
          let len = str.length
          while (width >= maxWidth - ellipsisWidth && len-- > 0) {
              str = str.substring(0, len)
              width = this.ctx.measureText(str).width
          }
          return str + ellipsis
      }
    },
    drawComment: function (x, y) {
      this.ctx.drawImage(this.commentImg, x, y)
    },
    drawBookmark: function (x, y, w, h) {
      this.ctx.drawImage(this.bookmarkImg, x, y)
    },
    updateDataPoint: function (row, col) {
      this.updateCell(row, col)

      this.updateMarkers()
    },
    updateCell: function (row, col) {
      const cell = this.$store.getters.storeData.get(`${row}-${col}`)

      if (!cell) {
        return
      }

      let count = 0
      // if (row === this.highlightRow && col === this.highlightCol) {
      //   count = 4
      //   this.ctx.fillStyle = this.fillStyleHighlight
      // } else
      if ((this.markedRows && this.markedRows[row]) || (this.markedColumns && this.markedColumns[col])) {
        count = 3
        this.ctx.fillStyle = this.fillStyleMarked
      } else {
        // Determine the background color
        if (row % 2 === 0) {
          count++
        }
        if (col % 2 === 0) {
          count++
        }
        switch (count) {
          case 0:
            this.ctx.fillStyle = this.fillStyleWhite
            break
          case 1:
            this.ctx.fillStyle = this.fillStyleLightGray
            break
          case 2:
          default:
            this.ctx.fillStyle = this.fillStyleDarkGray
            break
        }
      }

      // Calculate x and y of this grid cell
      const x = this.origin.x + this.cellWidth * col
      const y = this.origin.y + this.cellHeight * row

      // Fill the background
      this.ctx.fillRect(x, y, this.cellWidth, this.cellHeight)

      if (this.storeIgnoreEmptyCells === true && !cell.name) {
        return
      }

      // Add the name text
      const text = this.fittingString(cell.name || 'N/A', this.coreWidth)
      this.ctx.fillStyle = this.fillStyleText
      this.ctx.fillText(text, x + this.cellWidth / 2, y + this.padding + this.fontSize / 2)

      // How many circle rows do we need?
      let traitCounter = 0
      for (let r = 0; r < this.circleRows; r++) {
        // How many circles are in this row?
        const circlesInThisRow = Math.min(this.circlesPerRow, this.visibleTraitCount - r * this.circlesPerRow)
        // Add extra padding depending on the number of circles
        const extraPadding = this.coreWidth - circlesInThisRow * this.circleWidth - (circlesInThisRow - 1) * this.padding / 2

        for (let t = 0; t < circlesInThisRow; t++) {
          let realIndex = this.positionToIndex[traitCounter]
          const hidden = !this.storeHideToggledTraits && this.storeVisibleTraits && !this.storeVisibleTraits[realIndex]

          let fill = cell.values[realIndex] !== null

          if (hidden) {
            realIndex = this.storeTraits.length
          }
          // If the view should be inverted, do this here
          if (this.storeInvertView) {
            fill = !fill
          }

          const targetX = Math.round(extraPadding / 2 + x + this.padding + t * (this.circleRadius + this.padding))
          const targetY = Math.round(y + this.textPartHeight + r * (this.circleRadius * 2 + this.padding))
          this.$refs.offscreenCanvas.copyToCanvas(realIndex, fill, count, this.ctx, targetX, targetY)

          traitCounter++
        }
      }

      // Add a bookmark symbol if required
      if (cell.isMarked) {
        this.drawBookmark(x + this.cellWidth - 20, y, 15, 21)
      }
      if (cell.comment) {
        this.drawComment(x + 5, y + 5)
      }
    },
    handleResize: function () {
      this.reset()
    },
    reset: function () {
      if (this.isResetting) {
        return
      }
      this.resetting = true

      this.canvasHeight = window.innerHeight - this.columnHeaderHeight - this.vScrollWidth
      this.canvasWidth = this.$refs.canvasWrapper.offsetWidth - this.rowHeaderWidth - this.hScrollHeight
      this.scaledCanvasHeight = this.canvasHeight * window.devicePixelRatio
      this.scaledCanvasWidth = this.canvasWidth * window.devicePixelRatio

      this.$nextTick(() => {
        this.init()
        if (this.$refs.colHead) {
          this.$refs.colHead.reset()
        }
        if (this.$refs.rowHead) {
          this.$refs.rowHead.reset()
        }
        if (this.$refs.vScroll) {
          this.$refs.vScroll.reset()
        }
        if (this.$refs.hScroll) {
          this.$refs.hScroll.reset()
        }
        this.$nextTick(() => {
          if (requestAnimationFrame in window) {
            requestAnimationFrame(() => this.update())
          } else {
            this.update()
          }
          this.isResetting = false
        })
      })
    },
    onDatasetChanged: function () {
      this.origin.x = 0
      this.origin.y = 0
      this.reset()
    },
    scrollTo: function (x, y) {
      if (x !== null && x >= 0 && x <= 100) {
        this.origin.x = Math.round(-(this.storeCols * this.cellWidth - this.canvasWidth) * x / 100.0)
      }
      if (y !== null && y >= 0 && y <= 100) {
        this.origin.y = Math.round(-(this.storeRows * this.cellHeight - this.canvasHeight) * y / 100.0)
      }

      if (requestAnimationFrame in window) {
        requestAnimationFrame(() => this.update())
      } else {
        this.update()
      }
    },
    scrollBy: function (x, y) {
      const newX = Math.round(Math.max(Math.min(0, this.origin.x + x), -(this.storeCols * this.cellWidth - this.canvasWidth)))
      const newY = Math.round(Math.max(Math.min(0, this.origin.y + y), -(this.storeRows * this.cellHeight - this.canvasHeight)))

      const cvdx = this.origin.x - newX
      const cvdy = this.origin.y - newY

      this.origin.x = newX
      this.origin.y = newY

      this.updateFast(cvdx, cvdy)
    },
    moveInDirection: function (direction) {
      switch (direction) {
        case 'topleft':
          this.scrollBy(this.cellWidth, this.cellHeight)
          break
        case 'top':
          this.scrollBy(0, this.cellHeight)
          break
        case 'topright':
          this.scrollBy(-this.cellWidth, this.cellHeight)
          break
        case 'left':
          this.scrollBy(this.cellWidth, 0)
          break
        case 'right':
          this.scrollBy(-this.cellWidth, 0)
          break
        case 'bottomleft':
          this.scrollBy(this.cellWidth, -this.cellHeight)
          break
        case 'bottom':
          this.scrollBy(0, -this.cellHeight)
          break
        case 'bottomright':
          this.scrollBy(-this.cellWidth, -this.cellHeight)
          break
      }
    },
    scrollToCorner: function (corner) {
      switch (corner) {
        case 'topleft':
          this.scrollTo(0, 0)
          break
        case 'top':
          this.scrollTo(null, 0)
          break
        case 'topright':
          this.scrollTo(100, 0)
          break
        case 'left':
          this.scrollTo(0, null)
          break
        case 'right':
          this.scrollTo(100, null)
          break
        case 'bottomleft':
          this.scrollTo(0, 100)
          break
        case 'bottom':
          this.scrollTo(null, 100)
          break
        case 'bottomright':
          this.scrollTo(100, 100)
          break
        case 'center':
          this.scrollTo(50, 50)
          break
        case 'gps':
          if (this.highlightPosition) {
            this.scrollTo(this.highlightPosition.x, 100 - this.highlightPosition.y)
          }
          break
      }
    }
  },
  mounted: function () {
    this.origin = {
      x: 0,
      y: 0
    }
    this.commentImg = new Image()
    this.commentImg.src = 'data:image/svg+xml,%3Csvg viewBox="0 0 16 16" width="1em" height="1em" focusable="false" role="img" aria-label="chat right text fill" xmlns="http://www.w3.org/2000/svg" fill="%238e8c84"%3E%3Cg %3E%3Cpath d="M16 2a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9.586a1 1 0 0 1 .707.293l2.853 2.853a.5.5 0 0 0 .854-.353V2zM3.5 3h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1 0-1zm0 2.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1 0-1zm0 2.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1z"%3E%3C/path%3E%3C/g%3E%3C/svg%3E'
    this.userPositionImg = new Image()
    this.userPositionImg.src = 'data:image/svg+xml,%3Csvg viewBox="0 0 16 16" width="1em" height="1em" focusable="false" role="img" aria-label="cursor fill" xmlns="http://www.w3.org/2000/svg" fill="%238e8c84"%3E%3Cg %3E%3Cpath d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"%3E%3C/path%3E%3C/g%3E%3C/svg%3E'
    this.bookmarkImg = new Image()
    this.bookmarkImg.src = 'data:image/svg+xml,%3Csvg viewBox="0 0 16 16" width="1em" height="1em" focusable="false" role="img" aria-label="bookmark check fill" xmlns="http://www.w3.org/2000/svg" fill="%238e8c84" %3E%3Cg %3E%3Cpath fill-rule="evenodd" d="M2 15.5V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5zm8.854-9.646a.5.5 0 0 0-.708-.708L7.5 7.793 6.354 6.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3z"%3E%3C/path%3E%3C/g%3E%3C/svg%3E'
    this.markedColumns = Array.from(Array(this.storeCols).keys()).map(i => false)
    this.markedRows = Array.from(Array(this.storeRows).keys()).map(i => false)
    // Get the height first. This may trigger scroll bars which will affect the width -> Wait a bit
    this.reset()

    window.addEventListener('resize', this.handleResize)
    emitter.on('dataset-changed', this.onDatasetChanged)
    emitter.on('data-point-changed', this.updateDataPoint)
  },
  beforeDestroy: function () {
    emitter.off('data-point-changed', this.updateDataPoint)
    emitter.off('dataset-changed', this.onDatasetChanged)

    window.removeEventListener('resize', this.handleResize)

    if (this.flingInterval) {
      clearInterval(this.flingInterval)
      this.flingInterval = null
    }
  }
}
</script>

<style scoped>
.grid {
  height: 100vh;
  height: 100svh;
  max-height: 100vh;
  max-height: 100svh;
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  grid-template-rows: min-content 1fr min-content;
  grid-template-areas:
    "tl colHeaders tr"
    "rowHeaders dataView vScroll"
    "bl hScroll br"
}
.grid .cell:hover {
  cursor: pointer;
}
.grid #user-position-canvas {
  pointer-events: none;
}
</style>
