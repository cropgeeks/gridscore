<template>
  <div>
    <b-button class="mb-3" @click="showBrapiSettings"><BIconGearFill /> {{ $t('buttonBrapiSettings') }}</b-button>

    <b-form @submit.prevent="onSubmit">
      <b-row>
        <b-col cols=12 md=4 lg=3>
          <b-form-group :label="$t('formLabelExportBrapiProgram')" label-for="program">
            <b-form-select id="program" :options="programOptions" v-model="selectedProgram" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=4 lg=3>
          <b-form-group :label="$t('formLabelExportBrapiTrial')" label-for="trial">
            <b-form-select id="trial" :options="trialOptions" v-model="selectedTrial" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=4 lg=3>
          <b-form-group :label="$t('formLabelExportBrapiStudy')" label-for="study">
            <b-form-select id="study" :options="studyOptions" v-model="selectedStudy" />
          </b-form-group>
        </b-col>
      </b-row>
    </b-form>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { BIconGearFill } from 'bootstrap-vue'

import { brapiGetPrograms, brapiGetTrials, brapiGetStudies, brapiDefaultCatchHandler } from '@/mixin/brapi'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconGearFill
  },
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
  watch: {
    selectedProgram: function () {
      this.selectedTrial = null

      this.updateTrials()
    },
    selectedTrial: function () {
      this.selectedStudy = null

      this.updateStudies()
    }
  },
  computed: {
    ...mapGetters([
      'storeBrapiConfig'
    ]),
    programOptions: function () {
      if (this.programs) {
        return this.programs.map(t => {
          return {
            value: t,
            text: t.programName
          }
        })
      } else {
        return []
      }
    },
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
    },
    studyOptions: function () {
      if (this.studies) {
        return this.studies.map(t => {
          return {
            value: t,
            text: t.studyName
          }
        })
      } else {
        return []
      }
    }
  },
  methods: {
    showBrapiSettings: function () {
      emitter.emit('show-brapi-settings')
    },
    updatePrograms: function () {
      brapiGetPrograms()
        .then(result => {
          this.programs = result

          if (result && result.length > 0) {
            this.selectedProgram = result[0]
          }
        })
        .catch(brapiDefaultCatchHandler)
    },
    updateTrials: function () {
      brapiGetTrials({
        programDbId: this.selectedProgram.programDbId
      })
        .then(result => {
          this.trials = result

          if (result && result.length > 0) {
            this.selectedTrial = result[0]
          }
        })
        .catch(brapiDefaultCatchHandler)
    },
    updateStudies: function () {
      brapiGetStudies({
        trialDbId: this.selectedTrial.trialDbId
      })
        .then(result => {
          this.studies = result

          if (result && result.length > 0) {
            this.selectedStudy = result[0]
          }
        })
        .catch(brapiDefaultCatchHandler)
    }
  },
  mounted: function () {
    this.updatePrograms()

    emitter.on('brapi-settings-changed', this.updatePrograms)
  },
  beforeDestroy: function () {
    emitter.off('brapi-settings-changed', this.updatePrograms)
  }
}
</script>

<style>

</style>
