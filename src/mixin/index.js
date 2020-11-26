import { mapGetters } from 'vuex'

const axios = require('axios').default

export default {
  data: function () {
    return {
      /** Default set of colors for charts */
      colors: ['#910080', '#ff7c00', '#5ec418', '#00a0f1', '#c5e000', '#ff007a', '#222183', '#c83831', '#fff600']
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'brapiConfig',
      'continuousInput',
      'dataset',
      'firstRun',
      'geolocation',
      'gridLinesEvery',
      'locale',
      'serverUrl',
      'useGps'
    ])
  },
  methods: {
    /**
     * Sends the currently selected dataset configuration to the server.
     * The server will respond with a UUID that uniquely identifies this configuration allowing to share it with other devices.
     * @returns Promise
     */
    postConfigForSharing: function () {
      return this.axios('config', this.dataset, 'post')
    },
    /**
     * Retrieves a dataset configuration from the server using a given UUID.
     * @param {String} uuid The UUID uniquely identifying a shared configuration
     * @returns Promise
     */
    getConfigFromSharing: function (uuid) {
      return this.axios(`config/${uuid}`)
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
        baseURL: this.serverUrl,
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
