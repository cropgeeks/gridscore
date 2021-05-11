import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

import { EventBus } from '@/plugins/event-bus'

import idb from '@/plugins/idb'

const localStorage = window.localStorage

Vue.use(Vuex)

let name = process.env.VUE_APP_INSTANCE_NAME

if (!name) {
  name = 'gridscore-' + window.location.pathname
}

let store

const storeState = {
  state: {
    locale: 'en_GB',
    datasetId: null,
    dataset: {
      id: null,
      name: 'First dataset',
      cols: 1,
      cornerPoints: [],
      rows: 1,
      traits: [],
      data: [],
      brapiConfig: null
    },
    columnWidth: 120,
    serverUrl: null,
    useGps: true,
    useSpeech: false,
    continuousInput: false,
    gridLinesEvery: 5,
    geolocation: null,
    invertView: false,
    invertNumberingX: false,
    invertNumberingY: false,
    hideToggledTraits: false,
    showStatsInTable: false,
    visibleTraits: null,
    traitColors: ['#910080', '#ff7c00', '#5ec418', '#00a0f1', '#c5e000', '#ff007a', '#222183', '#c83831', '#fff600']
  },
  getters: {
    storeBrapiConfig: (state) => state.dataset ? state.dataset.brapiConfig : null,
    storeColumnWidth: (state) => state.columnWidth,
    storeData: (state) => state.dataset ? state.dataset.data : null,
    storeDataset: (state) => state.dataset ? state.dataset : null,
    storeDatasetId: (state) => state.datasetId,
    storeDatasetName: (state) => state.dataset ? state.dataset.name : null,
    storeCols: (state) => state.dataset ? state.dataset.cols : null,
    storeCornerPoints: (state) => state.dataset ? state.dataset.cornerPoints : null,
    storeRows: (state) => state.dataset ? state.dataset.rows : null,
    storeTraits: (state) => state.dataset ? state.dataset.traits : null,
    storeUseGps: (state) => state.useGps,
    storeUseSpeech: (state) => state.useSpeech,
    storeContinuousInput: (state) => state.continuousInput,
    storeServerUrl: (state) => state.serverUrl,
    storeLocale: (state) => state.locale,
    storeGridLinesEvery: (state) => state.gridLinesEvery,
    storeGeolocation: (state) => state.geolocation,
    storeInvertView: (state) => state.invertView,
    storeInvertNumberingX: (state) => state.invertNumberingX,
    storeInvertNumberingY: (state) => state.invertNumberingY,
    storeShowStatsInTable: (state) => state.showStatsInTable,
    storeHideToggledTraits: (state) => state.hideToggledTraits,
    storeTraitColors: (state) => state.traitColors,
    storeVisibleTraits: (state) => state.visibleTraits
  },
  mutations: {
    ON_DATASET_LOAD_MUTATION: function (state, datasetId) {
      state.datasetId = datasetId
      if (datasetId) {
        EventBus.$emit('set-loading', true)
        idb.getDataset(datasetId)
          .then(dataset => {
            if (dataset) {
              idb.getDatasetData(datasetId)
                .then(data => {
                  const ds = JSON.parse(JSON.stringify(dataset))
                  ds.data = new Map()

                  for (let i = 0; i < data.length; i++) {
                    const dp = data[i]
                    ds.data.set(`${dp.row}-${dp.col}`, dp)
                  }

                  state.dataset = ds
                })
                .finally(() => {
                  EventBus.$emit('set-loading', false)
                  EventBus.$emit('dataset-changed')
                })
            } else {
              EventBus.$emit('set-loading', false)
              state.dataset = null
              state.datasetId = null
            }
          })
      } else {
        state.dataset = null
        state.datasetId = null
      }
    },
    ON_DATASET_ADDED_MUTATION: function (state, newDataset) {
      EventBus.$emit('set-loading', true)
      idb.addDataset(newDataset)
        .then(dsId => {
          state.datasetId = dsId
          idb.setDatasetData(dsId, newDataset.data)
            .then(() => {
              idb.getDatasetData(dsId)
                .then(data => {
                  const ds = JSON.parse(JSON.stringify(newDataset))
                  ds.data = new Map()

                  for (let i = 0; i < data.length; i++) {
                    const dp = data[i]
                    ds.data.set(`${dp.row}-${dp.col}`, dp)
                  }

                  state.dataset = ds
                })
                .finally(() => {
                  EventBus.$emit('set-loading', false)
                  EventBus.$emit('dataset-changed')
                })
            })
            .then(() => EventBus.$emit('datasets-changed'))
        })
    },
    ON_DATASET_DELETED_MUTATION: function (state, datasetId) {
      idb.deleteDatasetData(datasetId)
        .then(() => idb.deleteDataset(datasetId))
        .finally(() => {
          EventBus.$emit('dataset-deleted')
          EventBus.$emit('datasets-changed')
        })

      state.datasetId = null
      state.dataset = null
    },
    ON_DATASET_INDEX_CHANGED_MUTATION: function (state, newDatasetIndex) {
      state.datasetIndex = newDatasetIndex
    },
    ON_COLUMN_WIDTH_CHANGED_MUTATION: function (state, newColumnWidth) {
      state.columnWidth = newColumnWidth
    },
    ON_COLS_CHANGED_MUTATION: function (state, newCols) {
      state.dataset.cols = newCols
    },
    ON_ROWS_CHANGED_MUTATION: function (state, newRows) {
      state.dataset.rows = newRows
    },
    ON_TRAITS_CHANGED_MUTATION: function (state, newTraits) {
      state.dataset.traits = newTraits
    },
    ON_CORNER_POINTS_CHANGED_MUTATION: function (state, newCornerPoints) {
      state.dataset.cornerPoints = newCornerPoints

      idb.updateDatasetCornerPoints(state.datasetId, newCornerPoints)
    },
    ON_BRAPI_CONFIG_CHANGED: function (state, newBrapiConfig) {
      if (newBrapiConfig && newBrapiConfig.url && newBrapiConfig.url.indexOf('/', newBrapiConfig.url.length - 1) === -1) {
        newBrapiConfig.url += '/'
      }

      state.dataset.brapiConfig = newBrapiConfig
    },
    ON_SERVER_URL_CHANGED: function (state, newServerUrl) {
      state.serverUrl = newServerUrl
    },
    ON_DATASET_UPDATED_MUTATION: function (state, newData) {
      EventBus.$emit('set-loading', true)
      state.datasetId = newData.id
      idb.updateDatasetAndData(newData)
        .then(() => {
          idb.getDataset(newData.id)
            .then(dataset => {
              if (dataset) {
                idb.getDatasetData(newData.id)
                  .then(data => {
                    const ds = JSON.parse(JSON.stringify(dataset))
                    ds.data = new Map()

                    for (let i = 0; i < data.length; i++) {
                      const dp = data[i]
                      ds.data.set(`${dp.row}-${dp.col}`, dp)
                    }

                    state.dataset = ds
                  })
                  .finally(() => {
                    EventBus.$emit('set-loading', false)
                    EventBus.$emit('datasets-changed')
                    EventBus.$emit('dataset-changed')
                  })
              } else {
                EventBus.$emit('set-loading', false)
                state.dataset = null
                state.datasetId = null
              }
            })
        })
    },
    ON_DATA_POINT_CHANGED_MUTATION: function (state, dataPoint) {
      // To save time, write directly to the temporary dataset object
      let temp = state.dataset.data.get(`${dataPoint.row}-${dataPoint.col}`)
      temp.dates = dataPoint.dates
      temp.values = dataPoint.values
      if (dataPoint.isMarked) {
        temp.isMarked = dataPoint.isMarked
      } else {
        delete temp.isMarked
      }

      // Use Vue.set, because this wasn't a part of the object from the start, so needs setting to be reactive
      Vue.set(temp, 'comment', dataPoint.comment)

      if (dataPoint.geolocation) {
        temp.geolocation = dataPoint.geolocation
      }
      state.dataset.data.set(`${dataPoint.row}-${dataPoint.col}`, temp)

      // Then update the database
      idb.updateDatapoint(state.datasetId, dataPoint)
        .then(() => EventBus.$emit('data-point-changed', dataPoint.row, dataPoint.col))
    },
    ON_USE_GPS_CHANGED_MUTATION: function (state, newUseGps) {
      state.useGps = newUseGps
    },
    ON_USE_SPEECH_CHANGED_MUTATION: function (state, newUseSpeech) {
      state.useSpeech = newUseSpeech
    },
    ON_LOCALE_CHANGED_MUTATION: function (state, newLocale) {
      state.locale = newLocale
    },
    ON_GRID_LINES_EVERY_CHANGED_MUTATION: function (state, newGridLinesEvery) {
      state.gridLinesEvery = newGridLinesEvery
    },
    ON_CONTINUOUS_INPUT_CHANGED_MUTATION: function (state, newContinuousInput) {
      state.continuousInput = newContinuousInput
    },
    ON_HIDE_TOGGLED_TRAITS_CHANGED_MUTATION: function (state, newHideToggledTraits) {
      state.hideToggledTraits = newHideToggledTraits
    },
    ON_GEOLOCATION_CHANGED_MUTATION: function (state, newGeolocation) {
      if (state.geolocation && newGeolocation) {
        let newObject = {
          lat: newGeolocation.lat,
          lng: newGeolocation.lng,
          elv: newGeolocation.elv
        }

        // Update the heading only if it's available. When stationaty, the heading is NaN, ignore it and keep the old heading
        if (newGeolocation.heading !== undefined && newGeolocation.heading !== null && !isNaN(newGeolocation.heading)) {
          newObject.heading = newGeolocation.heading
        }

        state.geolocation = newObject
      } else {
        state.geolocation = newGeolocation
      }
    },
    ON_TRAIT_COLORS_CHANGED_MUTATION: function (state, newTraitColors) {
      state.traitColors = newTraitColors
    },
    ON_INVERT_VIEW_CHANGED_MUTATION: function (state, newInvertView) {
      state.invertView = newInvertView
    },
    ON_INVERT_NUMBERING_X_CHANGED_MUTATION: function (state, newInvertNumberingX) {
      state.invertNumberingX = newInvertNumberingX
    },
    ON_INVERT_NUMBERING_Y_CHANGED_MUTATION: function (state, newInvertNumberingY) {
      state.invertNumberingY = newInvertNumberingY
    },
    ON_SHOW_STATS_IN_TABLE_CHANGED_MUTATION: function (state, newShowStatsInTable) {
      state.showStatsInTable = newShowStatsInTable
    },
    ON_DATASET_UUID_CHANGED_MUTATION: function (state, newUuid) {
      idb.updateDatasetUuid(state.datasetId, newUuid)
    },
    ON_VISIBLE_TRAITS_CHANGED_MUTATION: function (state, newVisibleTraits) {
      state.visibleTraits = newVisibleTraits
    }
  },
  actions: {
    loadDataset: function ({ commit }, datasetId) {
      commit('ON_DATASET_LOAD_MUTATION', datasetId)
    },
    addDataset: function ({ commit }, dataset) {
      commit('ON_DATASET_ADDED_MUTATION', dataset)
    },
    deleteDataset: function ({ commit }, datasetId) {
      commit('ON_DATASET_DELETED_MUTATION', datasetId)
    },
    resetGridScore: function ({ commit }) {
      EventBus.$emit('set-loading', true)
      idb.deleteDatabase().then(() => {
        commit('ON_DATASET_INDEX_CHANGED_MUTATION', null)
        commit('ON_COLUMN_WIDTH_CHANGED_MUTATION', 300)
        commit('ON_USE_GPS_CHANGED_MUTATION', true)
        commit('ON_USE_SPEECH_CHANGED_MUTATION', false)
        commit('ON_LOCALE_CHANGED_MUTATION', 'en_GB')
        commit('ON_GRID_LINES_EVERY_CHANGED_MUTATION', 5)
        commit('ON_GEOLOCATION_CHANGED_MUTATION', null)
        commit('ON_CONTINUOUS_INPUT_CHANGED_MUTATION', false)
        commit('ON_TRAIT_COLORS_CHANGED_MUTATION', ['#910080', '#ff7c00', '#5ec418', '#00a0f1', '#c5e000', '#ff007a', '#222183', '#c83831', '#fff600'])
        commit('ON_INVERT_VIEW_CHANGED_MUTATION', false)
        commit('ON_INVERT_NUMBERING_X_CHANGED_MUTATION', false)
        commit('ON_INVERT_NUMBERING_Y_CHANGED_MUTATION', false)
        commit('ON_DATASET_LOAD_MUTATION', null)
      }).finally(() => {
        EventBus.$emit('set-loading', false)
        EventBus.$emit('datasets-changed')
        EventBus.$emit('dataset-deleted')
      })
    },
    setDatasetIndex: function ({ commit }, datasetIndex) {
      commit('ON_DATASET_INDEX_CHANGED_MUTATION', datasetIndex)
    },
    setColumnWidth: function ({ commit }, columnWidth) {
      commit('ON_COLUMN_WIDTH_CHANGED_MUTATION', columnWidth)
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
    updateDataset: function ({ commit }, update) {
      commit('ON_DATASET_UPDATED_MUTATION', update)
    },
    setBrapiConfig: function ({ commit }, brapiConfig) {
      commit('ON_BRAPI_CONFIG_CHANGED', brapiConfig)
    },
    setServerUrl: function ({ commit }, serverUrl) {
      commit('ON_SERVER_URL_CHANGED', serverUrl)
    },
    setDataPoint: function ({ commit }, dataPoint) {
      commit('ON_DATA_POINT_CHANGED_MUTATION', dataPoint)
    },
    setUseGps: function ({ commit }, useGps) {
      commit('ON_USE_GPS_CHANGED_MUTATION', useGps)
    },
    setUseSpeech: function ({ commit }, useSpeech) {
      commit('ON_USE_SPEECH_CHANGED_MUTATION', useSpeech)
    },
    setLocale: function ({ commit }, locale) {
      commit('ON_LOCALE_CHANGED_MUTATION', locale)
    },
    setGridLinesEvery: function ({ commit }, gridLinesEvery) {
      commit('ON_GRID_LINES_EVERY_CHANGED_MUTATION', gridLinesEvery)
    },
    setGeolocation: function ({ commit }, geolocation) {
      commit('ON_GEOLOCATION_CHANGED_MUTATION', geolocation)
    },
    setContinuousInput: function ({ commit }, continuousInput) {
      commit('ON_CONTINUOUS_INPUT_CHANGED_MUTATION', continuousInput)
    },
    setHideToggledTraits: function ({ commit }, hideToggledTraits) {
      commit('ON_HIDE_TOGGLED_TRAITS_CHANGED_MUTATION', hideToggledTraits)
    },
    setTraitColors: function ({ commit }, traitColors) {
      commit('ON_TRAIT_COLORS_CHANGED_MUTATION', traitColors)
    },
    setInvertView: function ({ commit }, invertView) {
      commit('ON_INVERT_VIEW_CHANGED_MUTATION', invertView)
    },
    setInvertNumberingX: function ({ commit }, invertNumberingX) {
      commit('ON_INVERT_NUMBERING_X_CHANGED_MUTATION', invertNumberingX)
    },
    setInvertNumberingY: function ({ commit }, invertNumberingY) {
      commit('ON_INVERT_NUMBERING_Y_CHANGED_MUTATION', invertNumberingY)
    },
    setShowStatsInTable: function ({ commit }, showStatsInTable) {
      commit('ON_SHOW_STATS_IN_TABLE_CHANGED_MUTATION', showStatsInTable)
    },
    setDatasetUuid: function ({ commit }, uuid) {
      commit('ON_DATASET_UUID_CHANGED_MUTATION', uuid)
    },
    setVisibleTraits: function ({ commit }, visibleTraits) {
      commit('ON_VISIBLE_TRAITS_CHANGED_MUTATION', visibleTraits)
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
              // Fix the old object based format to a 2d array format
              if (!Array.isArray(d.data[0])) {
                d.data = d.data.map(r => {
                  let rowData = []

                  for (let col = 0; col < d.cols; col++) {
                    rowData.push(r[col + 1])
                  }

                  return rowData
                })
              }

              // Fix missing date arrays
              d.data.forEach(r => {
                r.forEach(c => {
                  if (!c.values) {
                    c.values = JSON.parse(JSON.stringify(c.dates))
                  }
                })
              })
            }
          })

          // Add a new database entry, cause we're not using localstorage anymore
          setTimeout(() => store.dispatch('addDataset', result.datasets[0]), 5000)
        }

        return JSON.stringify(result)
      },
      setItem: (key, value) => {
        const parsed = JSON.parse(value)

        // Remove dataset information, we no longer store this here.
        delete parsed.datasets
        delete parsed.dataset
        delete parsed.datasetIndex

        localStorage.setItem(key, JSON.stringify(parsed))
      },
      removeItem: key => localStorage.removeItem(key)
    }
  })]
}

store = new Vuex.Store(storeState)

export default store
