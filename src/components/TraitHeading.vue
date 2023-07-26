<template>
  <span :style="{ color: storeTraitColors[traitIndex % storeTraitColors.length] }">
    <template v-if="circle === 'full'">
      <BIconCircleHalf v-if="trait.mType === 'multi'" />
      <BIconCircleFill v-else />
    </template>
    <BIconCircle v-else />
    <span class="mx-1">{{ trait.name }}</span>
    <b-badge variant="light">{{ getTraitTypeText(trait) }}</b-badge>
    <BIconCardText class="text-muted ml-1" v-b-tooltip="trait.description" v-if="trait.description" />
  </span>
</template>

<script>
import { mapGetters } from 'vuex'
import { BIconCircle, BIconCircleFill, BIconCircleHalf, BIconCardText } from 'bootstrap-vue'

export default {
  components: {
    BIconCircle,
    BIconCircleFill,
    BIconCircleHalf,
    BIconCardText
  },
  props: {
    trait: {
      type: Object,
      default: () => { return { name: null, type: 'date' } }
    },
    circle: {
      type: String,
      default: 'full'
    }
  },
  computed: {
    ...mapGetters([
      'storeTraits',
      'storeTraitColors'
    ]),
    traitIndex: function () {
      if (!this.trait) {
        return 0
      } else {
        return this.storeTraits.findIndex(t => t.name === this.trait.name)
      }
    }
  }
}
</script>

<style>

</style>
