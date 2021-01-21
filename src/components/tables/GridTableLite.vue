<template>
  <div id="grid-table">
    <b-table-simple :class="`grid-table grid${gridLinesEvery} mb-0`" table-class="position-relative" responsive striped sticky-header="100vh">
      <thead role="rowgroup">
        <template v-if="useGps === true">
          <UserPositionIndicator :position="highlightPosition" tableId="grid-table" />
        </template>
        <tr>
          <th></th>
          <th role="columnheader" scope="col" :class="`text-center ${columnClasses[column - 1]}`" v-for="column in dataset.cols" :key="`table-column-${column}`" @click="onHeadClicked(column - 1)">{{ column }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        <tr role="row" v-for="(row, rowIndex) in dataset.data" :key="`table-row-${rowIndex}`">
          <th role="rowheader" class="text-right">{{ rowIndex + 1 }}</th>
          <td role="cell" :class="`text-center ${cellClasses[rowIndex][columnIndex]}`" v-for="(cell, columnIndex) in row" :key="`table-cell-${rowIndex}-${columnIndex}`">
            <!-- Handle click events -->
            <div v-on:click="onClick(rowIndex, columnIndex)" :class="borderStyles[rowIndex][columnIndex]">
              <!-- Variety name -->
              <span class="d-block grid-cell-name" v-if="cell.name">
                <span>{{cell.name }}</span>
              </span>
              <!-- For each trait -->
              <template v-for="(date, traitIndex) in cell.dates">
                <!-- Show a circle in the representative trait color if it's not hidden -->
                <span class="mx-1" :key="`table-cell-${rowIndex}-${columnIndex}-${traitIndex}`" :style="cellStyles[traitIndex]" v-if="invertView ? (date === null || date.length < 1) : (date !== null && date.length > 0)"><BIconCircleFill /></span>
                <!-- Otherwise show a hidden circle -->
                <span class="mx-1" :key="`table-cell-${rowIndex}-${columnIndex}-${traitIndex}`" :style="{ opacity: 0 }" v-else><BIconCircleFill /></span>
              </template>
            </div>
          </td>
          <th role="rowheader" class="text-left">{{ rowIndex + 1 }}</th>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th></th>
          <th :class="`text-center ${columnClasses[column - 1]}`" v-for="column in dataset.cols" :key="`table-column-${column}`" @click="onHeadClicked(column - 1)">{{ column }}</th>
          <th></th>
        </tr>
      </tfoot>
    </b-table-simple>
  </div>
</template>

<script>
import Vue from 'vue'

import UserPositionIndicator from '@/components/UserPositionIndicator'

import { BIconCircleFill } from 'bootstrap-vue'

export default {
  components: {
    BIconCircleFill,
    UserPositionIndicator
  },
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
  watch: {
    'dataset.cols': function () {
      this.updateMarkedColumns()
    }
  },
  computed: {
    columnClasses: function () {
      let result = []

      for (let col = 0; col < this.dataset.cols; col++) {
        result.push(this.markedColumns[col] ? 'table-primary' : (col % 2 !== 1 ? 'table-active' : 'table-b-table-default'))
      }

      return result
    },
    cellClasses: function () {
      let result = []

      for (let row = 0; row < this.dataset.data.length; row++) {
        let rowData = []

        for (let col = 0; col < this.dataset.cols; col++) {
          let result = this.markedColumns[col] ? 'table-primary' : ''

          if (!result) {
            result = col % 2 !== 1 ? 'table-active' : ''
          }

          rowData.push(result)
        }
        result.push(rowData)
      }

      return result
    },
    cellStyles: function () {
      return this.dataset.traits.map((t, index) => {
        return {
          color: (this.visibleTraits && this.visibleTraits[index] === true) ? this.traitColors[index % this.traitColors.length] : 'lightgray'
        }
      })
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
    borderStyles: function () {
      let result = []

      for (let row = 0; row < this.dataset.data.length; row++) {
        let rowData = []

        for (let col = 0; col < this.dataset.cols; col++) {
          let theClasses = ''

          // If the user position in the field is known
          if (this.useGps && this.highlightRow !== null && this.highlightCol !== null) {
            if ((row === this.highlightRow) && (col === this.highlightCol)) {
              // If this is the cell the user is located in, highlight it green
              theClasses += 'table-success'
            } else {
              // Otherwise, compute the row and column the user is in (restricted to the field, so if the user is outside the field, this will compute the closest row and col)
              const rowWithinBounds = Math.max(0, Math.min(this.dataset.rows - 1, this.highlightRow))
              const colWithinBounds = Math.max(0, Math.min(this.dataset.cols - 1, this.highlightCol))

              // If we're the first row and the user is in the first row and the user is in the same column, indicate the user is above
              if (row === 0 && rowWithinBounds === 0 && col === colWithinBounds) {
                theClasses += ' gps-border-top'
              }
              // If we're the last row and the user is in the last row and the user is in the same column, indicate the user is below
              if (row === this.dataset.rows - 1 && rowWithinBounds === this.dataset.rows - 1 && col === colWithinBounds) {
                theClasses += ' gps-border-bottom'
              }
              // If we're the first column and the user is in the first column and the user is in the same row, indicate the user is to the left
              if (col === 0 && colWithinBounds === 0 && row === rowWithinBounds) {
                theClasses += ' gps-border-left'
              }
              // If we're the last column and the user is in the last column and the user is in the same row, indicate the user is to the right
              if (col === this.dataset.cols - 1 && colWithinBounds === this.dataset.cols - 1 && row === rowWithinBounds) {
                theClasses += ' gps-border-right'
              }
            }
          }

          // Else, check if there's a comment, then show warning colour
          if ((this.dataset.data && this.dataset.data[row] && this.dataset.data[row][col]) && this.dataset.data[row][col].comment && this.dataset.data[row][col].comment.length > 0) {
            theClasses += ' table-warning'
          }

          rowData.push(theClasses)
        }

        result.push(rowData)
      }

      return result
    }
  },
  methods: {
    /** Mark the column on user click */
    onHeadClicked: function (column) {
      Vue.set(this.markedColumns, column, !this.markedColumns[column])
    },
    /** Handle cell click events */
    onClick: function (row, col) {
      /** Emit an event to handle user selections */
      this.$emit('cell-clicked', {
        row,
        col
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

.grid-table tfoot th:first-child,
.grid-table tbody tr th:not(:last-child) {
  border-right: 1px solid;
  border-right-color: var(--primary) !important;
}

.grid-table.grid2 thead th:nth-child(2n+1),
.grid-table.grid2 tfoot th:nth-child(2n+1),
.grid-table.grid2 tr td:nth-child(2n+1),
.grid-table.grid3 thead th:nth-child(3n+1),
.grid-table.grid3 tfoot th:nth-child(3n+1),
.grid-table.grid3 tr td:nth-child(3n+1),
.grid-table.grid4 thead th:nth-child(4n+1),
.grid-table.grid4 tfoot th:nth-child(4n+1),
.grid-table.grid4 tr td:nth-child(4n+1),
.grid-table.grid5 thead th:nth-child(5n+1),
.grid-table.grid5 tfoot th:nth-child(5n+1),
.grid-table.grid5 tr td:nth-child(5n+1) {
  border-right: 1px solid;
  border-right-color: var(--primary) !important;
}

.grid-table thead th:last-child,
.grid-table tfoot th:last-child,
.grid-table tr th:last-child {
  border-left: 1px solid;
  border-left-color: var(--primary) !important;
}

.grid-table.grid2 tr:nth-child(2n) th,
.grid-table.grid2 tr:nth-child(2n) td,
.grid-table.grid3 tr:nth-child(3n) th,
.grid-table.grid3 tr:nth-child(3n) td,
.grid-table.grid4 tr:nth-child(4n) th,
.grid-table.grid4 tr:nth-child(4n) td,
.grid-table.grid5 tr:nth-child(5n) th,
.grid-table.grid5 tr:nth-child(5n) td {
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
