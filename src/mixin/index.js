import { mapGetters } from 'vuex'

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
      'useGps'
    ])
  }
}
