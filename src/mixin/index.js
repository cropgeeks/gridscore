import { mapGetters } from 'vuex'

export default {
  data: function () {
    return {
      gridScoreVersion: '1.9.0',
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
    }
  }
}
