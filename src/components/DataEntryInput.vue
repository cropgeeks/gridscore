<template>
  <!-- For date types, show a datepicker -->
  <b-form-input v-if="trait.type === 'date'"
                :id="`trait-${index}`"
                ref="traitInput"
                :state="formState[index]"
                @keyup.enter="$emit('handleDateInput')"
                :value="values[index]"
                type="date"
                :key="values[index]"
                @keyup.exact="(event) => $emit('handleDateInputChar', event)"
                @change="(event) => $emit('onDateChanged', event)" />
  <!-- For int types, show a number input, apply restrictions -->
  <b-form-input v-else-if="trait.type === 'int'"
                :id="`trait-${index}`"
                ref="traitInput"
                class="number-input"
                :state="formState[index]"
                @keyup.enter="$emit('enter')"
                :value="values[index]"
                @change="(event) => $emit('onValueChanged', +event)"
                @wheel="$event.target.blur()"
                type="number"
                :min="(trait.restrictions && trait.restrictions.min !== null && trait.restrictions.min !== undefined) ? trait.restrictions.min : null"
                :max="(trait.restrictions && trait.restrictions.max !== null && trait.restrictions.max !== undefined) ? trait.restrictions.max : null" />
  <!-- For float types, show a number input, apply restrictions -->
  <b-form-input v-else-if="trait.type === 'float'"
                :id="`trait-${index}`"
                ref="traitInput"
                class="number-input"
                :state="formState[index]"
                @keyup.enter="$emit('enter')"
                :value="values[index]"
                @change="(event) => $emit('onValueChanged', +event)"
                type="number"
                @wheel="$event.target.blur()"
                :min="(trait.restrictions && trait.restrictions.min !== null && trait.restrictions.min !== undefined) ? trait.restrictions.min : null"
                :max="(trait.restrictions && trait.restrictions.max !== null && trait.restrictions.max !== undefined) ? trait.restrictions.max : null"
                :step="0.02" />
  <!-- For text types, show a simple input field -->
  <b-form-input v-else-if="trait.type === 'text'"
                :id="`trait-${index}`"
                ref="traitInput"
                :state="formState[index]"
                @keyup.enter="$emit('enter')"
                :value="values[index]"
                @change="(event) => $emit('onValueChanged', event)"
                type="text" />
  <!-- For categorical traits -->
  <!-- If there are more than 3 options, show a dropdown select -->
  <b-form-select v-else-if="trait.type === 'categorical' && trait.restrictions && trait.restrictions.categories && trait.restrictions.categories.length > 3"
                  :id="`trait-${index}`"
                  ref="traitInput"
                  :state="formState[index]"
                  @keyup.enter="$emit('enter')"
                  :value="values[index]"
                  @change="(event) => $emit('onValueChanged', event)"
                  :options="[{ value: null, text: $t('formSelectCategory') }, ...trait.restrictions.categories]" />
  <!-- Else show a button group for easier selection -->
  <b-form-radio-group v-else-if="trait.type === 'categorical' && trait.restrictions && trait.restrictions.categories && trait.restrictions.categories.length <= 3"
                      :id="`trait-${index}`"
                      ref="traitInput"
                      :state="formState[index]"
                      buttons
                      button-variant="outline-secondary"
                      class="category-options"
                      @keyup.enter="$emit('enter')"
                      :checked="values[index]"
                      @change="(event) => $emit('onValueChanged', event)"
                      :options="[...trait.restrictions.categories, { value: null, text: '⦸' }]" />
</template>

<script>
export default {
  props: {
    index: {
      type: Number,
      default: 0
    },
    trait: {
      type: Object,
      default: () => {}
    },
    formState: {
      type: Array,
      default: () => {}
    },
    values: {
      type: Array,
      default: () => []
    }
  }
}
</script>

<style>
/* Chrome, Safari, Edge, Opera */
input.number-input::-webkit-outer-spin-button,
input.number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
