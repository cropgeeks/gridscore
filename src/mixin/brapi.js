import Vue from 'vue'
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
        if (!this.serverInfos[baseUrl] || !this.serverInfos[baseUrl].some(c => c.service === callName && c.versions.indexOf('2.1') !== -1)) {
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
     * @returns Promise
     */
    brapiGetVariables: function () {
      return this.get('variables', 'variables', null, 'get', true)
        .then(result => {
          if (result && result.data && result.data.result && result.data.result.data) {
            return result.data.result.data
          } else {
            return []
          }
        })
    },
    /**
     * Retrieves the programs on the BrAPI server
     * @param {*} params The query parameters
     * @returns Promise
     */
    brapiGetPrograms: function (params) {
      return this.get('programs', 'programs', params, 'get', true)
        .then(result => {
          if (result && result.data && result.data.result && result.data.result.data) {
            return result.data.result.data
          } else {
            return []
          }
        })
    },
    /**
     * Retrieves the trials on the BrAPI server
     * @param {*} params The query parameters
     * @returns Promise
     */
    brapiGetTrials: function (params) {
      return this.get('trials', 'trials', params, 'get', true)
        .then(result => {
          if (result && result.data && result.data.result && result.data.result.data) {
            return result.data.result.data
          } else {
            return []
          }
        })
    },
    /**
     * Retrieves the studies on the BrAPI server
     * @param {*} params The query parameters
     * @returns Promise
     */
    brapiGetStudies: function (params) {
      return this.get('studies', 'studies', params, 'get', true)
        .then(result => {
          if (result && result.data && result.data.result && result.data.result.data) {
            return result.data.result.data
          } else {
            return []
          }
        })
    },
    /**
     * Retrieves the `serverinfo` from the BrAPI server to check availability of certain endpoints. Sets the field `serverInfo` for this BrAPI server
     */
    brapiGetInfo: async function () {
      const url = '' + this.storeBrapiConfig.url
      await this.get('serverinfo', 'serverinfo', null, 'get', false)
        .then(result => {
          if (result && result.data && result.data.result) {
            Vue.set(this.serverInfos, url, result.data.result.calls)
          } else {
            Vue.set(this.serverInfos, url, null)
          }
        })
    }
  }
}
