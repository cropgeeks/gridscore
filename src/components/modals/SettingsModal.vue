<template>
  <div>
    <b-modal :ok-title="$t('buttonOk')"
            :cancel-title="$t('buttonCancel')"
            :title="$t('modalTitleSettings')"
            scrollable
            @ok.prevent="onSubmit"
            ref="settingsModal">
      <b-form @submit.prevent="onSubmit" class="settings-form">
        <h2>{{ $t('pageSettingsGeneralTitle') }}</h2>
        <b-form-group :label="$t('formLabelSettingsGps')" label-for="use-gps">
          <b-form-checkbox v-model="tempUseGps" switch id="use-gps">{{ $t('buttonToggleGps') }}</b-form-checkbox>
        </b-form-group>
        <b-form-group :label="$t('formLabelSettingsContinuousInput')" label-for="continuous-input">
          <b-form-checkbox v-model="tempContinuousInput" switch id="continuous-input">{{ $t('buttonToggleContinuousInput') }}</b-form-checkbox>
        </b-form-group>
        <b-form-group :label="$t('formLabelSettingsInvertView')" label-for="invert-view" :description="$t('formDescriptionSettingsInvertView')">
          <b-form-checkbox v-model="tempInvertView" switch id="invert-view">{{ $t('buttonToggleInvertView') }}</b-form-checkbox>
        </b-form-group>
        <b-form-group :label="$t('formLabelSettingsGridLinesEvery')" label-for="grid-lines-every">
          <b-form-select :options="validGridLines" v-model="tempGridLinesEvery" id="grid-lines-every" />
        </b-form-group>

        <h2>{{ $t('pageSettingsColorsTitle') }} <b-button size="sm" variant="light" v-b-tooltip="$t('tooltipSettingsResetColors')" @click="resetColors"><BIconArrowClockwise /></b-button></h2>
        <b-form-group :label="$t('formLabelSettingsColors')">
          <b-input-group v-for="(color, index) in tempColors" :key="`color-${index}`" class="mr-2 mb-2">
            <b-form-input type="color"  v-model="tempColors[index]"  />
            <b-input-group-append>
              <b-button variant="danger" @click="deleteColor(index)" :disabled="tempColors.length < 2"><BIconX /></b-button>
            </b-input-group-append>
          </b-input-group>
        </b-form-group>
        <b-form-group :label="$t('formLabelSettingsColorsAdd')" label-for="add-color">
          <b-input-group>
            <b-form-input type="color" id="add-color" v-model="newColor" />
            <b-input-group-append>
              <b-button variant="success" @click="addColor"><BIconPlus /></b-button>
            </b-input-group-append>
          </b-input-group>
        </b-form-group>
      </b-form>
    </b-modal>
  </div>
</template>

<script>
import { BIconArrowClockwise, BIconPlus, BIconX } from 'bootstrap-vue'

/**
 * Modal to let the user change some basic settings like truncation of variety names.
 */
export default {
  components: {
    BIconPlus,
    BIconX,
    BIconArrowClockwise
  },
  data: function () {
    return {
      tempUseGps: true,
      tempContinuousInput: false,
      tempInvertView: false,
      tempGridLinesEvery: 5,
      tempColors: [],
      newColor: 'black',
      validGridLines: [2, 3, 4, 5]
    }
  },
  methods: {
    /**
     * Shows the resets modal dialog
     */
    show: function () {
      this.reset()
      this.$nextTick(() => this.$refs.settingsModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.settingsModal.hide())
    },
    /**
     * Resets the dialog to its initial state
     */
    reset: function () {
      this.tempUseGps = this.useGps
      this.tempContinuousInput = this.continuousInput
      this.tempGridLinesEvery = this.gridLinesEvery
      this.tempInvertView = this.invertView
      this.tempColors = JSON.parse(JSON.stringify(this.traitColors))
    },
    onSubmit: function () {
      // Dispatch to the store
      if (this.tempUseGps !== this.useGps) {
        this.$store.dispatch('setUseGps', this.tempUseGps)
      }
      if (this.tempContinuousInput !== this.continuousInput) {
        this.$store.dispatch('setContinuousInput', this.tempContinuousInput)
      }
      if (this.tempGridLinesEvery !== this.gridLinesEvery) {
        this.$store.dispatch('setGridLinesEvery', this.tempGridLinesEvery)
      }
      if (this.tempInvertView !== this.invertView) {
        this.$store.dispatch('setInvertView', this.tempInvertView)
      }

      if (this.tempColors.length !== this.traitColors.length || !this.tempColors.every((value, index) => value === this.traitColors[index])) {
        this.$store.dispatch('setTraitColors', this.tempColors)
      }

      this.hide()
    },
    addColor: function () {
      this.tempColors.push(this.newColor)
      this.newColor = '#000000'
    },
    deleteColor: function (index) {
      if (this.tempColors.length > 1) {
        this.tempColors.splice(index, 1)
      }
    },
    resetColors: function () {
      this.tempColors = ['#910080', '#ff7c00', '#5ec418', '#00a0f1', '#c5e000', '#ff007a', '#222183', '#c83831', '#fff600']
    }
  },
  mounted: function () {
    this.reset()
  }
}
</script>

<style>
.settings-form .input-group,
.settings-form input[type=color] {
  display: inline-flex;
  width: revert;
}
</style>
