import { mapGetters } from 'vuex'
import store from '@/store'

const axios = require('axios').default

export default {
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeBrapiConfig',
      'storeColumnWidth',
      'storeCols',
      'storeContinuousInput',
      'storeCornerPoints',
      'storeDatasetId',
      'storeDatasetName',
      'storeGeolocation',
      'storeGridLinesEvery',
      'storeInvertView',
      'storeInvertNumberingX',
      'storeInvertNumberingY',
      'storeLocale',
      'storeRows',
      'storeServerUrl',
      'storeTraitColors',
      'storeTraits',
      'storeUseGps',
      'storeUseSpeech'
    ])
  },
  methods: {
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
    /**
     * Sends the currently selected dataset configuration to the server.
     * The server will respond with a UUID that uniquely identifies this configuration allowing to share it with other devices.
     * @returns Promise
     */
    postConfigForSharing: function () {
      return this.axios('config', store.getters.storeDataset, 'post')
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
