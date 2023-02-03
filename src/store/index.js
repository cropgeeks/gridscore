import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import idb from '@/plugins/idb'

const emitter = require('tiny-emitter/instance')
const localStorage = window.localStorage

Vue.use(Vuex)

let name = process.env.VUE_APP_INSTANCE_NAME

if (!name) {
  name = 'gridscore-' + window.location.pathname
}

let store = null

const loadDataset = function (state, datasetId, event) {
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
            emitter.emit('set-loading', false)
            emitter.emit('dataset-changed', event)
          })
      } else {
        emitter.emit('set-loading', false)
        state.dataset = null
        state.datasetId = null
      }
    })
}

const storeState = {
  state: {
    uniqueClientId: null,
    runCount: 0,
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
    brapiConfig: null,
    darkMode: false,
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
    hideMarkers: false,
    showStatsInTable: false,
    visibleTraits: null,
    navigationMode: 'scroll',
    ignoreEmptyCells: true,
    traitColors: ['#910080', '#ff7c00', '#5ec418', '#00a0f1', '#c5e000', '#ff007a', '#222183', '#c83831', '#fff600'],
    plausible: {
      plausibleDomain: null,
      plausibleHashMode: true,
      plausibleApiHost: null
    },
    hideCitationMessage: false,
    changelogVersionNumber: null
  },
  getters: {
    storeDarkMode: (state) => state.darkMode,
    storeRunCount: (state) => state.runCount,
    storeUniqueClientId: (state) => state.uniqueClientId,
    storeBrapiConfig: (state) => state.dataset ? state.dataset.brapiConfig : state.brapiConfig,
    storeColumnWidth: (state) => state.columnWidth,
    storeData: (state) => state.dataset ? state.dataset.data : null,
    storeDataset: (state) => state.dataset ? state.dataset : null,
    storeDatasetId: (state) => state.datasetId,
    storeDatasetName: (state) => state.dataset ? state.dataset.name : null,
    storeDatasetComment: (state) => state.dataset ? state.dataset.comment : null,
    storeDatasetUuid: (state) => state.dataset ? state.dataset.uuid : null,
    storeDatasetType: (state) => state.dataset ? (state.dataset.datasetType || 'TRIAL') : null,
    storeCols: (state) => state.dataset ? state.dataset.cols : null,
    storeCornerPoints: (state) => state.dataset ? state.dataset.cornerPoints : null,
    storeRows: (state) => state.dataset ? state.dataset.rows : null,
    storeTraits: (state) => state.dataset ? state.dataset.traits : null,
    storeMarkers: (state) => state.dataset ? state.dataset.markers : null,
    storeUseGps: (state) => state.useGps,
    storeUseSpeech: (state) => state.useSpeech,
    storeContinuousInput: (state) => state.continuousInput,
    storeServerUrl: (state) => state.serverUrl,
    storeLocale: (state) => state.locale,
    storeGridLinesEvery: (state) => state.gridLinesEvery,
    storeGeolocation: (state) => state.geolocation,
    storeIgnoreEmptyCells: (state) => state.ignoreEmptyCells,
    storeInvertView: (state) => state.invertView,
    storeInvertNumberingX: (state) => state.invertNumberingX,
    storeInvertNumberingY: (state) => state.invertNumberingY,
    storeShowStatsInTable: (state) => state.showStatsInTable,
    storeHideToggledTraits: (state) => state.hideToggledTraits,
    storeHideMarkers: (state) => state.hideMarkers,
    storeTraitColors: (state) => state.traitColors,
    storeVisibleTraits: (state) => state.visibleTraits,
    storePlausible: (state) => state.plausible,
    storeNavigationMode: (state) => state.navigationMode,
    storeHideCitationMessage: (state) => state.hideCitationMessage,
    storeChangelogVersionNumber: (state) => state.changelogVersionNumber
  },
  mutations: {
    ON_RUN_COUNT_CHANGED_MUTATION: function (state, newRunCount) {
      state.runCount = newRunCount
    },
    ON_DATASET_LOAD_MUTATION: function (state, event) {
      const datasetId = event.datasetId
      state.datasetId = datasetId
      if (datasetId) {
        emitter.emit('set-loading', true)
        loadDataset(state, datasetId, event)
      } else {
        state.dataset = null
        state.datasetId = null
      }
    },
    ON_DATASET_ADDED_MUTATION: function (state, newDataset) {
      emitter.emit('set-loading', true)
      idb.addDataset(newDataset)
        .then(dsId => {
          newDataset.id = dsId
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
                  emitter.emit('set-loading', false)
                  emitter.emit('dataset-changed', { redirect: true })
                })
            })
            .then(() => emitter.emit('datasets-changed'))
        })
    },
    ON_DATASET_DATE_UPDATED_MUTATION: function (state, update) {
      emitter.emit('set-loading', true)

      idb.overwriteDatasetData(update.id, update.data)
        .then(() => loadDataset(state, update.id, { redirect: false }))
        .finally(() => {
          emitter.emit('set-loading', false)
          emitter.emit('dataset-changed', { redirect: false })
          emitter.emit('datasets-changed')
        })
    },
    ON_DATASET_RESET_MUTATION: function (state, datasetId) {
      emitter.emit('set-loading', true)

      idb.resetDatasetData(datasetId)
        .then(() => loadDataset(state, datasetId, { redirect: true }))
        .finally(() => {
          emitter.emit('set-loading', false)
          emitter.emit('dataset-changed', { redirect: true })
          emitter.emit('datasets-changed')
        })
    },
    ON_DATASET_DELETED_MUTATION: function (state, datasetId) {
      idb.deleteDatasetData(datasetId)
        .then(() => idb.deleteDataset(datasetId))
        .finally(() => {
          emitter.emit('dataset-deleted')
          emitter.emit('datasets-changed')
        })

      state.datasetId = null
      state.dataset = null
    },
    ON_ADD_GERMPLASM_TO_SURVEY_DATASET_MUTATION: function (state, config) {
      emitter.emit('set-loading', true)

      idb.addGermplasmToSurveyDataset(config.datasetId, config.germplasm)
        .then(() => {
          loadDataset(state, state.datasetId, { redirect: false, scrollToCorner: 'bottomleft' })
        })
        .finally(() => {
          emitter.emit('set-loading', false)
          emitter.emit('dataset-changed')
        })
    },
    ON_TRAIT_BRAPI_IDS_CHANGED_MUTATION: function (state, config) {
      emitter.emit('set-loading', true)

      if (state.dataset) {
        Vue.set(state.dataset, 'traits', config.traits)
      }

      idb.updateTraitBrapiIds(config.datasetId, config.traits)
        .finally(() => {
          emitter.emit('set-loading', false)
          emitter.emit('traits-updated')
        })
    },
    ON_ADD_TRAIT_TO_DATASET_MUTATION: function (state, config) {
      emitter.emit('set-loading', true)

      idb.addTraitToDataset(config.datasetId, config.trait)
        .finally(() => {
          emitter.emit('set-loading', false)
          emitter.emit('datasets-changed')
        })
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
    ON_UNIQUE_CLIENT_ID_CHANGED_MUTATION: function (state, newUniqueClientId) {
      state.uniqueClientId = newUniqueClientId
    },
    ON_CORNER_POINTS_AND_MARKERS_CHANGED_MUTATION: function (state, newData) {
      if (newData.cornerPoints && newData.cornerPoints.length === 4) {
        state.dataset.cornerPoints = newData.cornerPoints
      }
      state.dataset.markers = newData.markers

      idb.updateDatasetCornerPointsAndMarkers(state.datasetId, newData)
    },
    ON_BRAPI_CONFIG_CHANGED: function (state, newBrapiConfig) {
      if (newBrapiConfig && newBrapiConfig.url) {
        // Remove trailing slashes
        newBrapiConfig.url = newBrapiConfig.url.replace(/\/+$/, '')
      }

      if (state.dataset) {
        Vue.set(state.dataset, 'brapiConfig', newBrapiConfig)

        idb.updateDatasetBrapiConfig(state.datasetId, newBrapiConfig)
      } else {
        state.brapiConfig = newBrapiConfig
      }
    },
    ON_SERVER_URL_CHANGED: function (state, newServerUrl) {
      state.serverUrl = newServerUrl
    },
    ON_PLAUSIBLE_CHANGED: function (state, newPlausible) {
      Vue.set(state, 'plausible', newPlausible)
    },
    ON_DATASET_UPDATED_MUTATION: function (state, update) {
      emitter.emit('set-loading', true)
      state.datasetId = update.dataset.id
      idb.updateDatasetAndData(update.dataset)
        .then(() => {
          idb.getDataset(update.dataset.id)
            .then(dataset => {
              if (dataset) {
                idb.getDatasetData(update.dataset.id)
                  .then(data => {
                    const ds = JSON.parse(JSON.stringify(dataset))
                    ds.data = new Map()

                    data.forEach(dp => ds.data.set(`${dp.row}-${dp.col}`, dp))

                    state.dataset = ds
                  })
                  .finally(() => {
                    emitter.emit('set-loading', false)
                    emitter.emit('datasets-changed')
                    emitter.emit('dataset-changed', { redirect: update.redirect })
                  })
              } else {
                emitter.emit('set-loading', false)
                state.dataset = null
                state.datasetId = null
              }
            })
        })
    },
    ON_DATA_POINT_TRAIT_DATA_CHANGED_MUTATION: function (state, config) {
      // To save time, write directly to the temporary dataset object
      const temp = state.dataset.data.get(`${config.row}-${config.col}`)
      temp.dates[config.traitIndex] = JSON.parse(JSON.stringify(config.dates))
      temp.values[config.traitIndex] = JSON.parse(JSON.stringify(config.values))
      state.dataset.data.set(`${config.row}-${config.col}`, temp)

      // Then update the database
      idb.updateDatapoint(state.datasetId, temp)
        .then(() => emitter.emit('data-point-changed', config.row, config.col))
    },
    ON_DATA_POINT_CHANGED_MUTATION: function (state, dataPoint) {
      // To save time, write directly to the temporary dataset object
      const temp = state.dataset.data.get(`${dataPoint.row}-${dataPoint.col}`)
      const traits = state.dataset.traits
      temp.dates = dataPoint.dates.map((dp, i) => {
        if (traits[i].mType === 'multi') {
          if (dp === null) {
            return temp.dates[i]
          } else {
            if (!temp.dates[i]) {
              return [dp]
            } else {
              return temp.dates[i].concat([dp])
            }
          }
        } else {
          return dp
        }
      })
      temp.values = dataPoint.values.map((dp, i) => {
        if (traits[i].mType === 'multi') {
          if (dp === null) {
            return temp.values[i]
          } else {
            if (!temp.values[i]) {
              return [dp]
            } else {
              return temp.values[i].concat([dp])
            }
          }
        } else {
          return dp
        }
      })
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
      idb.updateDatapoint(state.datasetId, temp)
        .then(() => emitter.emit('data-point-changed', dataPoint.row, dataPoint.col))
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
    ON_HIDE_MARKERS_CHANGED_MUTATION: function (state, newHideMarkers) {
      state.hideMarkers = newHideMarkers
    },
    ON_GEOLOCATION_CHANGED_MUTATION: function (state, newGeolocation) {
      if (state.geolocation && newGeolocation) {
        const newObject = {
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
      Vue.set(state.dataset, 'uuid', newUuid)
    },
    ON_DATASET_COMMENT_CHANGED_MUTATION: function (state, newComment) {
      if (newComment === '') {
        newComment = null
      }
      idb.updateDatasetComment(state.datasetId, newComment)
      Vue.set(state.dataset, 'comment', newComment)
    },
    ON_VISIBLE_TRAITS_CHANGED_MUTATION: function (state, newVisibleTraits) {
      state.visibleTraits = newVisibleTraits
    },
    ON_IGNORE_EMPTY_CELLS_CHANGED_MUTATION: function (state, newIgnoreEmptyCells) {
      state.ignoreEmptyCells = newIgnoreEmptyCells
    },
    ON_DARK_MODE_CHANGED_MUTATION: function (state, newDarkMode) {
      state.darkMode = newDarkMode
    },
    ON_NAVIGATION_MODE_CHANGED_MUTATION: function (state, newNavigationMode) {
      if (!state.navigationMode) {
        Vue.set(state, 'navigationMode', newNavigationMode)
      } else {
        state.navigationMode = newNavigationMode
      }
    },
    ON_HIDE_CITATION_MESSAGE_CHANGED: function (state, newHideCitationMessage) {
      if (state.hideCitationMessage === undefined) {
        Vue.set(state, 'hideCitationMessage', newHideCitationMessage)
      } else {
        state.hideCitationMessage = newHideCitationMessage
      }
    },
    ON_CHANGELOG_VERSION_NUMBER_CHANGED_MUTATION: function (state, newChangelogVersionNumber) {
      if (state.changelogVersionNumber === undefined) {
        Vue.set(state, 'changelogVersionNumber', newChangelogVersionNumber)
      } else {
        state.changelogVersionNumber = newChangelogVersionNumber
      }
    }
  },
  actions: {
    setRunCount: function ({ commit }, runCount) {
      commit('ON_RUN_COUNT_CHANGED_MUTATION', runCount)
    },
    setUniqueClientId: function ({ commit }, uniqueClientId) {
      commit('ON_UNIQUE_CLIENT_ID_CHANGED_MUTATION', uniqueClientId)
    },
    loadDataset: function ({ commit }, event) {
      commit('ON_DATASET_LOAD_MUTATION', event)
    },
    addDataset: function ({ commit }, dataset) {
      commit('ON_DATASET_ADDED_MUTATION', dataset)
    },
    deleteDataset: function ({ commit }, datasetId) {
      commit('ON_DATASET_DELETED_MUTATION', datasetId)
    },
    resetDataset: function ({ commit }, datasetId) {
      emitter.emit('set-loading', true)
      commit('ON_DATASET_RESET_MUTATION', datasetId)
    },
    setDatasetData: function ({ commit }, update) {
      commit('ON_DATASET_DATE_UPDATED_MUTATION', update)
    },
    updateTraitBrapiIds: function ({ commit }, config) {
      commit('ON_TRAIT_BRAPI_IDS_CHANGED_MUTATION', config)
    },
    addTraitToDataset: function ({ commit }, config) {
      commit('ON_ADD_TRAIT_TO_DATASET_MUTATION', config)
      commit('ON_VISIBLE_TRAITS_CHANGED_MUTATION', null)
    },
    addGermplasmToSurveyDataset: function ({ commit }, config) {
      commit('ON_ADD_GERMPLASM_TO_SURVEY_DATASET_MUTATION', config)
      // commit('ON_DATASET_LOAD_MUTATION', { datasetId: config.datasetId, redirect: false })
    },
    resetGridScore: function ({ commit }) {
      emitter.emit('set-loading', true)
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
        commit('ON_DATASET_LOAD_MUTATION', { datasetId: null, redirect: true })
      }).finally(() => {
        emitter.emit('set-loading', false)
        emitter.emit('datasets-changed')
        emitter.emit('dataset-deleted')
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
    setCornerPointsAndMarkers: function ({ commit }, cornerPointsAndMarkers) {
      commit('ON_CORNER_POINTS_AND_MARKERS_CHANGED_MUTATION', cornerPointsAndMarkers)
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
    setPlausible: function ({ commit }, plausible) {
      commit('ON_PLAUSIBLE_CHANGED', plausible)
    },
    setDataPointTraitData: function ({ commit }, config) {
      commit('ON_DATA_POINT_TRAIT_DATA_CHANGED_MUTATION', config)
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
    setHideMarkers: function ({ commit }, hideMarkers) {
      commit('ON_HIDE_MARKERS_CHANGED_MUTATION', hideMarkers)
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
    setDatasetComment: function ({ commit }, comment) {
      commit('ON_DATASET_COMMENT_CHANGED_MUTATION', comment)
    },
    setVisibleTraits: function ({ commit }, visibleTraits) {
      commit('ON_VISIBLE_TRAITS_CHANGED_MUTATION', visibleTraits)
    },
    setIgnoreEmptyCells: function ({ commit }, ignoreEmptyCells) {
      commit('ON_IGNORE_EMPTY_CELLS_CHANGED_MUTATION', ignoreEmptyCells)
    },
    setDarkMode: function ({ commit }, darkMode) {
      commit('ON_DARK_MODE_CHANGED_MUTATION', darkMode)
    },
    setNavigationMode: function ({ commit }, navigationMode) {
      commit('ON_NAVIGATION_MODE_CHANGED_MUTATION', navigationMode)
    },
    setHideCitationMessage: function ({ commit }, showCitationMessage) {
      commit('ON_HIDE_CITATION_MESSAGE_CHANGED', showCitationMessage)
    },
    setChangelogVersionNumber: function ({ commit }, changelogVersionNumber) {
      commit('ON_CHANGELOG_VERSION_NUMBER_CHANGED_MUTATION', changelogVersionNumber)
    }
  },
  plugins: [createPersistedState({
    key: name,
    storage: {
      getItem: key => {
        let result = JSON.parse(localStorage.getItem(key))

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
                  const rowData = []

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

        result = Object.assign(JSON.parse(JSON.stringify(storeState.state)), result)

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
