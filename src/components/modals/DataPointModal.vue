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
    },
    geolocation: {
      type: Object,
      default: null
    }
  },
  data: function () {
    return {
      data: {
      },
      name: null,
      comment: null
    }
  },
  methods: {
    show: function () {
      this.data = JSON.parse(JSON.stringify(this.dataset.data[this.row][this.col].dates))
      this.name = this.dataset.data[this.row][this.col].name
      this.comment = this.dataset.data[this.row][this.col].comment
      this.$nextTick(() => this.$refs.dataPointModal.show())
    },
    hide: function () {
      this.$nextTick(() => this.$refs.dataPointModal.hide())
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
        geolocation: this.useGps ? this.geolocation : null,
        comment: (this.comment !== null && this.comment.length > 0) ? this.comment : null
      })
      this.hide()
    }
  }
}
</script>

<style>

</style>
