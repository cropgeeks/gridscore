<template>
  <div>
    <b-table responsive
             striped
             hover
             sticky-header="100vh"
             class="grid-table mb-0"
             @head-clicked="onHeadClicked"
             :items="dataset.data"
             :fields="getFields"
             ref="table">
      <template v-slot:cell(0)="data">
        {{ data.index + 1 }}
      </template>
      <template v-slot:cell()="data">
        <div v-on:click="onClick(data, $event)" class="text-center" :class="(data.value.comment && data.value.comment.length > 0) ? 'table-warning' : null">
          <span class="d-block">{{ data.value.name ? data.value.name.substring(0, 4) : '' }}</span>
          <template v-for="(trait, index) in dataset.traits">
            <span class="mx-1" :key="`trait-${index}`" :style="{ color: colors[index % colors.length] }" v-if="data.value.dates[index] !== null && data.value.dates[index].length > 0">⬤</span>
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
  data: function () {
    return {
      markedColumns: []
    }
  },
  computed: {
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

      return result
    }
  },
  watch: {
    'dataset.cols': function () {
      this.updateMarkedColumns()
    }
  },
  methods: {
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
.grid-table thead th {
  border-bottom: 1px solid;
  border-bottom-color: var(--primary) !important;
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
.grid-table tbody tr th,
.grid-table tr td:nth-child(5n+1) {
  border-right: 1px solid;
  border-right-color: var(--primary) !important;
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
</style>
