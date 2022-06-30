<template>
  <b-modal :title="$t('modalTitleDatasetComment')"
           :ok-title="$t('buttonSave')"
           :cancel-title="$t('buttonCancel')"
           @ok="$emit('change', tempComment)"
           no-fade
           ref="commentModal">
    <b-form-textarea :placeholder="$t('formPlaceholderDatasetComment')" v-model="tempComment" />
  </b-modal>
</template>

<script>
export default {
  props: {
    comment: {
      type: String,
      default: null
    }
  },
  data: function () {
    return {
      tempComment: null
    }
  },
  methods: {
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.tempComment = this.comment
      this.$refs.commentModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.commentModal.hide())
    }
  }
}
</script>

<style>

</style>
