<template>
  <b-modal :title="$t(title)"
           :ok-title="$t(okTitle)"
           :cancel-title="$t(cancelTitle)"
           :ok-disabled="okDisabled"
           @ok.prevent="$emit('submit')"
           scrollable
           no-fade
           ref="brapiModal">
    <b-form-group label-for="brapiUrl">
      <template v-slot:label>
        <span v-html="$t('formLabelBrapiUrl')" />
      </template>
      <b-input-group>
        <!-- BrAPI URL input field -->
        <b-form-input v-model="brapiUrl" id="brapiUrl" />
        <b-input-group-append>
          <!-- Button to update the BrAPI URL in the store -->
          <b-button @click="updateBrapiUrl"><BIconArrowClockwise /></b-button>
        </b-input-group-append>
      </b-input-group>
    </b-form-group>

    <!-- Slot that wrapping components can use to fill in their content -->
    <slot name="content" />
  </b-modal>
</template>

<script>
import { mapGetters } from 'vuex'
import { BIconArrowClockwise } from 'bootstrap-vue'

/**
 * Base modal used to show a BrAPI URL input field at the top. Wrapping components can use the `content` slot to add their own content.
 */
export default {
  components: {
    BIconArrowClockwise
  },
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
    },
    okDisabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeBrapiConfig'
    ])
  },
  methods: {
    /**
     * Shows the modal and gets the current BrAPI URL from the configuration
     */
    show: function () {
      this.brapiUrl = this.storeBrapiConfig && this.storeBrapiConfig.url ? this.storeBrapiConfig.url : null
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
