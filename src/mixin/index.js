import { mapGetters } from 'vuex'

const axios = require('axios').default

export default {
  data: function () {
    return {
      colors: ['#910080', '#ff7c00', '#5ec418', '#00a0f1', '#c5e000', '#ff007a', '#222183', '#c83831', '#fff600']
    }
  },
  computed: {
    ...mapGetters([
      'brapiConfig',
      'dataset',
      'firstRun',
      'locale',
      'serverUrl',
      'useGps'
    ])
  },
  methods: {
    postConfigForSharing: function () {
      return this.axios('config', this.dataset, 'post')
    },
    getConfigFromSharing: function (uuid) {
      return this.axios(`config/${uuid}`)
    },
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
