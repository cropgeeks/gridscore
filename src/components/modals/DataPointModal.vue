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
        <template v-slot:label><span :style="{ color: colors[index % colors.length] }">⬤ {{ trait }}</span></template>
        <b-form-datepicker :id="`trait-${index}`" v-model="data[index]" reset-button :reset-value="null" @input="(event) => onDataChanged(event, index)"/>
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
    }
  },
  data: function () {
    return {
      data: {
      },
      name: null,
      geolocation: null,
      comment: null
    }
  },
  methods: {
    show: function () {
      this.data = JSON.parse(JSON.stringify(this.dataset.data[this.row][this.col].dates))
      this.name = this.dataset.data[this.row][this.col].name
      this.comment = this.dataset.data[this.row][this.col].comment
      this.$nextTick(() => this.$refs.dataPointModal.show())

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(this.setGeolocation)
      }
    },
    hide: function () {
      this.$nextTick(() => this.$refs.dataPointModal.hide())
    },
    setGeolocation: function (location) {
      if (location && location.coords) {
        this.geolocation = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          elv: location.coords.altitude
        }
      }
    },
    onDataChanged: function (event, index) {
      if (event === null || event === undefined || event === '') {
        this.data[index] = null
      }
    },
    onSubmit: function () {
      this.$store.dispatch('setDataPoint', {
        row: this.row,
        col: this.col,
        value: this.data,
        geolocation: this.geolocation,
        comment: this.comment
      })
      this.hide()
    }
  }
}
</script>

<style>

</style>
