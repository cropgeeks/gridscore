import { mapGetters } from 'vuex'
const axios = require('axios').default

export default {
  data: function () {
    return {
      /** Store the `serverinfo` result for each BrAPI URL to know which calls are available */
      serverInfos: {
      }
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeBrapiConfig'
    ])
  },
  methods: {
    /**
     * Sends a BrAPI request to the server using the given parameter configuration
     * @param {String} url The requested (relative) server URL
     * @param {String} callName The BrAPI call name as returned from `serverinfo`
     * @param {Object} params (Optional) The request payload in the form of a Javascript object
     * @param {String} method (Optional) REST method (default: `'get'`)
     * @param {Boolean} infoCheck (Optional) Indicator whether the BrAPI server should be checked for availability of the requested endpoint. (default: `true`)
     * @returns Promise
     */
    get: async function (url, callName, params = null, method = 'get', infoCheck = true) {
      const baseUrl = this.storeBrapiConfig.url

      if (infoCheck && !this.serverInfos[baseUrl]) {
        await this.brapiGetInfo()
      }

      if (infoCheck) {
        if (!this.serverInfos[baseUrl] || !this.serverInfos[baseUrl].some(c => c.service === callName && c.versions.indexOf('2.0') !== -1)) {
          return Promise.reject(new Error(`BrAPI call not available for the given URL: ${callName}`))
        }
      }

      return axios({
        baseURL: this.storeBrapiConfig ? this.storeBrapiConfig.url : null,
        url: url,
        params: params,
        method: method,
        crossDomain: true,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      })
    },
    /**
     * Retrieves the observation variables on the BrAPI server
     * @param {Number} page (Optional) Page number (default: `0`)
     * @param {Number} pageSize (Optional) Page size (default: `2147483647`)
     * @returns Promise
     */
    brapiGetVariables: function (page = 0, pageSize = 2147483647) {
      return this.get('variables', 'variables', { pageSize: pageSize, page: page })
    },
    /**
     * Retrieves the `serverinfo` from the BrAPI server to check availability of certain endpoints. Sets the field `serverInfo` for this BrAPI server
     */
    brapiGetInfo: async function () {
      const url = '' + this.storeBrapiConfig.url
      await this.get('serverinfo', 'serverinfo', null, 'get', false)
        .then(result => {
          if (result && result.data && result.data.result) {
            this.serverInfos[url] = result.data.result.calls
          } else {
            this.serverInfos[url] = null
          }
        })
    }
  }
}
