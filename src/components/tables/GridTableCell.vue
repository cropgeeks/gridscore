<template>
  <td role="cell" :class="`position-relative text-center ${cellClasses}`" :id="`${row}-${col}`" v-if="row !== null && col !== null && cell">
    <div>
      <!-- Variety name -->
      <span class="d-block grid-cell-name">
        <span v-if="cell.name">{{cell.name }}</span>
        <span v-else>N/A</span>
      </span>
      <!-- For each trait -->
      <template v-for="(date, traitIndex) in cell.dates">
        <!-- Show a circle in the representative trait color if it's not hidden -->
        <span class="mx-1 circle-icon" :key="`table-cell-${row}-${col}-${traitIndex}`" :style="cellStyles[traitIndex]" v-if="storeInvertView ? (date === null || date.length < 1) : (date !== null && date.length > 0)">⬤</span>
        <!-- Otherwise show a hidden circle -->
        <span class="mx-1 circle-icon" :key="`table-cell-${row}-${col}-${traitIndex}`" :style="{ opacity: 0 }" v-else>⬤</span>
      </template>
    </div>
    <div class="position-absolute cell-bookmark" v-if="cell.isMarked" />
  </td>
</template>

<script>
import { mapGetters } from 'vuex'
import { EventBus } from '@/plugins/event-bus.js'

export default {
  props: {
    row: {
      type: Number,
      default: null
    },
    col: {
      type: Number,
      default: null
    },
    highlightRow: {
      type: Number,
      default: -1
    },
    highlightCol: {
      type: Number,
      default: -1
    },
    markedColumns: {
      type: Array,
      default: null
    },
    /** A Boolean array indicating which traits are currently visible */
    visibleTraits: {
      type: Array,
      default: null
    }
  },
  data: function () {
    return {
      cell: null
    }
  },
  watch: {
    storeDatasetId: function () {
      this.updateCell(this.row, this.col)
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeDatasetId',
      'storeInvertView',
      'storeTraitColors',
      'storeTraits',
      'storeUseGps'
    ]),
    isUserPosition: function () {
      return this.storeUseGps === true && this.highlightRow === this.row && this.highlightCol === this.col
    },
    cellClasses: function () {
      if (this.isUserPosition) {
        return 'table-success'
      }
      if (this.markedColumns && this.markedColumns[this.col]) {
        return 'table-primary'
      }
      if (this.col % 2 !== 1) {
        return 'table-active'
      }

      return null
    },
    cellStyles: function () {
      return this.storeTraits.map((t, index) => {
        return {
          color: (this.visibleTraits && this.visibleTraits[index] === true) ? this.storeTraitColors[index % this.storeTraitColors.length] : 'lightgray'
        }
      })
    }
  },
  methods: {
    updateCell: function (row, col) {
      if (row === this.row && col === this.col) {
        const temp = JSON.parse(JSON.stringify(this.$store.getters.storeData[this.row][this.col]))
        Object.freeze(temp)
        this.cell = temp
      }
    }
  },
  mounted: function () {
    this.updateCell(this.row, this.col)

    EventBus.$on('data-point-changed', this.updateCell)
  },
  beforeDestroy: function () {
    EventBus.$off('data-point-changed', this.updateCell)
  }
}
</script>
