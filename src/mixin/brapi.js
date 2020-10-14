const axios = require('axios').default

export default {
  data: function () {
    return {
      serverInfos: {
      }
    }
  },
  methods: {
    get: async function (url, callName, params = null, method = 'get', infoCheck = true) {
      const baseUrl = this.brapiConfig.url

      if (infoCheck && !this.serverInfos[baseUrl]) {
        await this.brapiGetInfo()
      }

      if (infoCheck) {
        if (!this.serverInfos[baseUrl] || !this.serverInfos[baseUrl].some(c => c.service === callName && c.versions.indexOf('2.0') !== -1)) {
          return Promise.reject(new Error(`BrAPI call not available for the given URL: ${callName}`))
        }
      }

      return axios({
        baseURL: this.brapiConfig ? this.brapiConfig.url : null,
        url: url,
        params: params,
        method: method,
        crossDomain: true,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      })
    },
    brapiGetVariables: function (page = 0, pageSize = 2147483647) {
      return this.get('variables', 'variables', { pageSize: pageSize, page: page })
    },
    brapiGetInfo: async function () {
      const url = '' + this.brapiConfig.url
      await this.get('serverinfo', 'serverinfo', 'get', null, false)
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
