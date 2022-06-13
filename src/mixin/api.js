import idb from '@/plugins/idb'

const emitter = require('tiny-emitter/instance')

const axios = require('axios').default

export default {
  data: function () {
    return {
      serverError: null
    }
  },
  methods: {
    onLoad: function (dataset) {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextReplaceDatasets'), {
        title: this.$t('modalTitleReplaceDatasets'),
        okTitle: this.$t('buttonReplace'),
        cancelTitle: this.$t('buttonCancel')
      }).then(value => {
        if (value) {
          if (typeof dataset === 'number' || dataset instanceof Number) {
            this.loadDataById(dataset)
          } else {
            this.loadData(dataset)
          }
        }
      })
    },
    onSave: function (dataset) {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextSaveToServerWarning'), {
        title: this.$t('modalTitleSaveToServerWarning'),
        okTitle: this.$t('buttonSave'),
        cancelTitle: this.$t('buttonCancel')
      }).then(value => {
        if (value) {
          if (typeof dataset === 'number' || dataset instanceof Number) {
            this.sendDataById(dataset)
          } else {
            this.sendData(dataset)
          }
        }
      })
    },
    loadDataById: function (datasetId) {
      idb.getDataset(datasetId)
        .then(dataset => {
          this.loadData(dataset)
        })
    },
    loadData: function (dataset) {
      emitter.emit('set-loading', true)
      this.getConfigFromSharing(dataset.uuid)
        .then(result => {
          if (result) {
            result.id = dataset.id
            this.$store.dispatch('updateDataset', result)
          }
        })
        .catch(err => {
          this.serverError = this.getErrorMessage(err)
        })
        .finally(() => {
          emitter.emit('dataset-loaded-remotely', dataset.id)
          emitter.emit('set-loading', false)
        })
    },
    sendDataById: function (datasetId) {
      idb.getDataset(datasetId)
        .then(dataset => {
          this.sendData(dataset)
        })
    },
    sendData: function (dataset, callback) {
      emitter.emit('set-loading', true)

      idb.getDatasetData(dataset.id)
        .then(data => {
          const ds = JSON.parse(JSON.stringify(dataset))
          ds.data = new Map()

          for (let i = 0; i < data.length; i++) {
            const dp = data[i]
            ds.data.set(`${dp.row}-${dp.col}`, dp)
          }

          return ds
        })
        .then((dataCopy) => this.postConfigForSharing(dataCopy, dataCopy.data, dataCopy.uuid, dataCopy.rows, dataCopy.cols))
        .then(result => {
          if (callback) {
            callback(result.data)
          }
        })
        .catch(err => {
          this.serverError = this.getErrorMessage(err)
        })
        .finally(() => emitter.emit('set-loading', false))
    },
    /**
     * Sends the currently selected dataset configuration to the server.
     * The server will respond with a UUID that uniquely identifies this configuration allowing to share it with other devices.
     * @returns Promise
     */
    postConfigForSharing: function (dataset, data, serverUuid, rows, cols) {
      const dataCopy = JSON.parse(JSON.stringify(dataset))
      const arrayData = []
      for (let row = 0; row < rows; row++) {
        const rowData = []
        for (let col = 0; col < cols; col++) {
          const cellCopy = JSON.parse(JSON.stringify(data.get(`${row}-${col}`)))
          // Stringify them so that both individual values and arrays are accepted by the backend
          if (cellCopy.dates) {
            cellCopy.dates = cellCopy.dates.map((dp, i) => {
              if (dataCopy.traits[i].mType === 'multi') {
                return dp !== null ? JSON.stringify(dp) : null
              } else {
                return dp
              }
            })
          }
          if (cellCopy.values) {
            cellCopy.values = cellCopy.values.map((dp, i) => {
              if (dataCopy.traits[i].mType === 'multi') {
                return dp !== null ? JSON.stringify(dp) : null
              } else {
                return dp
              }
            })
          }
          rowData.push(cellCopy)
        }
        arrayData.push(rowData)
      }
      delete dataset.data
      dataset.data = arrayData
      if (serverUuid) {
        dataset.uuid = serverUuid
      }

      return this.axios('config', dataset, 'post')
    },
    /**
     * Retrieves a dataset configuration from the server using a given UUID.
     * @param {String} uuid The UUID uniquely identifying a shared configuration
     * @returns Promise
     */
    getConfigFromSharing: function (uuid) {
      return this.axios(`config/${uuid}`)
        .then(result => {
          if (result && result.data) {
            if (result.data.data) {
              result.data.data.forEach(r => {
                r.forEach(c => {
                  if (c.values) {
                    c.values = c.values.map(dp => {
                      if (dp !== null && dp.indexOf('[') === 0 && dp.indexOf(']') === dp.length - 1) {
                        return JSON.parse(dp)
                      } else {
                        return dp
                      }
                    })
                  }
                  if (c.dates) {
                    c.dates = c.dates.map(dp => {
                      if (dp !== null && dp.indexOf('[') === 0 && dp.indexOf(']') === dp.length - 1) {
                        return JSON.parse(dp)
                      } else {
                        return dp
                      }
                    })
                  }
                })
              })
            } else {
              result.data.data = []
            }
            return result.data
          } else {
            return null
          }
        })
    },
    getDatasetUpdatesAvailable: function (request) {
      return this.axios('config/checkupdate', request, 'post')
    },
    getServerSettings: function () {
      return this.axios('settings')
    },
    /**
     * Sends an axios REST request to the server with the given parameter configuration
     * @param {String} url The remote URL (relative) to send the request to
     * @param {Object} params (Optional) Request payload in the form of a Javascript object
     * @param {String} method (Optional) REST method (default: `'get'`)
     * @returns Promise
     */
    axios: function (url, params = null, method = 'get') {
      let requestData = null
      let requestParams = null

      // Stringify the data object for non-GET requests
      if (params !== null || params !== undefined) {
        if (method === 'get') {
          requestParams = params
        } else {
          requestData = params
        }
      }

      return axios({
        baseURL: this.storeServerUrl,
        url: url,
        params: requestParams,
        data: requestData,
        method: method,
        crossDomain: true,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      })
    }
  }
}
