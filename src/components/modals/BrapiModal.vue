<template>
  <b-modal :title="$t(title)"
           :ok-title="$t(okTitle)"
           :cancel-title="$t(cancelTitle)"
           @ok.prevent="$emit('submit')"
           scrollable
           ref="brapiModal">
    <b-form-group :label="$t('formLabelBrapiUrl')" label-for="brapiUrl">
      <b-input-group>
        <!-- BrAPI URL input field -->
        <b-form-input v-model="brapiUrl" id="brapiUrl" />
        <b-input-group-append>
          <!-- Button to update the BrAPI URL in the store -->
          <b-button @click="updateBrapiUrl">&#x21bb;</b-button>
        </b-input-group-append>
      </b-input-group>
    </b-form-group>

    <!-- Slot that wrapping components can use to fill in their content -->
    <slot name="content" />
  </b-modal>
</template>

<script>
/**
 * Base modal used to show a BrAPI URL input field at the top. Wrapping components can use the `content` slot to add their own content.
 */
export default {
  data: function () {
    return {
      brapiUrl: null
    }
  },
  props: {
    /** The modal `title` i18n identifier */
    title: {
      type: String,
      default: ''
    },
    /** The modal `ok` button i18n identifier */
    okTitle: {
      type: String,
      default: 'buttonOk'
    },
    /** The modal `cancel` button i18n identifier */
    cancelTitle: {
      type: String,
      default: 'buttonCancel'
    }
  },
  methods: {
    /**
     * Shows the modal and gets the current BrAPI URL from the configuration
     */
    show: function () {
      this.brapiUrl = this.brapiConfig && this.brapiConfig.url ? this.brapiConfig.url : null
      this.$nextTick(() => this.$refs.brapiModal.show())
    },
    /**
     * Hides the modal
     */
    hide: function () {
      this.$nextTick(() => this.$refs.brapiModal.hide())
    },
    /**
     * Returns the BrAPI URL
     */
    getBrapiUrl: function () {
      return this.brapiUrl
    },
    /**
     * Pushes the changed BrAPI URL to the store
     */
    updateBrapiUrl: function () {
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