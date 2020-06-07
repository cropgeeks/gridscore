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
        <div v-on:click="onClick(data, $event)" class="text-center" :class="data.value.comment ? 'table-warning' : null">
          <span class="d-block">{{ data.value.name ? data.value.name.substring(0, 4) : '' }}</span>
          <span v-for="(trait, index) in dataset.traits" :key="`trait-${index}`" v-if="data.value.dates[index] !== null && data.value.dates[index].length > 0">
            <span class="mx-1" :style="{ color: colors[index % colors.length] }">⬤</span>
          </span>
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
.grid-table .table td > div:empty::after{
  content: "\00a0";
}
</style>
