import { mapGetters } from 'vuex'

const axios = require('axios').default

export default {
  data: function () {
    return {
      gridScoreVersion: '1.7.0',
      multiTraitMethods: {
        // TODO: Handle dates!
        last: {
          text: this.$t('formSelectMultiTraitVizTypeLast'),
          value: 'last',
          call: (values) => (values && values.length > 0) ? values[values.length - 1] : null
        },
        avg: {
          text: this.$t('formSelectMultiTraitVizTypeAvg'),
          value: 'avg',
          call: (values) => (values && values.length > 0) ? (values.reduce((a, b) => a + b) / values.length) : null
        },
        sum: {
          text: this.$t('formSelectMultiTraitVizTypeSum'),
          value: 'sum',
          call: (values) => (values && values.length > 0) ? values.reduce((a, b) => a + b) : null
        }
      }
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeServerUrl'
    ])
  },
  methods: {
    getErrorMessage: function (err) {
      if (err && err.response && err.response.status) {
        switch (err.response.status) {
          case 404:
            return this.$t('axiosErrorConfigNotFound')
          case 500:
            return this.$t('axiosErrorGeneric500')
          default:
            return err
        }
      } else {
        return this.$t('axiosErrorNoInternet')
      }
    },
    getMultiTraitMethods: function (trait) {
      if (trait.type === 'int' || trait.type === 'float') {
        return Object.keys(this.multiTraitMethods).map(k => this.multiTraitMethods[k])
      } else {
        return [this.multiTraitMethods.last]
      }
    },
    getTouchPosition: function (e) {
      if (e.touches) {
        if (e.touches.length === 1) {
          // const rect = this.$refs.dataCanvas.getBoundingClientRect()
          return {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          }
        } else {
          return null
        }
      } else {
        return {
          x: e.offsetX,
          y: e.offsetY
        }
      }
    },
    /**
     * For the given trait, return the i18n text
     * @param trait The trait for which to return the text
     */
    getTraitTypeText: function (trait) {
      switch (trait.type) {
        case 'date':
          return this.$t('traitTypeDate')
        case 'int':
          return this.$t('traitTypeInt')
        case 'float':
          return this.$t('traitTypeFloat')
        case 'text':
          return this.$t('traitTypeText')
        case 'categorical':
          return this.$t('traitTypeCategorical')
        default:
          return null
      }
    },
    extractMultiTraitDatum: function (traitIndex, traitMType, multiTraitMethod, cell, isValue) {
      if (!cell) {
        return null
      }

      const data = isValue ? cell.values : cell.dates

      if (traitMType === 'multi') {
        return this.multiTraitMethods[multiTraitMethod].call(data[traitIndex])
      } else {
        return data[traitIndex] || null
      }
    },
    /**
     * Sends the currently selected dataset configuration to the server.
     * The server will respond with a UUID that uniquely identifies this configuration allowing to share it with other devices.
     * @returns Promise
     */
    postConfigForSharing: function (dataset, data, serverUuid, rows, cols) {
      let dataCopy = JSON.parse(JSON.stringify(dataset))
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
