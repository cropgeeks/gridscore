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
        <template v-slot:label>
          <span :style="{ color: colors[index % colors.length] }">⬤ {{ trait.name }}<b-badge variant="light" class="ml-1">{{ getTraitTypeText(trait) }}</b-badge></span>
        </template>

        <b-form-datepicker v-if="trait.type === 'date'"
                           :id="`trait-${index}`"
                           :ref="`trait-${index}`"
                           :state="formState[index]"
                           @keyup.enter="traverseForm(index + 1)"
                           v-model="values[index]"
                           reset-button
                           :reset-value="null"
                           @input="(event) => onDataChanged(event, index)"/>
        <b-form-input      v-else-if="trait.type === 'int'"
                           :id="`trait-${index}`"
                           :ref="`trait-${index}`"
                           :state="formState[index]"
                           @keyup.enter="traverseForm(index + 1)"
                           v-model.number="values[index]"
                           type="number"
                           :min="(trait.restrictions && trait.restrictions.min !== null && trait.restrictions.min !== undefined) ? trait.restrictions.min : null"
                           :max="(trait.restrictions && trait.restrictions.max !== null && trait.restrictions.max !== undefined) ? trait.restrictions.max : null" />
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
        <b-form-input      v-else-if="trait.type === 'text'"
                           :id="`trait-${index}`"
                           :ref="`trait-${index}`"
                           :state="formState[index]"
                           @keyup.enter="traverseForm(index + 1)"
                           v-model="values[index]"
                           type="text" />
        <b-form-select     v-else-if="trait.type === 'categorical' && trait.restrictions && trait.restrictions.categories"
                           :id="`trait-${index}`"
                           :ref="`trait-${index}`"
                           :state="formState[index]"
                           @keyup.enter="traverseForm(index + 1)"
                           v-model="values[index]"
                           :options="[{ value: null, text: $t('formSelectCategory') }, ...trait.restrictions.categories]" />
      </b-form-group>

      <b-form-group :label="$t('formLabelComment')" label-for="comment">
        <b-form-input v-model="comment" id="comment" />
      </b-form-group>
    </b-form>
    <template>
      <b-button @click="$refs.imageModal.show()">&#128247; {{ $t('buttonTakePhoto') }}</b-button>
    </template>
    <ImageModal :name="name" ref="imageModal" />
  </b-modal>
</template>

<script>
import ImageModal from '@/components/modals/ImageModal'

export default {
  props: {
    row: {
      type: Number,
      default: null
    },
    col: {
      type: Number,
      default: null
    },
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
    ImageModal
  },
  methods: {
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
    hide: function () {
      this.$nextTick(() => this.$refs.dataPointModal.hide())
    },
    setFocus: function () {
      // Focus the first non-empty trait input
      // for (let i = 0; i < this.dataset.traits.length; i++) {
      //   if (this.values[i] === undefined || this.values[i] === null || this.values[i] === '') {
      //     this.$refs[`trait-${i}`][0].focus()
      //     break
      //   }
      // }

      // Focus the first trait input
      this.$refs['trait-0'][0].focus()
    },
    traverseForm: function (newIndex) {
      let i = newIndex % this.values.length

      this.$refs[`trait-${i}`][0].focus()
    },
    onDataChanged: function (event, index) {
      if (event === null || event === undefined || event === '') {
        this.values[index] = null
        this.dates[index] = null
      }
    },
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

      this.$store.dispatch('setDataPoint', {
        row: this.row,
        col: this.col,
        values: this.values,
        dates: this.dates,
        geolocation: this.useGps ? this.geolocation : null,
        comment: (this.comment !== undefined && this.comment !== null && this.comment.length > 0) ? this.comment : null
      })
      this.hide()
    }
  }
}
</script>

<style>

</style>
