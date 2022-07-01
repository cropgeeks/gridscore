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
    synchronizeDataset: function (datasetId, redirect = false, override = false, priority = null) {
      return new Promise((resolve, reject) => {
        emitter.emit('set-loading', true)

        // First load the dataset from the database
        idb.getDataset(datasetId)
          .then(dataset => {
            // Then load its data
            idb.getDatasetData(dataset.id)
              .then(data => {
                // Reformat it
                const ds = JSON.parse(JSON.stringify(dataset))
                ds.data = new Map()

                for (let i = 0; i < data.length; i++) {
                  const dp = data[i]
                  ds.data.set(`${dp.row}-${dp.col}`, dp)
                }

                return ds
              })
              .then(dataCopy => {
                // Send it to the server
                return this.postConfigForSharing(override, priority, dataCopy, dataCopy.data, dataCopy.uuid, dataCopy.rows, dataCopy.cols)
              })
              .then(returnedData => {
                // This is the updated data
                if (returnedData && returnedData.data) {
                  // Set the local id to be safe
                  returnedData.data.id = dataset.id

                  if (returnedData.data.data) {
                    // Make sure to parse Multi-trait data/dates correctly
                    const traits = returnedData.data.traits
                    returnedData.data.data.forEach(r => {
                      r.forEach(c => {
                        if (c.values) {
                          c.values = c.values.map((dp, i) => {
                            if (traits[i].mType === 'multi') {
                              return JSON.parse(dp)
                            } else {
                              return dp
                            }
                          })
                        }
                        if (c.dates) {
                          c.dates = c.dates.map((dp, i) => {
                            if (traits[i].mType === 'multi') {
                              return JSON.parse(dp)
                            } else {
                              return dp
                            }
                          })
                        }
                      })
                    })
                  } else {
                    returnedData.data.data = []
                  }

                  // Save to database
                  this.$store.dispatch('updateDataset', { dataset: returnedData.data, redirect: redirect })

                  resolve(returnedData.data)
                }
              })
              .catch(err => {
                // Conflict due to structural change of trial
                if (err && err.response) {
                  if (err.response.status === 409) {
                    this.$bvModal.msgBoxConfirm(this.$t('modalTextConfigConflict'), {
                      title: this.$t('modalTitleConfigConflict'),
                      okTitle: this.$t('buttonYes'),
                      cancelTitle: this.$t('buttonCancel')
                    }).then(value => {
                      if (value) {
                        this.synchronizeDataset(datasetId, redirect, true)
                      }
                    })
                  } else if (err.response.status === 428) {
                    this.$bvModal.msgBoxConfirm(this.$t('modalTextConfigDecisionRequired'), {
                      title: this.$t('modalTitleConfigDecisionRequired'),
                      okTitle: this.$t('buttonMine'),
                      cancelTitle: this.$t('buttonTheirs'),
                      okVariant: 'primary',
                      cancelVariant: 'primary',
                      hideHeaderClose: false
                    }).then(value => {
                      if (value !== undefined && value !== null) {
                        this.synchronizeDataset(datasetId, redirect, false, value ? 'MINE' : 'THEIRS')
                      }
                    })
                  } else {
                    this.serverError = this.getErrorMessage(err)
                  }
                } else {
                  this.serverError = this.getErrorMessage(err)
                }

                reject(err)
              })
              .finally(() => emitter.emit('set-loading', false))
          })
      })
    },
    /**
     * Sends the currently selected dataset configuration to the server.
     * The server will respond with a UUID that uniquely identifies this configuration allowing to share it with other devices.
     * @returns Promise
     */
    postConfigForSharing: function (override = false, priority = null, dataset, data, serverUuid, rows, cols) {
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
          delete cellCopy.dsId
          rowData.push(cellCopy)
        }
        arrayData.push(rowData)
      }
      delete dataset.data
      dataset.data = arrayData
      if (serverUuid) {
        dataset.uuid = serverUuid
      }

      let query = `config?override=${override}`

      if (priority) {
        query += `&priority=${priority}`
      }

      return this.axios(query, dataset, 'post')
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
              const traits = result.data.traits
              result.data.data.forEach(r => {
                r.forEach(c => {
                  if (c.values) {
                    c.values = c.values.map((dp, i) => {
                      if (traits[i].mType === 'multi') {
                        return JSON.parse(dp)
                      } else {
                        return dp
                      }
                    })
                  }
                  if (c.dates) {
                    c.dates = c.dates.map((dp, i) => {
                      if (traits[i].mType === 'multi') {
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
