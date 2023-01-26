<template>
  <div>
    <b-form @submit.prevent="onSubmit">
      <b-row>
        <b-col cols=12 md=4 lg=3>
          <b-form-group :label="$t('formLabelExportBrapiTrial')" label-for="trial">
            <b-form-select id="trial" :options="trialOptions" v-model="selectedTrial" />
          </b-form-group>
        </b-col>
      </b-row>
    </b-form>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import brapi from '@/mixin/brapi'

export default {
  data: function () {
    return {
      selectedProgram: null,
      selectedTrial: null,
      selectedStudy: null,
      programs: [],
      trials: [],
      studies: []
    }
  },
  computed: {
    ...mapGetters([
      'storeBrapiConfig'
    ]),
    trialOptions: function () {
      if (this.trials) {
        return this.trials.map(t => {
          return {
            value: t,
            text: t.trialName
          }
        })
      } else {
        return []
      }
    }
  },
  mixins: [brapi],
  methods: {
    updatePrograms: function () {
      this.brapiGetPrograms()
        .then(result => {
          this.programs = result

          if (result && result.length > 0) {
            this.selectedProgram = result[0]
          }
        })
    },
    updateTrials: function () {
      this.brapiGetTrials()
        .then(result => {
          this.trials = result

          if (result && result.length > 0) {
            this.selectedTrial = result[0]
          }
        })
    },
    updateStudies: function () {
      this.brapiGetStudies()
        .then(result => {
          this.studies = result

          if (result && result.length > 0) {
            this.selectedStudy = result[0]
          }
        })
    }
  },
  mounted: function () {
  }
}
</script>

<style>

</style>
