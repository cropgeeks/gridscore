import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

const localStorage = window.localStorage

Vue.use(Vuex)

let name = process.env.VUE_APP_INSTANCE_NAME

if (!name) {
  name = 'gridscore-' + window.location.pathname
}

const dataset = {
  cols: 1,
  rows: 1,
  traits: [],
  data: [],
  brapiConfig: null
}

const storeState = {
  state: {
    locale: 'en_GB',
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
    },
    locale: (state) => state.locale
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
    ON_CORNER_POINTS_CHANGED_MUTATION: function (state, newCornerPoints) {
      state.datasets[state.datasetIndex].cornerPoints = newCornerPoints
    },
    ON_DATASET_CHANGED: function (state, newDataset) {
      Vue.set(state.datasets, state.datasetIndex, newDataset)
    },
    ON_BRAPI_CONFIG_CHANGED: function (state, newBrapiConfig) {
      state.datasets[state.datasetIndex].brapiConfig = newBrapiConfig
    },
    ON_DATA_CHANGED_MUTATION: function (state, newData) {
      state.datasets[state.datasetIndex].data = newData
    },
    ON_DATA_POINT_CHANGED_MUTATION: function (state, dataPoint) {
      state.datasets[state.datasetIndex].data[dataPoint.row][dataPoint.col].dates = dataPoint.dates
      state.datasets[state.datasetIndex].data[dataPoint.row][dataPoint.col].values = dataPoint.values

      // Use Vue.set, because this wasn't a part of the object from the start, so needs setting to be reactive
      Vue.set(state.datasets[state.datasetIndex].data[dataPoint.row][dataPoint.col], 'comment', dataPoint.comment)

      if (dataPoint.geolocation) {
        state.datasets[state.datasetIndex].data[dataPoint.row][dataPoint.col].geolocation = dataPoint.geolocation
      }
    },
    ON_USE_GPS_CHANGED_MUTATION: function (state, newUseGps) {
      state.useGps = newUseGps
    },
    ON_LOCALE_CHANGED_MUTATION: function (state, newLocale) {
      state.locale = newLocale
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
    setCornerPoints: function ({ commit }, cornerPoints) {
      commit('ON_CORNER_POINTS_CHANGED_MUTATION', cornerPoints)
    },
    setData: function ({ commit }, data) {
      commit('ON_DATA_CHANGED_MUTATION', data)
    },
    setDataset: function ({ commit }, dataset) {
      commit('ON_DATASET_CHANGED', dataset)
    },
    setBrapiConfig: function ({ commit }, brapiConfig) {
      commit('ON_BRAPI_CONFIG_CHANGED', brapiConfig)
    },
    setDataPoint: function ({ commit }, dataPoint) {
      commit('ON_DATA_POINT_CHANGED_MUTATION', dataPoint)
    },
    setUseGps: function ({ commit }, useGps) {
      commit('ON_USE_GPS_CHANGED_MUTATION', useGps)
    },
    setLocale: function ({ commit }, locale) {
      commit('ON_LOCALE_CHANGED_MUTATION', locale)
    }
  },
  plugins: [createPersistedState({
    key: name,
    storage: {
      getItem: key => {
        const result = JSON.parse(localStorage.getItem(key))

        if (result && result.datasets && result.datasets.length > 0) {
          result.datasets.forEach(d => {
            // This is updating the old format to the new one where traits have types
            if (d.traits && d.traits.length > 0) {
              if ((d.traits[0] !== null) && (typeof d.traits[0] !== 'object')) {
                d.traits = d.traits.map(t => {
                  return {
                    name: t,
                    type: 'date'
                  }
                })
              }
            }

            if (d.data && d.data.length > 0) {
              d.data.forEach(r => {
                Object.keys(r).forEach(c => {
                  if (!r[c].values) {
                    r[c].values = JSON.parse(JSON.stringify(r[c].dates))
                  }
                })
              })
            }
          })
        }

        return JSON.stringify(result)
      },
      setItem: (key, value) => localStorage.setItem(key, value),
      removeItem: key => localStorage.removeItem(key)
    }
  })]
}

const store = new Vuex.Store(storeState)

export default store
