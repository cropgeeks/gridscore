import { mapGetters } from 'vuex'

export default {
  data: function () {
    return {
      gridScoreVersion: '1.16.0',
      multiTraitMethods: {
        // TODO: Handle dates!
        last: {
          text: this.$t('formSelectMultiTraitVizTypeLast'),
          value: 'last',
          call: (values, dates, timepoint) => (values && values.length > 0) ? values[values.length - 1] : null
        },
        avg: {
          text: this.$t('formSelectMultiTraitVizTypeAvg'),
          value: 'avg',
          call: (values, dates, timepoint) => (values && values.length > 0) ? (values.reduce((a, b) => a + (+b), 0) / values.length) : null
        },
        sum: {
          text: this.$t('formSelectMultiTraitVizTypeSum'),
          value: 'sum',
          call: (values, dates, timepoint) => (values && values.length > 0) ? values.reduce((a, b) => a + (+b), 0) : null
        },
        timeline: {
          text: this.$t('formSelectMultiTraitVizTypeTimeline'),
          value: 'timeline',
          call: (values, dates, timepoint) => {
            if (values && values.length > 0) {
              let result = null
              for (let i = 0; i < dates.length; i++) {
                if (dates[i] <= timepoint) {
                  result = values[i]
                }
              }

              return result
            } else {
              return null
            }
          }
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
    plausibleEvent: function (name, props) {
      if (this.$plausible) {
        if (props) {
          this.$plausible.trackEvent(name, { props: props })
        } else {
          this.$plausible.trackEvent(name)
        }
      }
    },
    getErrorMessage: function (err) {
      if (err && err.response && err.response.status) {
        switch (err.response.status) {
          case 404:
            return this.$t('axiosErrorConfigNotFound')
          case 409:
            return this.$t('axiosErrorConflict')
          case 500:
            return this.$t('axiosErrorGeneric500')
          default:
            return err
        }
      } else {
        return this.$t('axiosErrorNoInternet')
      }
    },
    getMultiTraitMethods: function (trait, includeTimeline = false) {
      if (trait.type === 'int' || trait.type === 'float') {
        return Object.keys(this.multiTraitMethods).filter(m => m !== 'timeline' || includeTimeline).map(k => this.multiTraitMethods[k])
      } else {
        return [this.multiTraitMethods.last, this.multiTraitMethods.timeline]
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
    extractMultiTraitDatum: function (traitIndex, traitMType, timepoint, multiTraitMethod, cell, isValue) {
      if (!cell) {
        return null
      }

      let value
      let date

      if (traitMType === 'multi') {
        value = this.multiTraitMethods[multiTraitMethod].call(cell.values[traitIndex], cell.dates[traitIndex], timepoint)
        date = this.multiTraitMethods[multiTraitMethod].call(cell.dates[traitIndex], cell.dates[traitIndex], timepoint)
      } else {
        value = cell.values[traitIndex] || null
        date = cell.dates[traitIndex] || null
      }

      if (value !== undefined && value !== null) {
        return isValue ? value : date
      } else {
        return null
      }
    }
  }
}
