<template>
  <b-modal :title="name"
           :ok-title="$t('buttonOk')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent="onSubmit"
           @shown="setFocus"
           ref="dataPointModal">
    <b-form @submit.prevent="onSubmit" :validated="formValidated">
      <b-form-group v-for="(trait, index) in dataset.traits"
                    :key="`trait-${index}`"
                    :label-for="`trait-${index}`">
        <!-- Show the trait name along with the type and its color as the label -->
        <template v-slot:label>
          <span :style="{ color: colors[index % colors.length] }"><BIconCircleFill /> {{ trait.name }}<b-badge variant="light" class="ml-1">{{ getTraitTypeText(trait) }}</b-badge></span>
        </template>

        <!-- For date types, show a datepicker -->
        <b-form-datepicker v-if="trait.type === 'date'"
                           :id="`trait-${index}`"
                           :ref="`trait-${index}`"
                           :state="formState[index]"
                           @keyup.enter="traverseForm(index + 1)"
                           v-model="values[index]"
                           reset-button
                           :reset-value="null"
                           @input="(event) => onDateChanged(event, index)"/>
        <!-- For int types, show a number input, apply restrictions -->
        <b-form-input      v-else-if="trait.type === 'int'"
                           :id="`trait-${index}`"
                           :ref="`trait-${index}`"
                           :state="formState[index]"
                           @keyup.enter="traverseForm(index + 1)"
                           v-model.number="values[index]"
                           type="number"
                           :min="(trait.restrictions && trait.restrictions.min !== null && trait.restrictions.min !== undefined) ? trait.restrictions.min : null"
                           :max="(trait.restrictions && trait.restrictions.max !== null && trait.restrictions.max !== undefined) ? trait.restrictions.max : null" />
        <!-- For float types, show a number input, apply restrictions -->
        <b-form-input      v-else-if="trait.type === 'float'"
                           :id="`trait-${index}`"
                           :ref="`trait-${index}`"
                           :state="formState[index]"
                           @keyup.enter="traverseForm(index + 1)"
                           v-model.number="values[index]"
                           type="number"
                           :min="(trait.restrictions && trait.restrictions.min !== null && trait.restrictions.min !== undefined) ? trait.restrictions.min : null"
                           :max="(trait.restrictions && trait.restrictions.max !== null && trait.restrictions.max !== undefined) ? trait.restrictions.max : null"
                           :step="0.02" />
        <!-- For text types, show a simple input field -->
        <b-form-input      v-else-if="trait.type === 'text'"
                           :id="`trait-${index}`"
                           :ref="`trait-${index}`"
                           :state="formState[index]"
                           @keyup.enter="traverseForm(index + 1)"
                           v-model="values[index]"
                           type="text" />
        <!-- For categorical traits -->
        <template v-if="trait.type === 'categorical' && trait.restrictions && trait.restrictions.categories">
          <!-- If there are more than 3 options, show a dropdown select -->
          <b-form-select   v-if="trait.restrictions.categories.length > 3"
                           :id="`trait-${index}`"
                           :ref="`trait-${index}`"
                           :state="formState[index]"
                           @keyup.enter="traverseForm(index + 1)"
                           v-model="values[index]"
                           :options="[{ value: null, text: $t('formSelectCategory') }, ...trait.restrictions.categories]" />
          <!-- Else show a button group for easier selection -->
          <b-form-radio-group v-else
                           :id="`trait-${index}`"
                           :ref="`trait-${index}`"
                           :state="formState[index]"
                           buttons
                           button-variant="outline-secondary"
                           @keyup.enter="traverseForm(index + 1)"
                           v-model="values[index]"
                           :options="[...trait.restrictions.categories, { value: null, text: '⦸' }]" />
        </template>
      </b-form-group>

      <!-- User comments -->
      <b-form-group :label="$t('formLabelComment')" label-for="comment">
        <b-form-input v-model="comment" id="comment" />
      </b-form-group>
    </b-form>
    <!-- Show a button for image tagging -->
    <b-button @click="$refs.imageModal.show()"><BIconCamera/> {{ $t('buttonTakePhoto') }}</b-button>
    <!-- Image tagging modal -->
    <ImageModal :name="name" ref="imageModal" />
  </b-modal>
</template>

<script>
import ImageModal from '@/components/modals/ImageModal'
import { BIconCamera, BIconCircleFill } from 'bootstrap-vue'

/**
 * Shows a modal used to enter the data into GridScore. Each trait is shown and based on its type a different method for data input is show.
 */
export default {
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
    /** The geolocation of the user */
    geolocation: {
      type: Object,
      default: null
    }
  },
  data: function () {
    return {
      values: {
      },
      dates: {
      },
      name: null,
      comment: null,
      imageFile: null,
      imageData: null,
      formValidated: false,
      formState: []
    }
  },
  components: {
    BIconCamera,
    BIconCircleFill,
    ImageModal
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
     * Shows the modal and resets it to its initial state
     */
    show: function () {
      this.formValidated = false
      this.formState = this.dataset.traits.map(t => null)
      this.imageFile = null
      this.imageData = null
      this.values = JSON.parse(JSON.stringify(this.dataset.data[this.row][this.col].values))
      this.dates = JSON.parse(JSON.stringify(this.dataset.data[this.row][this.col].dates))
      this.name = this.dataset.data[this.row][this.col].name
      this.comment = this.dataset.data[this.row][this.col].comment
      this.$nextTick(() => this.$refs.dataPointModal.show())
    },
    /**
     * Hides the modal
     */
    hide: function () {
      this.$nextTick(() => this.$refs.dataPointModal.hide())
    },
    /**
     * Sets focus to the first trait input
     */
    setFocus: function () {
      this.$refs['trait-0'][0].focus()
    },
    /**
     * Traverses the form and focusses the next input field in turn based on the given index
     * @param newIndex The index of the next field (the method will internally modulo this to stay in range)
     */
    traverseForm: function (newIndex) {
      let i = newIndex % this.values.length

      // If the next ref exists and it has a focus method, call it
      if (this.$refs[`trait-${i}`][0] && this.$refs[`trait-${i}`][0].focus) {
        this.$refs[`trait-${i}`][0].focus()
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
        this.dates[index] = null
      }
    },
    /**
     * Handle the submit event. Checks restrictions before accepting the data.
     */
    onSubmit: function () {
      this.formState = this.dataset.traits.map((t, i) => {
        if (this.values[i] === '' || this.values[i] === null) {
          return true
        } else if (t.restrictions) {
          if (t.type === 'categorical') {
            // Check whether the value is one of the pre-defined categories
            return t.restrictions.categories.indexOf(this.values[i]) !== -1
          } else if (t.type === 'int' || t.type === 'float') {
            // Check whether the value lies between the required min and max
            return t.restrictions.min <= this.values[i] && this.values[i] <= t.restrictions.max
          }
        } else {
          return true
        }
      })

      // If the form is invalid, return
      this.formValidated = true
      for (let i = 0; i < this.formState.length; i++) {
        if (this.formState[i] === false) {
          return
        }
      }

      this.values.forEach((v, i) => {
        // Ignore empty values, set them to null
        if (this.values[i] === '' || this.values[i] === null) {
          this.values[i] = null
          this.dates[i] = null
          return
        }

        if (this.dataset.traits[i].type === 'date') {
          // If the trait a date, simply set the date to the value
          this.dates[i] = this.values[i]
        } else if (this.values[i] !== null && this.dates[i] === null) {
          // Else, if there is a value and no date, set the date as now
          let today = new Date()
          const offset = today.getTimezoneOffset()
          today = new Date(today.getTime() + (offset * 60 * 1000))
          this.dates[i] = today.toISOString().split('T')[0]
        }
      })

      // Only store the comment if it's not empty
      const comment = (this.comment !== undefined && this.comment !== null && this.comment.length > 0) ? this.comment : null

      // Update the store with the newly set data point
      this.$store.dispatch('setDataPoint', {
        row: this.row,
        col: this.col,
        values: this.values,
        dates: this.dates,
        geolocation: this.useGps ? this.geolocation : null,
        comment: comment
      })
      this.hide()
    }
  }
}
</script>

<style>

</style>
