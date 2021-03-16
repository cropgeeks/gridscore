<template>
  <div id="grid-table" class="table-responsive table-fixed-header">
    <table :class="`table header-fixed table-striped position-relative grid-table grid${storeGridLinesEvery} mb-0`">
      <colgroup v-if="storeColumnWidth">
        <col span="1" style="width: 60px;">
        <col v-for="columnIndex in storeCols" :key="`table-colgroup-col-${columnIndex}`" span="1" :style="`width: ${storeColumnWidth}px;`">
        <col span="1" style="width: 60px;">
      </colgroup>
      <thead role="rowgroup">
        <template v-if="storeUseGps === true">
          <UserPositionIndicator :position="highlightPosition" tableId="grid-table" />
        </template>
        <tr>
          <th></th>
          <th role="columnheader" scope="col" :class="`text-center ${columnClasses[column - 1]}`" v-for="column in storeCols" :key="`table-column-${column}`" @click="onHeadClicked(column - 1)">
            <span v-if="storeInvertNumberingX">{{ storeCols - column + 1 }}</span>
            <span v-else>{{ column }}</span>
          </th>
          <th></th>
        </tr>
      </thead>
      <!-- Handle click events -->
      <tbody role="rowgroup" v-on:click="onTableClick">
        <tr role="row" v-for="rowIndex in storeRows" :key="`table-row-${rowIndex}`">
          <th role="rowheader" class="text-right" v-if="storeInvertNumberingY">{{ storeRows - rowIndex + 1 }}</th>
          <th role="rowheader" class="text-right" v-else>{{ rowIndex }}</th>
          <GridTableCell :row="rowIndex - 1" :col="colIndex - 1" :highlightRow="highlightRow" :highlightCol="highlightCol" :visibleTraits="visibleTraits" :markedColumns="markedColumns" v-for="colIndex in storeCols" :key="`table-row-${rowIndex}-col-${colIndex}`" />
          <th role="rowheader" class="text-left" v-if="storeInvertNumberingY">{{ storeRows - rowIndex  + 1}}</th>
          <th role="rowheader" class="text-left" v-else>{{ rowIndex }}</th>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th></th>
          <th :class="`text-center ${columnClasses[column - 1]}`" v-for="column in storeCols" :key="`table-column-${column}`">
            <span v-if="storeInvertNumberingX">{{ storeCols - column + 1 }}</span>
            <span v-else>{{ column }}</span>
          </th>
          <th></th>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script>
import Vue from 'vue'

import GridTableCell from '@/components/tables/GridTableCell'
import UserPositionIndicator from '@/components/UserPositionIndicator'

export default {
  components: {
    GridTableCell,
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
    storeCols: function () {
      this.updateMarkedColumns()
    }
  },
  computed: {
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
    columnClasses: function () {
      let result = []

      for (let col = 0; col < this.storeCols; col++) {
        result.push(this.markedColumns[col] ? 'table-primary' : (col % 2 !== 1 ? 'table-active' : 'table-b-table-default'))
      }

      return result
    }
  },
  methods: {
    /** Mark the column on user click */
    onHeadClicked: function (column) {
      Vue.set(this.markedColumns, column, !this.markedColumns[column])
    },
    onTableClick: function (event) {
      const target = event.target.closest('td')

      if (target) {
        const [row, col] = target.id.split('-')

        /** Emit an event to handle user selections */
        this.$emit('cell-clicked', {
          row: +row,
          col: +col
        })
      }
    },
    updateMarkedColumns: function () {
      let temp = []

      for (let i = 0; i < this.storeCols; i++) {
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
.grid-table .circle-icon {
  font-size: 18px;
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

.grid-table td {
  padding: 0;
}
.grid-table td > div {
  padding: 0.75rem;
  cursor: pointer;
  word-break: break-all;
}
.grid-table td > div > span:empty::after{
  content: "\00a0";
}
.grid-table .grid-cell-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-fixed-header          { overflow-y: auto; max-height: 100vh; margin-bottom: 0; }
.table-fixed-header thead th { position: sticky; top: 0; z-index: 2; }
</style>
