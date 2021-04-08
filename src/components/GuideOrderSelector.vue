<template>
  <b-form-radio-group
        id="radio-slots"
        v-model="selectedOrder"
        name="radio-options-order">
    <b-row class="guide-order">
      <b-col v-for="option in guideOrderTypes" :key="`guide-option-${option.name}`" cols=6 lg=3 class="mb-3">
        <div class="rounded p-3 bg-light h-100 border">
          <b-form-radio :value="option.name" :disabled="!option.valid(col, row)" class="h-100">
            <div class="guide-text-label">{{ $t(option.text) }}</div>
            <b-img class="guide-image" fluid :src="option.image" />
          </b-form-radio>
        </div>
      </b-col>
    </b-row>
  </b-form-radio-group>
</template>

<script>
import types from '@/mixin/types'

export default {
  props: {
    row: {
      type: Number,
      default: 0
    },
    col: {
      type: Number,
      default: 0
    }
  },
  data: function () {
    return {
      selectedOrder: null
    }
  },
  mixins: [ types ],
  watch: {
    selectedOrder: function (newValue) {
      this.$emit('order-selected', newValue)
    }
  }
}
</script>

<style>
img.guide-image {
  max-height: 50px;
}
.guide-order input[type="radio"][disabled] + label img {
  opacity: 0.5;
}
.guide-order label {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
}
</style>
<style scoped>
.guide-order > div{
  text-align: center;
}
.guide-text-label {
  word-break: break-word;
}
</style>
