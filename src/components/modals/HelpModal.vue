<template>
  <b-modal :title="$t('modalTitleHelp')"
           :ok-title="$t('buttonClose')"
           ok-only
           no-fade
           :size="isAvailable ? 'xl' : 'md'"
           ref="helpModal">
    <b-embed aspect="1by1" :src="url" v-if="isAvailable"/>
    <div class="d-flex flex-column align-items-center" v-else>
      <h1 class="display-1 text-muted"><BIconWifiOff /></h1>
      <p class="text-center">{{ $t('modalTextHelp') }}</p>
    </div>
  </b-modal>
</template>

<script>
import { BIconWifiOff } from 'bootstrap-vue'

export default {
  components: {
    BIconWifiOff
  },
  props: {
    url: {
      type: String,
      default: 'https://cropgeeks.github.io/gridscore'
    }
  },
  data: function () {
    return {
      isAvailable: true
    }
  },
  watch: {
    url: function () {
      this.checkAvailability()
    }
  },
  methods: {
    checkAvailability: function () {
      fetch(new Request(this.url)).then(() => {
        this.isAvailable = true
        console.log('yay')
      }).catch(() => {
        this.isAvailable = false
        console.log('nay')
      })
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.checkAvailability()

      this.$nextTick(() => this.$refs.helpModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.helpModal.hide())
    }
  }
}
</script>

<style>

</style>
