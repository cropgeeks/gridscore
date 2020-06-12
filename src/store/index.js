import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

var name = process.env.VUE_APP_INSTANCE_NAME

if (!name) {
  name = 'gridscore-' + window.location.pathname
}

const dataset = {
  cols: 1,
  rows: 1,
  traits: [],
  data: []
}

const storeState = {
  state: {
    datasetIndex: 0,
    datasets: [dataset],
    useGps: true
  },
  getters: {
    dataset: (state) => state.datasets[state.datasetIndex],
    useGps: (state) => state.useGps,
    firstRun: (state) => {
      const ds = state.datasets[state.datasetIndex]
      return state.datasets.length < 2 && (ds === null || ds.data === null || ds.data.length < 1)
    }
  },
  mutations: {
    ON_DATASET_INDEX_CHANGED_MUTATION: function (state, newDatasetIndex) {
      state.datasetIndex = newDatasetIndex
    },
    ON_COLS_CHANGED_MUTATION: function (state, newCols) {
      state.datasets[state.datasetIndex].cols = newCols
    },
    ON_ROWS_CHANGED_MUTATION: function (state, newRows) {
      state.datasets[state.datasetIndex].rows = newRows
    },
    ON_TRAITS_CHANGED_MUTATION: function (state, newTraits) {
      state.datasets[state.datasetIndex].traits = newTraits
    },
    ON_DATA_CHANGED_MUTATION: function (state, newData) {
      state.datasets[state.datasetIndex].data = newData
    },
    ON_DATA_POINT_CHANGED_MUTATION: function (state, dataPoint) {
      state.datasets[state.datasetIndex].data[dataPoint.row][dataPoint.col].dates = dataPoint.value

      // Use Vue.set, because this wasn't a part of the object from the start, so needs setting to be reactive
      Vue.set(state.datasets[state.datasetIndex].data[dataPoint.row][dataPoint.col], 'comment', dataPoint.comment)

      if (dataPoint.geolocation) {
        state.datasets[state.datasetIndex].data[dataPoint.row][dataPoint.col].geolocation = dataPoint.geolocation
      }
    },
    ON_USE_GPS_CHANGED_MUTATION: function (state, newUseGps) {
      state.useGps = newUseGps
    }
  },
  actions: {
    setDatasetIndex: function ({ commit }, datasetIndex) {
      commit('ON_DATASET_INDEX_CHANGED_MUTATION', datasetIndex)
    },
    setCols: function ({ commit }, cols) {
      commit('ON_COLS_CHANGED_MUTATION', cols)
    },
    setRows: function ({ commit }, rows) {
      commit('ON_ROWS_CHANGED_MUTATION', rows)
    },
    setTraits: function ({ commit }, traits) {
      commit('ON_TRAITS_CHANGED_MUTATION', traits)
    },
    setData: function ({ commit }, data) {
      commit('ON_DATA_CHANGED_MUTATION', data)
    },
    setDataPoint: function ({ commit }, dataPoint) {
      commit('ON_DATA_POINT_CHANGED_MUTATION', dataPoint)
    },
    setUseGps: function ({ commit }, useGps) {
      commit('ON_USE_GPS_CHANGED_MUTATION', useGps)
    }
  },
  plugins: [ createPersistedState({
    key: name
  }) ]
}

const store = new Vuex.Store(storeState)

export default store
