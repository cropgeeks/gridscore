<template>
  <h4 id="user-position" class="position-absolute no-user-select" :style="{ left: userLeft, top: userTop, transform: userRotate, opacity: 0.75, margin: 0, padding: 0 }">
    <template v-if="position !== null && position.heading !== undefined && position.heading !== null"><BIconCursorFill /></template>
    <template v-else><BIconXCircle /></template>
  </h4>
</template>

<script>
import { BIconCursorFill, BIconXCircle } from 'bootstrap-vue'

export default {
  components: {
    BIconCursorFill,
    BIconXCircle
  },
  data: function () {
    return {
      userLeft: null,
      userTop: null
    }
  },
  props: {
    tableId: {
      type: String,
      default: ''
    },
    /** The current user position in the field, x and y are scaled to 0-100 */
    position: {
      type: Object,
      default: () => null
    }
  },
  watch: {
    position: function () {
      this.updateUserPosition()
    }
  },
  computed: {
    userRotate: function () {
      if (this.position && this.position !== null && this.position.heading !== null && this.position.heading >= 0 && this.position.heading <= 360) {
        // Calculate the angles between a vertical line and the right hand edge of the field layout
        const cp = this.dataset.cornerPoints
        const angleOne = Math.atan2(100, 0)
        const angleTwo = Math.atan2(cp[2][0] - cp[1][0], cp[2][1] - cp[1][1])
        // Convert it from radians to degrees
        const radians = (Math.abs(angleOne) - Math.abs(angleTwo)) * (180 / Math.PI)
        // Substract that angle from the heading minus 45 because the icon we're using is rotated
        const heading = this.position.heading - radians - 45

        return `rotate(${heading}deg)`
      } else {
        return null
      }
    }
  },
  methods: {
    /**
     * Updates the location of the user position indicator.
     */
    updateUserPosition: function () {
      if (this.useGps && this.position && this.position.x >= 0 && this.position.x <= 100) {
        if (!document.querySelector(`#${this.tableId} .table`)) {
          return null
        }
        // Get the widths of the table, the top left cell and the bottom right cell
        const table = document.querySelector(`#${this.tableId} .table`).offsetWidth
        const topLeft = document.querySelector(`#${this.tableId} .table thead tr th:first-child`).offsetWidth
        const bottomRight = document.querySelector(`#${this.tableId} .table tfoot tr th:last-child`).offsetWidth
        const icon = document.querySelector(`#${this.tableId} #user-position`).offsetWidth

        // Calculate the percentage position within just the body of the table (without first and last column), then add the first column width and subtract half the height of the icon to center it
        this.userLeft = `${topLeft + (table - topLeft - bottomRight) * this.position.x / 100 - icon / 2}px`
      } else {
        this.userLeft = null
      }
      if (this.useGps && this.position && this.position.y >= 0 && this.position.y <= 100) {
        if (!document.querySelector(`#${this.tableId} .table`)) {
          return null
        }
        // Get the heights of the table, the top left cell and the bottom right cell
        const table = document.querySelector(`#${this.tableId} .table`).offsetHeight
        const topLeft = document.querySelector(`#${this.tableId} .table thead tr th:first-child`).offsetHeight
        const bottomRight = document.querySelector(`#${this.tableId} .table tfoot tr th:last-child`).offsetHeight
        const icon = document.querySelector(`#${this.tableId} #user-position`).offsetHeight

        // Calculate the percentage position within just the body of the table (without first and last row), then add the first row height and substract half the width of the icon to center it
        this.userTop = `${topLeft + (table - topLeft - bottomRight) * (100 - this.position.y) / 100 - icon / 2}px`
      } else {
        this.userTop = null
      }
    }
  },
  mounted: function () {
    window.addEventListener('resize', this.updateUserPosition)

    this.$nextTick(() => this.updateUserPosition())
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.updateUserPosition)
  }
}
</script>

<style>

</style>
