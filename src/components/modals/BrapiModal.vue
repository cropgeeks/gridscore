<template>
  <b-modal :title="title"
           :ok-title="okTitle"
           :cancel-title="cancelTitle"
           @ok.prevent="$emit('submit')"
           scrollable
           ref="brapiModal">
    <b-form-group :label="$t('formLabelBrapiUrl')" label-for="brapiUrl">
      <b-input-group>
        <b-form-input v-model="brapiUrl" id="brapiUrl" />
        <b-input-group-append>
          <b-button @click="updateBrapiUrl">&#x21bb;</b-button>
        </b-input-group-append>
      </b-input-group>
    </b-form-group>
    <slot name="content" />
  </b-modal>
</template>

<script>
export default {
  data: function () {
    const storeBrapiUrl = this.brapiConfig && this.brapiConfig.url ? this.brapiConfig.url : 'http://localhost:8080/germinate-demo-api/v4.2.0/api/brapi/v2/'

    return {
      brapiUrl: storeBrapiUrl
    }
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    okTitle: {
      type: String,
      default: function () { return this.$t('buttonOk') }
    },
    cancelTitle: {
      type: String,
      default: function () { return this.$t('buttonCancel') }
    }
  },
  methods: {
    show: function () {
      this.$nextTick(() => this.$refs.brapiModal.show())
    },
    hide: function () {
      this.$nextTick(() => this.$refs.brapiModal.hide())
    },
    getBrapiUrl: function () {
      return this.brapiUrl
    },
    updateBrapiUrl: function () {
      // As a test, set a static BrAPI URL
      this.$store.commit('ON_BRAPI_CONFIG_CHANGED', {
        url: this.brapiUrl
      })
      this.$emit('brapi-url-changed', this.brapiUrl)
    }
  }
}
</script>

<style>

</style>
