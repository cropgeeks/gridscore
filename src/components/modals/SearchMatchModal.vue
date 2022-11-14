<template>
  <b-modal :ok-title="$t('buttonClose')"
           :title="$t('modalTitleSearchMatches')"
           ok-only
           no-fade
           ref="searchMatchModal">
    <b-list-group v-if="searchMatches && searchMatches.length > 0">
      <b-list-group-item href="#" @click.prevent="handleClick(match)" v-for="match in searchMatches" :key="`search-match-${match.row}-${match.col}`">
        {{ $t('searchMatchDisplay', { name: match.cell.displayName, col: match.col + 1, row: match.row + 1 }) }}
      </b-list-group-item>
    </b-list-group>
  </b-modal>
</template>

<script>
export default {
  props: {
    searchMatches: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    handleClick: function (match) {
      this.$emit('item-selected', match)
      this.hide()
    },
    /**
     * Shows the modal dialog and resets it to its initial state
     */
    show: function () {
      this.$nextTick(() => this.$refs.searchMatchModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.searchMatchModal.hide())
    }
  }
}
</script>

<style>
</style>
