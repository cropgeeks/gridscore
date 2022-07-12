<template>
  <div>
    <p>{{ $t('modalTextDataEntry') }}</p>
    <b-form @submit.prevent="$emit('submit')" :validated="formValidated">
      <b-form-group v-for="(mapping, index) in visibleTraitMapping"
                    :key="`trait-${index}`"
                    :label-for="`trait-${index}`"
                    :description="formDescriptions ? formDescriptions[index] : null">
        <!-- Show the trait name along with the type and its color as the label -->
        <template v-slot:label>
          <TraitHeading :trait="mapping.trait" :mode="(values[index] !== undefined && values[index] !== null && values[index] !== '') ? 'full' : 'empty'" />
        </template>

        <b-input-group>
          <b-input-group-prepend>
            <b-button @click="takeImage(index)"><BIconCameraFill /></b-button>
            <b-button @click="decrease(index)" v-if="mapping.trait.type === 'int'">-</b-button>
          </b-input-group-prepend>
          <DataEntryInput :index="index" :values="values" :trait="mapping.trait" :formState="formState"
                          @enter="traverseForm(index + 1)"
                          @handleDateInput="handleDateInput(index)"
                          @handleDateInputChar="event => handleDateInputChar(index, event)"
                          @onDateChanged="event => onDateChanged(event, index)"
                          @onValueChanged="event => onValueChanged(event, index)"
                          :id="`data-entry-field-${index}`"
                          :ref="`dataEntryInput-${index}`" />

          <b-input-group-append v-if="mapping.trait.type === 'date' || mapping.trait.mType === 'multi' || mapping.trait.type === 'int'">
            <template v-if="mapping.trait.type === 'date'">
              <b-button v-b-tooltip="$t('tooltipDataEntryDateMinusOne')" @click="setDateMinusOne(index)"><BIconCaretLeftFill /></b-button>
              <b-button v-b-tooltip="$t('tooltipDataEntryDateToday')" @click="setDateToday(index)"><BIconCalendar3 /></b-button>
              <b-button v-b-tooltip="$t('tooltipDataEntryDatePlusOne')" @click="setDatePlusOne(index)"><BIconCaretRightFill /></b-button>
              <b-button v-b-tooltip="$t('tooltipDataEntryDateReset')" variant="danger" @click="resetDate(index)"><BIconSlashCircle /></b-button>
            </template>
            <b-button v-if="mapping.trait.type === 'int'" @click="increment(index)">+</b-button>
            <b-button v-if="mapping.trait.mType === 'multi' && formDescriptions && formDescriptions[index]" v-b-tooltip="$t('tooltipDataEntryMultiTraitShowValues')" variant="secondary" @click="showMultiTraitModal(index)"><BIconInfoCircle /></b-button>
          </b-input-group-append>
        </b-input-group>
      </b-form-group>

      <!-- User comments -->
      <b-form-group label-for="comment">
        <template v-slot:label>
          <BIconChatRightTextFill /> {{ $t('formLabelComment') }}
        </template>
        <b-input-group>
          <b-form-textarea rows="3" v-model="comment" id="comment" />
          <b-input-group-addon append v-if="supportsSpeechRecognition">
            <b-button @click="toggleRecording" :variant="speechRecognition ? 'danger' : null" v-b-tooltip="$t('tooltipDataEntryCommentMicrophone')"><BIconMic /></b-button>
          </b-input-group-addon>
        </b-input-group>
      </b-form-group>
    </b-form>

    <b-button-group id="tag-buttons">
      <!-- Show a button for image tagging -->
      <b-button @click="takeImage(null)"><BIconCameraFill/> {{ $t('buttonTakePhoto') }}</b-button>
      <!-- Show a button for video tagging -->
      <b-button @click="$refs.videoModal.show()"><BIconCameraVideoFill/> {{ $t('buttonTakeVideo') }}</b-button>
    </b-button-group>
    <!-- Image tagging modal -->
    <ImageModal :row="row" :col="col" :preferredTrait="preferredTrait" :name="name" ref="imageModal" />
    <!-- Video tagging modal -->
    <VideoModal :name="name" ref="videoModal" />
    <!-- Modal showing all previously recorded values of a multi trait -->
    <MultiTraitValueModal :traitIndex="multiTraitIndex" :row="row" :col="col" ref="multiTraitValueModal" v-if="multiTraitIndex !== null" @data-changed="multiTraitDataChanged" />

    <Tour :steps="tourSteps" :resetOnRouterNav="true" :hideBackButton="false" ref="dataEntryTour" />
  </div>
</template>

<script>
import Vue from 'vue'
import Tour from '@/components/Tour'
import ImageModal from '@/components/modals/ImageModal'
import VideoModal from '@/components/modals/VideoModal'
import DataEntryInput from '@/components/DataEntryInput'
import MultiTraitValueModal from '@/components/modals/MultiTraitValueModal'
import TraitHeading from '@/components/TraitHeading'
import { mapGetters } from 'vuex'
import { BIconCameraFill, BIconMic, BIconInfoCircle, BIconChatRightTextFill, BIconCaretLeftFill, BIconCaretRightFill, BIconCameraVideoFill, BIconCalendar3, BIconSlashCircle } from 'bootstrap-vue'

const emitter = require('tiny-emitter/instance')

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export default {
  components: {
    BIconCameraFill,
    BIconCaretLeftFill,
    BIconCaretRightFill,
    BIconChatRightTextFill,
    BIconInfoCircle,
    BIconCalendar3,
    BIconMic,
    BIconSlashCircle,
    BIconCameraVideoFill,
    DataEntryInput,
    ImageModal,
    MultiTraitValueModal,
    VideoModal,
    Tour,
    TraitHeading
  },
  props: {
    /** The row of the current data point */
    row: {
      type: Number,
      default: null
    },
    /** The col of the current data point */
    col: {
      type: Number,
      default: null
    },
    isMarked: {
      type: Boolean,
      default: false
    },
    isGuidedWalk: {
      type: Boolean,
      default: false
    }
  },
  data: function () {
    return {
      values: [],
      dates: [],
      name: null,
      comment: null,
      imageFile: null,
      imageData: null,
      formValidated: false,
      formState: [],
      formDescriptions: [],
      textSynth: null,
      speechRecognition: null,
      dateInput: '',
      dateInputIndex: null,
      multiTraitIndex: null,
      preferredTrait: null,
      tourSteps: [{
        title: () => this.$t('tourTitleDataEntryStart'),
        text: () => this.$t('tourTextDataEntryStart'),
        target: () => '#data-entry-modal',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataEntryInput'),
        text: () => this.$t('tourTextDataEntryInput'),
        target: () => '#data-entry-field-0',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataEntryComment'),
        text: () => this.$t('tourTextDataEntryComment'),
        target: () => '#comment',
        position: 'top'
      }, {
        title: () => this.$t('tourTitleDataEntryTagImageVideo'),
        text: () => this.$t('tourTextDataEntryTagImageVideo'),
        target: () => '#tag-buttons',
        position: 'top'
      }, {
        title: () => this.$t('tourTitleDataEntryGuidedWalk'),
        text: () => this.$t('tourTextDataEntryGuidedWalk'),
        target: () => '#guided-walk-toggle',
        position: 'top'
      }, {
        title: () => this.$t('tourTitleDataEntryBookmark'),
        text: () => this.$t('tourTextDataEntryBookmark'),
        target: () => '#data-entry-header',
        position: 'bottom'
      }]
    }
  },
  computed: {
     /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeGeolocation',
      'storeHideToggledTraits',
      'storeLocale',
      'storeTraitColors',
      'storeTraits',
      'storeUseGps',
      'storeUseSpeech',
      'storeVisibleTraits'
    ]),
    supportsSpeechRecognition: function () {
      return SpeechRecognition !== undefined && SpeechRecognition !== null
    },
    visibleTraitMapping: function () {
      const result = []

      this.storeTraits.forEach((t, index) => {
        if (!this.storeHideToggledTraits || this.storeVisibleTraits[index]) {
          result.push({
            trait: t,
            index: index
          })
        }
      })

      return result
    }
  },
  watch: {
    storeUseSpeech: function (newValue) {
      if (newValue) {
        this.textSynth = window.speechSynthesis
      } else {
        this.textSynth = null
      }
    }
  },
  methods: {
    takeImage: function (index) {
      if (index !== null) {
        this.preferredTrait = this.visibleTraitMapping[index].index
      } else {
        this.preferredTrait = null
      }

      this.$nextTick(() => this.$refs.imageModal.show())
    },
    showTour: function () {
      this.$refs.dataEntryTour.start()
    },
    updateFormDescriptions: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (this.visibleTraitMapping && storeData && this.row !== null && this.col !== null) {
        const dp = storeData.get(`${this.row}-${this.col}`)
        this.formDescriptions = this.visibleTraitMapping.map(t => {
          if (t.trait.mType === 'multi') {
            const values = dp.values[t.index]
            const dates = dp.dates[t.index]
            const prevValue = (values && values.length > 0) ? values[values.length - 1] : null
            const prevDate = (dates && dates.length > 0) ? new Date(dates[dates.length - 1]).toLocaleDateString() : null
            if (prevValue !== null) {
              return this.$t('formDescriptionDataEntryMultiPrevValue', { prevValue: t.trait.type === 'date' ? new Date(prevValue).toLocaleDateString() : prevValue, date: prevDate })
            } else {
              return null
            }
          } else {
            return null
          }
        })
      } else {
        this.formDescriptions = null
      }
    },
    multiTraitDataChanged: function (values, dates) {
      this.$store.commit('ON_DATA_POINT_TRAIT_DATA_CHANGED_MUTATION', {
        traitIndex: this.multiTraitIndex,
        values: values,
        dates: dates,
        row: this.row,
        col: this.col
      })
      this.updateFormDescriptions()
    },
    showMultiTraitModal: function (index) {
      this.multiTraitIndex = this.visibleTraitMapping[index].index

      this.$nextTick(() => this.$refs.multiTraitValueModal.show())
    },
    toggleRecording: function () {
      if (this.supportsSpeechRecognition) {
        if (this.speechRecognition) {
          this.disableSpeechRecognition()
        } else {
          // eslint-disable-next-line new-cap
          this.speechRecognition = new SpeechRecognition()
          this.speechRecognition.continuous = true
          this.speechRecognition.interimResults = true
          this.speechRecognition.lang = this.storeLocale ? this.storeLocale.replace('_', '-') : 'en-GB'

          this.speechRecognition.start()
          this.speechRecognition.onresult = event => {
            let result = ''

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              result += event.results[i][0].transcript
            }
            this.comment = result
          }
          this.speechRecognition.onspeechend = event => {
            this.speechRecognition.stop()
            this.speechRecognition = null
          }
        }
      }

      this.plausibleEvent('data-input', { type: 'speech-recognition' })
    },
    decrease: function (index) {
      let newValue
      if (this.values && this.values[index] !== null && this.values[index] !== '') {
        newValue = this.values[index] - 1
      } else {
        newValue = -1
      }

      if (this.storeTraits[index].restrictions) {
        const min = this.storeTraits[index].restrictions.min
        const max = this.storeTraits[index].restrictions.max
        if (min !== undefined && min !== null) {
          newValue = Math.max(min, newValue)
        }
        if (max !== undefined && max !== null) {
          newValue = Math.min(max, newValue)
        }
      }
      Vue.set(this.values, index, newValue)
    },
    increment: function (index) {
      let newValue
      if (this.values && this.values[index] !== null && this.values[index] !== '') {
        newValue = this.values[index] + 1
      } else {
        newValue = 1
      }

      if (this.storeTraits[index].restrictions) {
        const min = this.storeTraits[index].restrictions.min
        const max = this.storeTraits[index].restrictions.max
        if (min !== undefined && min !== null) {
          newValue = Math.max(min, newValue)
        }
        if (max !== undefined && max !== null) {
          newValue = Math.min(max, newValue)
        }
      }
      Vue.set(this.values, index, newValue)
    },
    handleDateInput: function (index) {
      if (this.dateInput.length > 0 && !isNaN(this.dateInput)) {
        const number = +this.dateInput

        const current = this.getToday()
        current.setDate(current.getDate() + number)

        Vue.set(this.values, index, current.toISOString().split('T')[0])

        this.dateInput = ''
        this.dateInputIndex = null
      }

      this.traverseForm(index + 1)
    },
    handleDateInputChar: function (index, event) {
      if (this.dateInputIndex !== index) {
        this.dateInputIndex = index
        this.dateInput = ''
      }

      // If this could be part of a number, append to existing string
      if (event.key === '-' || event.key === '+' || !isNaN(event.key)) {
        this.dateInput += event.key
      }
    },
    disableSpeechRecognition: function () {
      if (this.speechRecognition) {
        this.speechRecognition.stop()
        this.speechRecognition = null
      }
    },
    setDateMinusOne: function (index) {
      let current = this.values[index]

      if (current === undefined || current === null || current === '') {
        current = this.getToday()
      } else {
        current = new Date(current)
      }

      current.setDate(current.getDate() - 1)

      Vue.set(this.values, index, current.toISOString().split('T')[0])

      const diffDays = Math.floor((new Date() - current) / (1000 * 60 * 60 * 24))
      if (diffDays > -14 && diffDays < 0) {
        this.speak(this.$tc('ttsDaysIn', Math.abs(diffDays)))
      } else if (diffDays < 14) {
        this.speak(this.$tc('ttsDaysAgo', Math.abs(diffDays)))
      } else {
        this.speak(current.toISOString().split('T')[0])
      }
    },
    setDatePlusOne: function (index) {
      let current = this.values[index]

      if (current === undefined || current === null || current === '') {
        current = this.getToday()
      } else {
        current = new Date(current)
      }

      current.setDate(current.getDate() + 1)

      Vue.set(this.values, index, current.toISOString().split('T')[0])

      const diffDays = Math.floor((new Date() - current) / (1000 * 60 * 60 * 24))
      if (diffDays > -14 && diffDays < 0) {
        this.speak(this.$tc('ttsDaysIn', Math.abs(diffDays)))
      } else if (diffDays < 14) {
        this.speak(this.$tc('ttsDaysAgo', Math.abs(diffDays)))
      } else {
        this.speak(current.toISOString().split('T')[0])
      }
    },
    resetDate: function (index) {
      Vue.set(this.values, index, null)
    },
    setDateToday: function (index) {
      Vue.set(this.values, index, this.getTodayString())

      this.traverseForm(index + 1)

      this.speak(this.$tc('ttsDaysAgo', 0))
    },
    getToday: function () {
      const today = new Date()
      const offset = today.getTimezoneOffset()
      return new Date(today.getTime() + (offset * 60 * 1000))
    },
    getTodayString: function () {
      return this.getToday().toISOString().split('T')[0]
    },
    reset: function () {
      this.formValidated = false
      this.formState = this.visibleTraitMapping.map(t => null)
      this.imageFile = null
      this.imageData = null
      if (this.col !== null && this.row !== null) {
        const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
        const dp = storeData.get(`${this.row}-${this.col}`)
        this.values = this.visibleTraitMapping.map(t => t.trait.mType === 'multi' ? null : dp.values[t.index])
        this.dates = this.visibleTraitMapping.map(t => t.trait.mType === 'multi' ? null : dp.dates[t.index])
        this.name = dp.name
        this.comment = dp.comment

        this.updateFormDescriptions()
        this.speak(this.name, false)
        this.speak(this.visibleTraitMapping[0].trait.name, false)
        this.setFocus()
      }
    },
    speak: function (text, interruptPrev = true) {
      if (this.textSynth) {
        if (interruptPrev) {
          this.textSynth.cancel()
        }

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 1.2
        this.textSynth.speak(utterance)
      }
    },
    /**
     * Sets focus to the first trait input
     */
    setFocus: function () {
      this.$nextTick(() => {
        if (this.$refs['dataEntryInput-0'][0].$refs.traitInput && this.$refs['dataEntryInput-0'][0].$refs.traitInput.focus) {
          this.$refs['dataEntryInput-0'][0].$refs.traitInput.focus()
        }
        if (this.$refs['dataEntryInput-0'][0].$refs.traitInput && this.$refs['dataEntryInput-0'][0].$refs.traitInput.select) {
          this.$refs['dataEntryInput-0'][0].$refs.traitInput.select()
        }
      })
    },
    /**
     * Traverses the form and focusses the next input field in turn based on the given index
     * @param newIndex The index of the next field (the method will internally modulo this to stay in range)
     */
    traverseForm: function (newIndex) {
      const oldIndex = newIndex - 1

      this.speak(this.values[oldIndex])

      // If the next ref exists and it has a focus method, call it
      if (newIndex < this.visibleTraitMapping.length) {
        if (this.$refs[`dataEntryInput-${newIndex}`][0].$refs.traitInput) {
          if (this.$refs[`dataEntryInput-${newIndex}`][0].$refs.traitInput.focus) {
            this.$refs[`dataEntryInput-${newIndex}`][0].$refs.traitInput.focus()
          }
          if (this.$refs[`dataEntryInput-${newIndex}`][0].$refs.traitInput.select) {
            this.$refs[`dataEntryInput-${newIndex}`][0].$refs.traitInput.select()
          }

          this.speak(this.visibleTraitMapping[newIndex].trait.name)
        }
      } else {
        if (this.isGuidedWalk) {
          // Automatically call submit
          this.$emit('submit')
        }
      }
    },
    onValueChanged: function (event, index) {
      if (event === null || event === undefined || event === '') {
        this.values[index] = null
        this.dates[index] = this.getTodayString()
      } else {
        let dp

        if (this.visibleTraitMapping[index].trait.type === 'int' || this.visibleTraitMapping[index].trait.type === 'float') {
          dp = +event
        } else {
          dp = event
        }

        Vue.set(this.values, index, dp)
        this.traverseForm(index + 1)
      }
    },
    /**
     * Handle date change events
     * @param event The native event
     * @param index The trait index
     */
    onDateChanged: function (event, index) {
      // If the input is something that would be considered "empty", reset the value and date
      if (event === null || event === undefined || event === '') {
        this.values[index] = null
        this.dates[index] = this.getTodayString()
      } else {
        Vue.set(this.values, index, event)
        Vue.set(this.dates, index, this.getTodayString())
        this.traverseForm(index + 1)
      }
    },
    verify: function (verifyCallback) {
      this.formState = this.visibleTraitMapping.map((t, i) => {
        let valid
        if (this.values[i] === '' || this.values[i] === null) {
          valid = true
        } else if (t.trait.restrictions) {
          if (t.trait.type === 'categorical') {
            // Check whether the value is one of the pre-defined categories
            return t.trait.restrictions.categories.indexOf(this.values[i]) !== -1
          } else if (t.trait.type === 'int' || t.trait.type === 'float') {
            // Check whether the value lies between the required min and max
            valid = true
            if (t.trait.restrictions.min !== undefined && t.trait.restrictions.min !== null && t.trait.restrictions.min > this.values[i]) {
              valid = false
            }
            if (t.trait.restrictions.max !== undefined && t.trait.restrictions.max !== null && t.trait.restrictions.max < this.values[i]) {
              valid = false
            }

            return valid
          }
        }

        if (t.trait.type === 'int') {
          try {
            const int = Number(this.values[i])
            if (isNaN(this.values[i]) || isNaN(int) || !Number.isInteger(int)) {
              valid = false
            }
          } catch (err) {
            valid = false
          }
        }

        return valid
      })

      // If the form is invalid, return
      this.formValidated = true
      for (let i = 0; i < this.formState.length; i++) {
        if (this.formState[i] === false) {
          verifyCallback(false)
          return
        }
      }

      this.values.forEach((v, i) => {
        // Ignore empty values, set them to null
        if (this.values[i] === '' || this.values[i] === null) {
          this.values[i] = null

          if (this.visibleTraitMapping[i].trait.mType === 'multi') {
            this.dates[i] = null
          } else {
            // Now we need to check whether this used to have a value or not.
            const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
            const dp = storeData.get(`${this.row}-${this.col}`)
            const oldValue = dp.values[this.visibleTraitMapping[i].index]

            if (oldValue !== undefined && oldValue !== null) {
              this.dates[i] = this.getTodayString()
            } else {
              this.dates[i] = null
            }
          }
          verifyCallback(false)
          return
        }

        // if (this.visibleTraitMapping[i].trait.type === 'date') {
        //   // If the trait a date, simply set the date to the value
        //   this.dates[i] = this.values[i]
        // } else
        if (this.values[i] !== null && this.dates[i] === null) {
          // If there is a value and no date, set the date as now
          this.dates[i] = this.getTodayString()
        }
      })

      // Only store the comment if it's not empty
      const comment = (this.comment !== undefined && this.comment !== null && this.comment.length > 0) ? this.comment : null

      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      const dp = storeData.get(`${this.row}-${this.col}`)
      const finalValues = JSON.parse(JSON.stringify(dp.values))
      const finalDates = JSON.parse(JSON.stringify(dp.dates))

      this.visibleTraitMapping.forEach((t, index) => {
        finalValues[t.index] = this.values[index]
        finalDates[t.index] = this.dates[index]
      })

      // Update the store with the newly set data point
      this.$store.commit('ON_DATA_POINT_CHANGED_MUTATION', {
        row: this.row,
        col: this.col,
        name: this.name,
        isMarked: this.isMarked,
        values: finalValues,
        dates: finalDates,
        geolocation: this.storeUseGps ? this.storeGeolocation : null,
        comment: comment
      })

      emitter.emit('data-point-changed', this.row, this.col)
      verifyCallback(true)
    }
  },
  created: function () {
    if (this.storeUseSpeech && window.speechSynthesis) {
      this.textSynth = window.speechSynthesis
    }
  },
  mounted: function () {
    this.reset()

    emitter.on('show-data-entry-tour', this.showTour)
  },
  beforeDestroy: function () {
    emitter.off('show-data-entry-tour', this.showTour)
  }
}
</script>

<style>
.input-group .btn-group:not(:last-child) > .btn:last-child {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.category-options .btn {
  text-transform: none;
}
</style>
