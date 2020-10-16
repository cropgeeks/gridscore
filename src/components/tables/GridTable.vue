<template>
  <div>
    <b-table responsive
             striped
             foot-clone
             sticky-header="100vh"
             class="grid-table mb-0 position-relative"
             @head-clicked="onHeadClicked"
             :items="dataset.data"
             :fields="getFields"
             ref="table">
      <template v-slot:cell(0)="data">
        {{ data.index + 1 }}
      </template>
      <template v-slot:cell(last)="data">
        {{ data.index + 1 }}
      </template>
      <template v-slot:cell()="data">
        <div v-on:click="onClick(data, $event)" :class="`text-center ${getClass(data)}`">
          <span class="d-block">{{ data.value.name ? data.value.name.substring(0, 4) : '' }}</span>
          <template v-for="(trait, index) in dataset.traits">
            <span class="mx-1" :key="`trait-${index}`" :style="{ color: (visibleTraits && visibleTraits[index] === true) ? colors[index % colors.length] : 'lightgray' }" v-if="data.value.dates[index] !== null && data.value.dates[index].length > 0">⬤</span>
            <span class="mx-1" :key="`trait-${index}`" :style="{ opacity: 0 }" v-else>⬤</span>
          </template>
        </div>
      </template>
    </b-table>
  </div>
</template>

<script>
import Vue from 'vue'

export default {
  props: {
    visibleTraits: {
      type: Array,
      default: null
    },
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
    lastIndex: function () {
      return this.dataset.cols + 1
    },
    highlightRow: function () {
      if (this.highlightPosition) {
        return this.dataset.rows - Math.ceil(this.dataset.rows * this.highlightPosition.y / 100.0)
      } else {
        return null
      }
    },
    highlightCol: function () {
      if (this.highlightPosition) {
        return Math.floor(this.dataset.cols * this.highlightPosition.x / 100.0)
      } else {
        return null
      }
    },
    getFields: function () {
      let result = [{
        key: '0',
        label: '',
        class: 'text-right',
        stickyColumn: true,
        isRowHeader: true
      }]

      for (let i = 0; i < this.dataset.cols; i++) {
        result.push({
          key: '' + (i + 1),
          variant: this.markedColumns[i] ? 'primary' : (i % 2 === 1 ? null : 'active'),
          thClass: 'text-center'
        })
      }

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
  methods: {
    getClass: function (data) {
      const rowIndex = data.index
      const colIndex = parseInt(data.field.key) - 1

      if (this.highlightRow && this.highlightCol) {
        if ((rowIndex === this.highlightRow) && (colIndex === this.highlightCol)) {
          return 'table-success'
        } else {
          const rowWithinBounds = Math.max(0, Math.min(this.dataset.rows - 1, this.highlightRow))
          const colWithinBounds = Math.max(0, Math.min(this.dataset.cols - 1, this.highlightCol))

          let result = ''
          if (rowIndex === 0 && rowWithinBounds === 0 && colIndex === colWithinBounds) {
            result += ' gps-border-top'
          }
          if (rowIndex === this.dataset.rows - 1 && rowWithinBounds === this.dataset.rows - 1 && colIndex === colWithinBounds) {
            result += ' gps-border-bottom'
          }
          if (colIndex === 0 && colWithinBounds === 0 && rowIndex === rowWithinBounds) {
            result += ' gps-border-left'
          }
          if (colIndex === this.dataset.cols - 1 && colWithinBounds === this.dataset.cols - 1 && rowIndex === rowWithinBounds) {
            result += ' gps-border-right'
          }

          if (result.length > 0) {
            return result
          }
        }
      }

      // Else, check if there's a comment, then show warning colour
      return (data.value.comment && data.value.comment.length > 0) ? 'table-warning' : null
    },
    onHeadClicked: function (key) {
      Vue.set(this.markedColumns, key - 1, !this.markedColumns[key - 1])
    },
    onClick: function (cell, event) {
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
.grid-table thead th div {
  -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
     -khtml-user-select: none; /* Konqueror HTML */
       -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */
}
.grid-table thead th:first-child,
.grid-table thead th:nth-child(5n+1),
.grid-table tfoot th:first-child,
.grid-table tfoot th:nth-child(5n+1),
.grid-table tbody tr th,
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
</style>
