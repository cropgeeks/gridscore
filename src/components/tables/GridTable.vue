<template>
  <div id="grid-table">
    <b-table-lite responsive
             striped
             foot-clone
             sticky-header="100vh"
             class="grid-table mb-0"
             table-class="position-relative"
             @head-clicked="onHeadClicked"
             :items="dataset.data"
             :fields="fields">
      <template #thead-top v-if="useGps === true">
        <UserPositionIndicator :position="highlightPosition" tableId="grid-table" />
      </template>
      <!-- The first column shows the row number -->
      <template v-slot:cell(0)="data">
        {{ data.index + 1 }}
      </template>
      <!-- The last column shows the row number -->
      <template v-slot:cell(last)="data">
        {{ data.index + 1 }}
      </template>
      <!-- Cell content -->
      <template v-slot:cell()="data">
        <!-- Handle click events -->
        <div v-on:click="onClick(data, $event)" :class="`text-center ${getClass(data)}`">
          <!-- Variety name -->
          <span class="d-block grid-cell-name" v-if="data.value.name">
            <span>{{ data.value.name }}</span>
          </span>
          <!-- For each trait -->
          <template v-for="(trait, index) in dataset.traits">
            <!-- Show a circle in the representative trait color if it's not hidden -->
            <span class="mx-1" :key="`trait-${index}`" :style="{ color: (visibleTraits && visibleTraits[index] === true) ? traitColors[index % traitColors.length] : 'lightgray' }" v-if="data.value.dates[index] !== null && data.value.dates[index].length > 0"><BIconCircleFill /></span>
            <!-- Otherwise show a hidden circle -->
            <span class="mx-1" :key="`trait-${index}`" :style="{ opacity: 0 }" v-else><BIconCircleFill /></span>
          </template>
        </div>
      </template>
    </b-table-lite>
  </div>
</template>

<script>
import UserPositionIndicator from '@/components/UserPositionIndicator'
import { BIconCircleFill } from 'bootstrap-vue'
import Vue from 'vue'

export default {
  props: {
    /** A Boolean array indicating which traits are currently visible */
    visibleTraits: {
      type: Array,
      default: null
    },
    /** The current user position in the field, x and y are scaled to 0-100 */
    highlightPosition: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      markedColumns: []
    }
  },
  computed: {
    /** The index of the last column. Used for the slot in the table */
    lastIndex: function () {
      return this.dataset.cols + 1
    },
    /** The row the user is currently in */
    highlightRow: function () {
      if (this.useGps && this.highlightPosition) {
        return this.dataset.rows - Math.ceil(this.dataset.rows * this.highlightPosition.y / 100.0)
      } else {
        return null
      }
    },
    /** The column the user is currently in */
    highlightCol: function () {
      if (this.useGps && this.highlightPosition) {
        return Math.floor(this.dataset.cols * this.highlightPosition.x / 100.0)
      } else {
        return null
      }
    },
    /** The actual data columns */
    fields: function () {
      // The first column showing the row index
      let result = [{
        key: '0',
        label: '',
        class: 'text-right',
        stickyColumn: true,
        isRowHeader: true
      }]

      // The other columns
      for (let i = 0; i < this.dataset.cols; i++) {
        result.push({
          key: '' + (i + 1),
          variant: this.markedColumns[i] ? 'primary' : (i % 2 === 1 ? null : 'active'),
          thClass: 'text-center'
        })
      }

      // The last column showing the row index
      result.push({
        key: 'last',
        label: '',
        class: 'text-left',
        isRowHeader: true
      })

      return result
    }
  },
  watch: {
    'dataset.cols': function () {
      this.updateMarkedColumns()
    }
  },
  components: {
    BIconCircleFill,
    UserPositionIndicator
  },
  methods: {
    /**
     * Returns the class to use for the give cell
     * @param data The data object representing the cell
     */
    getClass: function (data) {
      // Get col and row index
      const rowIndex = data.index
      const colIndex = parseInt(data.field.key) - 1
      let result = ''

      // If the user position in the field is known
      if (this.useGps && this.highlightRow !== null && this.highlightCol !== null) {
        if ((rowIndex === this.highlightRow) && (colIndex === this.highlightCol)) {
          // If this is the cell the user is located in, highlight it green
          return 'table-success'
        } else {
          // Otherwise, compute the row and column the user is in (restricted to the field, so if the user is outside the field, this will compute the closest row and col)
          const rowWithinBounds = Math.max(0, Math.min(this.dataset.rows - 1, this.highlightRow))
          const colWithinBounds = Math.max(0, Math.min(this.dataset.cols - 1, this.highlightCol))

          // If we're the first row and the user is in the first row and the user is in the same column, indicate the user is above
          if (rowIndex === 0 && rowWithinBounds === 0 && colIndex === colWithinBounds) {
            result += ' gps-border-top'
          }
          // If we're the last row and the user is in the last row and the user is in the same column, indicate the user is below
          if (rowIndex === this.dataset.rows - 1 && rowWithinBounds === this.dataset.rows - 1 && colIndex === colWithinBounds) {
            result += ' gps-border-bottom'
          }
          // If we're the first column and the user is in the first column and the user is in the same row, indicate the user is to the left
          if (colIndex === 0 && colWithinBounds === 0 && rowIndex === rowWithinBounds) {
            result += ' gps-border-left'
          }
          // If we're the last column and the user is in the last column and the user is in the same row, indicate the user is to the right
          if (colIndex === this.dataset.cols - 1 && colWithinBounds === this.dataset.cols - 1 && rowIndex === rowWithinBounds) {
            result += ' gps-border-right'
          }
        }
      }

      // Else, check if there's a comment, then show warning colour
      if (data.value.comment && data.value.comment.length > 0) {
        result += ' table-warning'
      }

      return result.length > 0 ? result : null
    },
    /** Mark the column on user click */
    onHeadClicked: function (key) {
      Vue.set(this.markedColumns, key - 1, !this.markedColumns[key - 1])
    },
    /** Handle cell click events */
    onClick: function (cell, event) {
      /** Emit an event to handle user selections */
      this.$emit('cell-clicked', {
        row: cell.index,
        col: parseInt(cell.field.key)
      })
    },
    updateMarkedColumns: function () {
      let temp = []

      for (let i = 0; i < this.dataset.cols; i++) {
        temp.push(false)
      }

      this.markedColumns = temp
    }
  },
  mounted: function () {
    this.updateMarkedColumns()
  }
}
</script>

<style>
.grid-table {
  table-layout: fixed;
}
.grid-table thead th {
  border-bottom: 1px solid;
  border-bottom-color: var(--primary) !important;
}
.grid-table tfoot th {
  border-top: 1px solid;
  border-top-color: var(--primary) !important;
}
.grid-table thead th div,
.grid-table .no-user-select {
  -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
     -khtml-user-select: none; /* Konqueror HTML */
       -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */
}
.grid-table .no-user-select {
  pointer-events: none;
}
.grid-table thead th:first-child,
.grid-table thead th:nth-child(5n+1),
.grid-table tfoot th:first-child,
.grid-table tfoot th:nth-child(5n+1),
.grid-table tbody tr th:not(:last-child),
.grid-table tr td:nth-child(5n+1) {
  border-right: 1px solid;
  border-right-color: var(--primary) !important;
}
.grid-table thead th:last-child,
.grid-table tfoot th:last-child,
.grid-table tr th:last-child {
  border-left: 1px solid;
  border-left-color: var(--primary) !important;
}

.grid-table tr:nth-child(5n) th,
.grid-table tr:nth-child(5n) td {
  border-bottom: 1px solid;
  border-bottom-color: var(--primary) !important;
}
.grid-table .table th,
.grid-table .table td {
  min-width: 70px;
  max-width: 70px;
}
.grid-table .table td {
  padding: 0;
}
.grid-table .table td > div {
  padding: 0.75rem;
  cursor: pointer;
  word-break: break-all;
}
.grid-table .table td > div > span:empty::after{
  content: "\00a0";
}
.grid-table .gps-border-top {
  border-top: 5px solid var(--success);
}
.grid-table .gps-border-left {
  border-left: 5px solid var(--success);
}
.grid-table .gps-border-right {
  border-right: 5px solid var(--success);
}
.grid-table .gps-border-bottom {
  border-bottom: 5px solid var(--success);
}
.grid-table .grid-cell-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
