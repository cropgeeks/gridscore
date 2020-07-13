<template>
  <b-modal :title="name"
           :ok-title="$t('buttonOk')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent="onSubmit"
           ref="dataPointModal">
    <b-form @submit.prevent="onSubmit">
      <b-form-group v-for="(trait, index) in dataset.traits"
                    :key="`trait-${index}`"
                    :label-for="`trait-${index}`">
        <template v-slot:label>
          <span :style="{ color: colors[index % colors.length] }">⬤ {{ trait.name }}<b-badge variant="light" class="ml-1">{{ getTraitTypeText(trait) }}</b-badge></span>
        </template>

        <b-form-datepicker v-if="trait.type === 'date'"       :id="`trait-${index}`" v-model="values[index]" reset-button :reset-value="null" @input="(event) => onDataChanged(event, index)"/>
        <b-form-input      v-else-if="trait.type === 'int'"   :id="`trait-${index}`" v-model="values[index]" type="number" />
        <b-form-input      v-else-if="trait.type === 'float'" :id="`trait-${index}`" v-model="values[index]" type="number" :step="0.02" />
        <b-form-input      v-else-if="trait.type === 'text'"  :id="`trait-${index}`" v-model="values[index]" type="text" />
      </b-form-group>

      <b-form-group :label="$t('formLabelComment')" label-for="comment">
        <b-form-input v-model="comment" id="comment" />
      </b-form-group>
    </b-form>
  </b-modal>
</template>

<script>
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
      comment: null
    }
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
        default:
          return null
      }
    },
    show: function () {
      this.values = JSON.parse(JSON.stringify(this.dataset.data[this.row][this.col].values))
      this.dates = JSON.parse(JSON.stringify(this.dataset.data[this.row][this.col].dates))
      this.name = this.dataset.data[this.row][this.col].name
      this.comment = this.dataset.data[this.row][this.col].comment
      this.$nextTick(() => this.$refs.dataPointModal.show())
    },
    hide: function () {
      this.$nextTick(() => this.$refs.dataPointModal.hide())
    },
    onDataChanged: function (event, index) {
      if (event === null || event === undefined || event === '') {
        this.values[index] = null
        this.dates[index] = null
      }
    },
    onSubmit: function () {
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
