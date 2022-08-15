<template>
  <b-modal :title="$t('modalTitleMultiTraitValues')"
           :ok-title="$t('buttonSave')"
           :cancel-title="$t('buttonCancel')"
           size="md"
           no-fade
           @ok.prevent="onSubmit"
           ref="multiTraitValueModal">
    <p>{{ $t('modalTextMultiTraitValues') }}</p>
    <p v-if="!values || values.length < 1">
      {{ $t('labelNoData') }}
    </p>
    <b-form @submit.prevent="onSubmit" :validated="formValidated" v-else>
      <div v-if="trait && trait.restrictions" class="mb-3">
        <b-badge class="mr-2">{{ storeTraits[traitIndex].name }}</b-badge>
        <b-badge v-if="trait.restrictions.min">&ge; {{ trait.restrictions.min }}</b-badge>
        <b-badge v-if="trait.restrictions.max">&le; {{ trait.restrictions.max }}</b-badge>
        <b-badge v-if="trait.restrictions.categories">in {{ trait.restrictions.categories.join(', ') }}</b-badge>
      </div>
      <b-form-group v-for="(datum, index) in values" :key="`datum-${index}`" :label-for="`input-${index}`">
        <template #label>
          <div class="d-flex align-items-center">
            <b-badge>{{ dates[index] }}</b-badge>
            <b-form-datepicker size="sm" class="ml-auto mr-1" button-only v-model="dates[index]" />
            <b-button size="sm" variant="danger" @click="deleteValue(index)" v-b-tooltip="$t('buttonDelete')"><BIconTrash /></b-button>
          </div>
        </template>
        <DataEntryInput :values="values" :index="index" :trait="trait" :formState="formState" class="d-block" :id="`input-${index}`"
                        @handleDateInput="handleDateInput(index)"
                        @handleDateInputChar="event => handleDateInputChar(index, event)"
                        @onDateChanged="event => onDateChanged(event, index)"
                        @onValueChanged="event => onValueChanged(event, index)" />
      </b-form-group>
    </b-form>
  </b-modal>
</template>

<script>
import Vue from 'vue'
import DataEntryInput from '@/components/DataEntryInput'
import { mapGetters } from 'vuex'
import { BIconTrash } from 'bootstrap-vue'

export default {
  components: {
    BIconTrash,
    DataEntryInput
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeTraitColors',
      'storeTraits'
    ]),
    trait: function () {
      if (this.traitIndex !== null) {
        return this.storeTraits[this.traitIndex]
      } else {
        return null
      }
    }
  },
  props: {
    traitIndex: {
      type: Number,
      default: null
    },
    row: {
      type: Number,
      default: null
    },
    col: {
      type: Number,
      default: null
    }
  },
  data: function () {
    return {
      values: [],
      dates: [],
      dateInput: '',
      dateInputIndex: null,
      formState: [],
      formValidate: false
    }
  },
  methods: {
    deleteValue: function (index) {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextGuidedWalkExit'), {
          title: this.$t('modalTitleGuidedWalkExit'),
          okVariant: 'danger',
          okTitle: this.$t('buttonYes'),
          cancelTitle: this.$t('buttonNo')
        })
          .then(value => {
            if (value) {
              this.values.splice(index, 1)
              this.dates.splice(index, 1)
            }
          })
    },
    onSubmit: function () {
      this.formState = this.values.map((v, i) => {
        if (v === '' || v === null) {
          return true
        } else if (this.trait.restrictions) {
          if (this.trait.type === 'categorical') {
            // Check whether the value is one of the pre-defined categories
            return this.trait.restrictions.categories.indexOf(v) !== -1
          } else if (this.trait.type === 'int' || this.trait.type === 'float') {
            // Check whether the value lies between the required min and max
            return this.trait.restrictions.min <= v && v <= this.trait.restrictions.max
          }
        }
        return true
      })

      // If the form is invalid, return
      this.formValidated = true
      for (let i = 0; i < this.formState.length; i++) {
        if (this.formState[i] === false) {
          return
        }
      }

      let valueCopy = []
      let dateCopy = []

      this.values.forEach((v, i) => {
        if (v !== null && v !== '') {
          valueCopy.push(v)
          dateCopy.push(this.dates[i])
        }
      })

      if (valueCopy.length < 1) {
        valueCopy = null
        dateCopy = null
      }

      this.$emit('data-changed', valueCopy, dateCopy)
      this.$nextTick(() => this.hide())
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

      // If this could be part of a number
      if (event.key === '-' || event.key === '+' || !isNaN(event.key)) {
        this.dateInput += event.key
      }
    },
    onDateChanged: function (event, index) {
      // If the input is something that would be considered "empty", reset the value and date
      if (event === null || event === undefined || event === '') {
        this.values[index] = null
        this.dates[index] = null
      } else {
        Vue.set(this.values, index, event)
      }
    },
    onValueChanged: function (event, index) {
      if (event === null || event === undefined || event === '') {
        this.values[index] = null
        this.dates[index] = null
      } else {
        let dp

        if (this.trait.type === 'int' || this.trait.type === 'float') {
          dp = +event
        } else {
          dp = event
        }

        Vue.set(this.values, index, dp)
      }
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      const dp = this.$store.state.dataset.data.get(`${this.row}-${this.col}`)

      if (dp) {
        this.values = (dp.values && dp.values[this.traitIndex]) ? dp.values[this.traitIndex].concat() : []
        this.dates = (dp.dates && dp.dates[this.traitIndex]) ? dp.dates[this.traitIndex].concat() : []
      }
      this.dateInput = ''
      this.dateInputIndex = null
      this.formState = this.storeTraits.map(t => null)
      this.formValidated = false

      this.$nextTick(() => this.$refs.multiTraitValueModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.multiTraitValueModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
