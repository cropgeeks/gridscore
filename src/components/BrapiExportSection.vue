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
          <b-form-group :label="$t('formLabelExportBrapiStudyType')" label-for="studyType">
            <b-form-select id="studyType" :options="studyTypeOptions" v-model="selectedStudyType" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=4 lg=3>
          <b-form-group :label="$t('formLabelExportBrapiStudy')" label-for="study">
            <b-form-select id="study" :options="studyOptions" v-model="selectedStudy" />
          </b-form-group>
        </b-col>
      </b-row>

      <b-button variant="primary" :disabled="!canProceed">{{ $t('buttonSend') }}</b-button>
    </b-form>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { BIconGearFill } from 'bootstrap-vue'

import { brapiGetPrograms, brapiGetTrials, brapiGetStudies, brapiGetStudyTypes, brapiDefaultCatchHandler } from '@/mixin/brapi'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconGearFill
  },
  data: function () {
    return {
      selectedProgram: null,
      selectedTrial: null,
      selectedStudyType: null,
      selectedStudy: null,
      programs: [],
      trials: [],
      studyTypes: [],
      studies: []
    }
  },
  watch: {
    selectedProgram: function () {
      this.selectedTrial = null

      this.updateTrials()
    },
    selectedTrial: function () {
      this.selectedStudyType = null

      this.updateStudyTypes()
    },
    selectedStudyType: function () {
      this.selectedStudy = null

      this.updateStudies()
    }
  },
  computed: {
    ...mapGetters([
      'storeBrapiConfig'
    ]),
    canProceed: function () {
      return this.selectedProgram && this.selectedTrial && this.selectedStudyType && this.selectedStudy
    },
    programOptions: function () {
      if (this.programs) {
        return this.programs.map(t => {
          return {
            value: t,
            text: `${t.programDbId} - ${t.programName}`
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
            text: `${t.trialDbId} - ${t.trialName}`
          }
        })
      } else {
        return []
      }
    },
    studyTypeOptions: function () {
      if (this.studyTypes) {
        return this.studyTypes.map(t => {
          return {
            value: t,
            text: t
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
            text: `${t.studyDbId} - ${t.studyName}`
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
          } else {
            this.selectedProgram = null
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
          } else {
            this.selectedTrial = null
          }
        })
        .catch(brapiDefaultCatchHandler)
    },
    updateStudyTypes: function () {
      brapiGetStudyTypes()
        .then(result => {
          this.studyTypes = result

          if (result && result.length > 0) {
            if (result.includes('trials')) {
              this.selectedStudyType = 'trials'
            } else {
              this.selectedStudyType = result[0]
            }
          } else {
            this.selectedStudyType = null
          }
        })
        .catch(brapiDefaultCatchHandler)
    },
    updateStudies: function () {
      brapiGetStudies({
        studyType: this.selectedStudyType,
        trialDbId: this.selectedTrial.trialDbId
      })
        .then(result => {
          this.studies = result

          if (result && result.length > 0) {
            this.selectedStudy = result[0]
          } else {
            this.selectedStudy = null
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
