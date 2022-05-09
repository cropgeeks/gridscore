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
    <canvas class="cell d-block" ref="dataCanvas" :width="scaledCanvasWidth" :height="scaledCanvasHeight" />
    <VScroll :height="canvasHeight" :width="vScrollWidth" :y="origin.y" :cellHeight="cellHeight" ref="vScroll" />
    <div />
    <HScroll :height="hScrollHeight" :width="canvasWidth" :x="origin.x" :cellWidth="cellWidth" ref="hScroll" />
    <div />
  </div>
</template>

<script>
import ColumnHeader from '@/components/tables/canvas/ColumnHeader'
import HScroll from '@/components/tables/canvas/HScroll'
import RowHeader from '@/components/tables/canvas/RowHeader'
import VScroll from '@/components/tables/canvas/VScroll'

import { mapGetters } from 'vuex'
import { EventBus } from '@/plugins/event-bus.js'

export default {
  components: {
    ColumnHeader,
    HScroll,
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
    highlightPosition: function () {
      // TODO: Only update relevant cell + directly adjacent cells
      if (this.followUser) {
        this.scrollTo(this.highlightPosition.x, 100 - this.highlightPosition.y)
      } else {
        this.update()
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
      this.update()
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
      'storeVisibleTraits'
    ]),
    /** The row the user is currently in */
    highlightRow: function () {
      if (this.storeUseGps && this.highlightPosition) {
        return this.storeRows - Math.ceil(this.storeRows * this.highlightPosition.y / 100.0)
      } else {
        return null
      }
    },
    /** The column the user is currently in */
    highlightCol: function () {
      if (this.storeUseGps && this.highlightPosition) {
        return Math.floor(this.storeCols * this.highlightPosition.x / 100.0)
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
      return this.storeDarkMode ? '#1e1032' : '#e1efcd'
    },
    fillStyleMarked: function () {
      return this.storeDarkMode ? '#415971' : '#c6d2de'
    },
    fillStyleUserPosition: function () {
      return this.storeDarkMode ? '#71737b' : '#8e8c84'
    },
    fillStyleBookmark: function () {
      return this.storeDarkMode ? '#71737b' : '#8e8c84'
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
    },
    onRowMarked: function (row) {
      this.markedRows[row] = !this.markedRows[row]

      const minCol = Math.max(0, Math.floor(Math.abs(this.origin.x) / this.cellWidth))
      const maxCol = Math.min(minCol + Math.ceil(this.canvasWidth / this.cellWidth) + 1, this.storeCols)

      for (let col = minCol; col < maxCol; col++) {
        this.updateCell(row, col)
      }

      this.updateMarkers()
    },
    init: function () {
      if (this.isInitting) {
        return
      }
      this.isInitting = true
      this.data = new Map(this.$store.getters.storeData)

      const scale = window.devicePixelRatio
      const c = this.$refs.dataCanvas
      c.width = this.scaledCanvasWidth
      c.height = this.scaledCanvasHeight

      this.$nextTick(() => {
        c.style.width = this.canvasWidth + 'px'
        c.style.height = this.canvasHeight + 'px'

        this.$nextTick(() => {
          this.ctx = c.getContext('2d')
          this.ctx.scale(scale, scale)
          this.ctx.textBaseline = 'middle'
          this.ctx.textAlign = 'center'
          this.ctx.font = `${this.fontSize}px sans-serif`

          this.drag = false
          this.dragStart = null
          this.dragStartTime = null
          this.dragPosition = null
          this.originStart = {
            x: 0,
            y: 0
          }

          c.onmousedown = this.onMouseDown
          c.ontouchstart = this.onMouseDown
          c.onmouseup = this.onMouseUp
          c.ontouchend = this.onMouseUp
          c.onmouseleave = this.onMouseLeave
          c.ontouchleave = this.onMouseLeave
          c.onmousemove = this.onMouseMove
          c.ontouchmove = this.onMouseMove
          c.onwheel = this.onMouseWheel

          this.update()

          this.isInitting = false
        })
      })
    },
    onMouseWheel: function (e) {
      if (e.deltaX) {
        this.origin.x = Math.round(Math.max(Math.min(0, this.origin.x - e.deltaX), -(this.storeCols * this.cellWidth - this.canvasWidth)))
      } else if (e.shiftKey) {
        this.origin.x = Math.round(Math.max(Math.min(0, this.origin.x - e.deltaY), -(this.storeCols * this.cellWidth - this.canvasWidth)))
      } else {
        this.origin.y = Math.round(Math.max(Math.min(0, this.origin.y - e.deltaY), -(this.storeRows * this.cellHeight - this.canvasHeight)))

        // Prevent scrolling up the page while the table hasn't reached the top yet
        if (e.deltaY < 0 && this.origin.y !== 0) {
          e.preventDefault()
          e.stopPropagation()
        }
      }
      this.update()
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
        this.dragStartTime = new Date().getMilliseconds()
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
      } else if (e.type === 'touchend' || e.type === 'touchcancel') {
        const deltaT = Math.abs(new Date().getMilliseconds() - this.dragStartTime)
        // We have to use dragPosition here, because the end/cancel events don't provide location information
        const deltaX = Math.round((this.dragPosition.x - this.dragStart.x) / deltaT * 10)
        const deltaY = Math.round((this.dragPosition.y - this.dragStart.y) / deltaT * 10)
        this.dragPosition = null

        let counter = 0
        // Define an update interval
        this.flingInterval = setInterval(() => {
          // Run 50 iterations
          if (counter++ < 50) {
            const i = 1 - counter / 50.0
            // Calculate the velocity in both dimensions
            const velocityX = (1 - Math.pow(1 - i, 5)) * deltaX
            const velocityY = (1 - Math.pow(1 - i, 5)) * deltaY
            // Adjust the origin accordingly
            this.origin.y = Math.round(Math.max(Math.min(0, this.origin.y + velocityY), -(this.storeRows * this.cellHeight - this.canvasHeight)))
            this.origin.x = Math.round(Math.max(Math.min(0, this.origin.x + velocityX), -(this.storeCols * this.cellWidth - this.canvasWidth)))
            this.update()
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
          const deltaX = Math.round(ev.x - this.dragStart.x)
          const deltaY = Math.round(ev.y - this.dragStart.y)

          this.origin.x = Math.round(Math.max(Math.min(0, this.originStart.x + deltaX), -(this.storeCols * this.cellWidth - this.canvasWidth)))
          this.origin.y = Math.round(Math.max(Math.min(0, this.originStart.y + deltaY), -(this.storeRows * this.cellHeight - this.canvasHeight)))

          const deltaYSinceLast = ev.y - this.dragPosition.y
          // Prevent scrolling up the page while the table hasn't reached the top yet
          if (deltaYSinceLast >= 0 && this.origin.y !== 0 && e.cancelable) {
            e.preventDefault()
          }

          this.dragPosition = ev

          this.update()
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
    update: function () {
      if (!this.ctx) {
        return
      }
      if (this.isDrawing) {
        return
      }
      this.isDrawing = true

      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)

      if (!this.data || this.data.size < 1) {
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
          this.updateCell(row, col, this.data.get(`${row}-${col}`))
        }
      }

      this.updateMarkers()

      if (this.$refs.colHead) {
        this.$refs.colHead.reset()
      }
      if (this.$refs.rowHead) {
        this.$refs.rowHead.reset()
      }

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
      this.ctx.fillStyle = this.fillStyleUserPosition
      this.ctx.save()
      this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, this.highlightX * window.devicePixelRatio, this.highlightY * window.devicePixelRatio)
      if (this.highlightPosition && this.highlightPosition.heading) {
        this.ctx.rotate(((this.highlightPosition.heading + 90) % 360) * Math.PI / 180)
      }
      this.ctx.beginPath()
      this.ctx.moveTo(0, -10)
      this.ctx.lineTo(7.5, 10)
      this.ctx.lineTo(0, 5)
      this.ctx.lineTo(-7.5, 10)
      this.ctx.closePath()
      this.ctx.fill()
      this.ctx.restore()
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
      this.ctx.fillStyle = this.fillStyleBookmark
      this.ctx.beginPath()
      this.ctx.moveTo(x, y)
      this.ctx.lineTo(x, y + h)
      this.ctx.lineTo(x + w / 2, y + h / 3 * 2)
      this.ctx.lineTo(x + w, y + h)
      this.ctx.lineTo(x + w, y)
      this.ctx.closePath()
      this.ctx.fill()
    },
    updateDataPoint: function (row, col) {
      this.data.set(`${row}-${col}`, this.$store.getters.storeData.get(`${row}-${col}`))

      this.updateCell(row, col, this.data.get(`${row}-${col}`))

      this.updateMarkers()
    },
    updateCell: function (row, col, data) {
      const cell = data || this.$store.getters.storeData.get(`${row}-${col}`)

      if (!cell) {
        return
      }

      if (row === this.highlightRow && col === this.highlightCol) {
        this.ctx.fillStyle = this.fillStyleHighlight
      } else if ((this.markedRows && this.markedRows[row]) || (this.markedColumns && this.markedColumns[col])) {
        this.ctx.fillStyle = this.fillStyleMarked
      } else {
        // Determine the background color
        let count = 0
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
          const realIndex = this.positionToIndex[traitCounter]
          const hidden = !this.storeHideToggledTraits && !this.storeVisibleTraits[realIndex]
          this.ctx.fillStyle = (!hidden && this.storeTraitColors) ? this.storeTraitColors[realIndex % this.storeTraitColors.length] : this.fillStyleHiddenTrait
          this.ctx.strokeStyle = (!hidden && this.storeTraitColors) ? this.storeTraitColors[realIndex % this.storeTraitColors.length] : this.fillStyleHiddenTrait

          this.ctx.beginPath()
          // Draw the arc (circle)
          this.ctx.arc(extraPadding / 2 + x + this.padding + this.circleRadius + t * (this.circleRadius + this.padding),
                      y + this.textPartHeight + this.circleRadius + r * (this.circleRadius * 2 + this.padding),
                      this.circleRadius, 0,
                      2 * Math.PI)

          let fill = cell.values[realIndex] !== null

          // If the view should be inverted, do this here
          if (this.storeInvertView) {
            fill = !fill
          }

          if (fill) {
            this.ctx.fill()
          } else {
            this.ctx.stroke()
          }
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
        if (this.$refs.vScroll) {
          this.$refs.vScroll.reset()
        }
        if (this.$refs.hScroll) {
          this.$refs.hScroll.reset()
        }
        this.$nextTick(() => {
          this.update()
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

      this.update()
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
    this.commentImg.src = 'data:image/svg+xml,%3Csvg viewBox="0 0 16 16" width="1em" height="1em" focusable="false" role="img" aria-label="chat text" xmlns="http://www.w3.org/2000/svg" fill="%238e8c84"%3E%3Cg%3E%3Cpath d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"%3E%3C/path%3E%3Cpath d="M4 5.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8zm0 2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z"%3E%3C/path%3E%3C/g%3E%3C/svg%3E'
    this.markedColumns = Array.from(Array(this.storeCols).keys()).map(i => false)
    this.markedRows = Array.from(Array(this.storeRows).keys()).map(i => false)
    // Get the height first. This may trigger scroll bars which will affect the width -> Wait a bit
    this.reset()

    window.addEventListener('resize', this.handleResize)
    EventBus.$on('dataset-changed', this.onDatasetChanged)
    EventBus.$on('data-point-changed', this.updateDataPoint)
  },
  beforeDestroy: function () {
    EventBus.$off('data-point-changed', this.updateDataPoint)
    EventBus.$off('dataset-changed', this.onDatasetChanged)

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
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  grid-template-rows: min-content 1fr min-content;
  grid-template-areas:
    "one two three"
    "four five six"
    "seven eight nine"
}
.grid .cell:hover {
  cursor: pointer;
}
</style>
