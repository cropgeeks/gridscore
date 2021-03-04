<template>
  <b-modal :title="trait.name"
           :ok-title="$t('buttonOk')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent="onSubmit"
           ref="traitConfigModal"
           no-fade
           v-if="trait">
    <b-form @submit.prevent="onSubmit" :validated="formValidated">
      <!-- If it's an `int`, show two number inputs for min and max -->
      <template v-if="trait.type === 'int'">
        <b-form-group :label="$t('formLabelTraitConfigMin')"
                      label-for="min">
          <b-input type="number" v-model.number="min" :state="formState.min" required/>
        </b-form-group>
        <b-form-group :label="$t('formLabelTraitConfigMax')"
                      label-for="max">
          <b-input type="number" v-model.number="max" :state="formState.max" required/>
        </b-form-group>
      </template>
      <!-- If it's a `float`, show two number inputs for min and max -->
      <template v-else-if="trait.type === 'float'">
        <b-form-group :label="$t('formLabelTraitConfigMin')"
                      label-for="min">
          <b-input type="number" v-model.number="min" :step="0.02" :state="formState.min" required/>
        </b-form-group>
        <b-form-group :label="$t('formLabelTraitConfigMax')"
                      label-for="max">
          <b-input type="number" v-model.number="max" :step="0.02" :state="formState.max" required/>
        </b-form-group>
      </template>
      <!-- If it's `categorical`, show a text area where categories are defined -->
      <template v-else-if="trait.type === 'categorical'">
        <b-form-group :label="$t('formLabelTraitCategories')"
                      label-for="categories">
          <b-form-textarea rows="5" v-model="categories" :placeholder="$t('formPlaceholderTraitConfigCategories')" :state="formState.categories" required/>
        </b-form-group>
      </template>
    </b-form>
  </b-modal>
</template>

<script>
/**
 * Trait configuration modal to define trait restrictions for a specified trait.
 */
export default {
  props: {
    /**
     * The trait in question
     */
    trait: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      categories: null,
      min: null,
      max: null,
      formValidated: false,
      formState: {
        categories: null,
        min: null,
        max: null
      }
    }
  },
  methods: {
    /**
     * Handles the submit event. Checks if restrictions are valid and shows feedback in the form.
     */
    onSubmit: function () {
      if (this.trait.type === 'int' || this.trait.type === 'float') {
        // For numeric traits, check min and max fields
        this.formState = {
          min: this.min !== undefined && this.min !== null && this.min !== '',
          max: this.max !== undefined && this.max !== null && this.max !== '',
          categories: null
        }
      } else if (this.trait.type === 'categorical') {
        // For categorical traits, check the categories field
        this.formState = {
          min: null,
          max: null,
          categories: this.categories !== '' && this.categories.length > 0
        }
      }

      this.formValidated = true
      // Check if any field is invalid, if so, return
      if (this.formState.min === false || this.formState.max === false || this.formState.categories === false) {
        return
      }

      // If the form is valid, emit an event with the restrictions as payload
      this.$emit('config-changed', {
        min: this.min,
        max: this.max,
        categories: this.categories ? this.categories.split('\n') : null
      })

      this.hide()
    },
    /**
     * Resets the modal to its initial state
     */
    reset: function () {
      this.formValidated = false
      this.formState = {
        min: null,
        max: null,
        categories: null
      }
      this.categories = null
      this.min = null
      this.max = null
    },
    /**
     * Shows the modal
     */
    show: function () {
      this.reset()

      // Read existing trait restrictions into the fields
      if (this.trait && this.trait.restrictions) {
        if (this.trait.restrictions.categories) {
          this.categories = this.trait.restrictions.categories.join('\n')
        }
        this.min = this.trait.restrictions.min
        this.max = this.trait.restrictions.max
      }

      this.$nextTick(() => this.$refs.traitConfigModal.show())
    },
    hide: function () {
      this.$nextTick(() => this.$refs.traitConfigModal.hide())
    }
  }
}
</script>

<style>

</style>
