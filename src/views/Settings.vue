<template>
  <b-container>
    <h1><b-button @click="onSubmit(true)"><BIconArrowLeft /></b-button> {{ $t('modalTitleSettings') }}</h1>
    <hr />
    <b-form @submit.prevent="onSubmit" class="settings-form">
      <b-row>
        <b-col cols=12 lg=6>
          <h2>{{ $t('pageSettingsGeneralTitle') }}</h2>
          <b-form-group :label="$t('formLabelSettingsGps')" label-for="use-gps" :description="$t('formDescriptionSettingsGps')">
            <b-form-checkbox v-model="tempUseGps" switch id="use-gps">{{ $t('buttonToggleGps') }}</b-form-checkbox>
          </b-form-group>
          <b-form-group :label="$t('formLabelSettingsSpeech')" label-for="use-speech" :description="$t('formDescriptionSettingsSpeech')">
            <b-form-checkbox v-model="tempUseSpeech" switch id="use-speech">{{ $t('buttonToggleSpeech') }}</b-form-checkbox>
          </b-form-group>
          <b-form-group :label="$t('formLabelSettingsContinuousInput')" label-for="continuous-input" :description="$t('formDescriptionSettingsContinuousInput')">
            <b-form-checkbox v-model="tempContinuousInput" switch id="continuous-input">{{ $t('buttonToggleContinuousInput') }}</b-form-checkbox>
          </b-form-group>

          <div class="settings-colors">
            <h2>{{ $t('pageSettingsColorsTitle') }} <b-button size="sm" variant="light" v-b-tooltip="$t('tooltipSettingsResetColors')" @click="resetColors"><BIconArrowClockwise /></b-button></h2>
            <b-form-group :label="$t('formLabelSettingsColors')" :description="$t('formDescriptionSettingsColors')">
              <b-input-group v-for="(color, index) in tempColors" :key="`color-${index}`" class="mr-2 mb-2">
                <b-form-input type="color"  v-model="tempColors[index]"  />
                <b-input-group-append>
                  <b-button variant="danger" @click="deleteColor(index)" :disabled="tempColors.length < 2"><BIconX /></b-button>
                </b-input-group-append>
              </b-input-group>
            </b-form-group>
            <b-form-group :label="$t('formLabelSettingsColorsAdd')" label-for="add-color" :description="$t('formDescriptionSettingsColorAdd')">
              <b-input-group>
                <b-form-input type="color" id="add-color" v-model="newColor" />
                <b-input-group-append>
                  <b-button variant="success" @click="addColor"><BIconPlus /></b-button>
                </b-input-group-append>
              </b-input-group>
            </b-form-group>
          </div>
        </b-col>
        <b-col cols=12 md=6>
          <h2>{{ $t('pageSettingsVisualTitle') }}</h2>
          <b-form-group :label="$t('formLabelSettingsHideToggledTraits')" label-for="hide-toggled-traits" :description="$t('formDescriptionSettingsHideToggledTraits')">
            <b-form-checkbox v-model="tempHideToggledTraits" switch id="hide-toggled-traits">{{ $t('buttonToggleHideToggledTraits') }}</b-form-checkbox>
          </b-form-group>
          <b-form-group :label="$t('formLabelSettingsIgnoreEmptyCells')" label-for="ignode-empty-cells" :description="$t('formDescriptionSettingsIgnoreEmptyCells')">
            <b-form-checkbox v-model="tempIgnoreEmptyCells" switch id="ignode-empty-cells">{{ $t('buttonToggleIgnoreEmptyCells') }}</b-form-checkbox>
          </b-form-group>
          <b-form-group :label="$t('formLabelSettingsHideMarkers')" label-for="hide-markers" :description="$t('formDescriptionSettingsHideMarkers')">
            <b-form-checkbox v-model="tempHideMarkers" switch id="hide-markers">{{ $t('buttonToggleHideMarkers') }}</b-form-checkbox>
          </b-form-group>
          <b-form-group :label="$t('formLabelSettingsShowStatsInTable')" label-for="stats-in-table" :description="$t('formDescriptionSettingsShowStatsInTable')">
            <b-form-checkbox v-model="tempShowStatsInTable" switch id="stats-in-table">{{ $t('buttonToggleShowStatsInTable') }}</b-form-checkbox>
          </b-form-group>
          <b-form-group :label="$t('formLabelSettingsInvertView')" label-for="invert-view" :description="$t('formDescriptionSettingsInvertView')">
            <b-form-checkbox v-model="tempInvertView" switch id="invert-view">{{ $t('buttonToggleInvertView') }}</b-form-checkbox>
          </b-form-group>
          <b-form-group :label="$t('formLabelSettingsInvertNumberingX')" label-for="invert-numbering-x" :description="$t('formDescriptionSettingsInvertNumberingX')">
            <b-form-checkbox v-model="tempInvertNumberingX" switch id="invert-numbering-x">{{ $t('buttonToggleInvertNumberingX') }}</b-form-checkbox>
          </b-form-group>
          <b-form-group :label="$t('formLabelSettingsInvertNumberingY')" label-for="invert-numbering-y" :description="$t('formDescriptionSettingsInvertNumberingY')">
            <b-form-checkbox v-model="tempInvertNumberingY" switch id="invert-numbering-y">{{ $t('buttonToggleInvertNumberingY') }}</b-form-checkbox>
          </b-form-group>
          <!-- <b-form-group :label="$t('formLabelSettingsGridLinesEvery')" label-for="grid-lines-every">
            <b-form-select :options="validGridLines" v-model="tempGridLinesEvery" id="grid-lines-every" />
          </b-form-group> -->
          <b-form-group :label="$t('formLabelSettingsColumnWidth')" :description="$t('formDescriptionSettingsColumnWidth')" label-for="column-width">
            <b-input-group>
              <b-form-input v-model.number="tempColumnWidth" type="number" id="column-width" />
              <b-input-group-append>
                <b-button @click="tempColumnWidth = null"><BIconSlashCircle /></b-button>
              </b-input-group-append>
            </b-input-group>
          </b-form-group>
        </b-col>
      </b-row>
      <b-button v-b-toggle.collapse-advanced>{{ $t('buttonAdvancedSettings') }}</b-button>
      <b-collapse id="collapse-advanced" class="mt-2 border rounded p-3">
        <p class="text-danger">{{ $t('labelAdvancedSettingsWarning') }}</p>

        <b-button variant="danger" @click="resetApp"><BIconExclamationTriangleFill /> {{ $t('buttonWarningResetApp') }}</b-button>
      </b-collapse>
    </b-form>

    <b-button @click="onSubmit(false)" variant="primary" class="mt-3">{{ $t('buttonSave') }}</b-button>
  </b-container>
</template>

<script>
import { mapGetters } from 'vuex'
import { BIconArrowClockwise, BIconPlus, BIconX, BIconSlashCircle, BIconArrowLeft, BIconExclamationTriangleFill } from 'bootstrap-vue'

/**
 * Modal to let the user change some basic settings like truncation of variety names.
 */
export default {
  components: {
    BIconPlus,
    BIconX,
    BIconArrowClockwise,
    BIconSlashCircle,
    BIconArrowLeft,
    BIconExclamationTriangleFill
  },
  data: function () {
    return {
      tempUseGps: true,
      tempUseSpeech: false,
      tempContinuousInput: false,
      tempIgnoreEmptyCells: false,
      tempInvertView: false,
      tempInvertNumberingX: false,
      tempInvertNumberingY: false,
      tempShowStatsInTable: false,
      tempHideToggledTraits: false,
      tempHideMarkers: false,
      tempGridLinesEvery: 5,
      tempColumnWidth: null,
      tempColors: [],
      newColor: 'black',
      validGridLines: [2, 3, 4, 5]
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeColumnWidth',
      'storeContinuousInput',
      'storeDatasetId',
      'storeGridLinesEvery',
      'storeHideToggledTraits',
      'storeHideMarkers',
      'storeIgnoreEmptyCells',
      'storeInvertView',
      'storeInvertNumberingX',
      'storeInvertNumberingY',
      'storeShowStatsInTable',
      'storeTraitColors',
      'storeUseGps',
      'storeUseSpeech'
    ])
  },
  methods: {
    /**
     * Resets the dialog to its initial state
     */
    reset: function () {
      this.tempUseGps = this.storeUseGps
      this.tempUseSpeech = this.storeUseSpeech
      this.tempContinuousInput = this.storeContinuousInput
      this.tempGridLinesEvery = this.storeGridLinesEvery
      this.tempInvertView = this.storeInvertView
      this.tempColumnWidth = this.storeColumnWidth
      this.tempInvertNumberingX = this.storeInvertNumberingX
      this.tempInvertNumberingY = this.storeInvertNumberingY
      this.tempShowStatsInTable = this.storeShowStatsInTable
      this.tempHideToggledTraits = this.storeHideToggledTraits
      this.tempHideMarkers = this.storeHideMarkers
      this.tempIgnoreEmptyCells = this.storeIgnoreEmptyCells
      this.tempColors = JSON.parse(JSON.stringify(this.storeTraitColors))
    },
    resetApp: function () {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextWarningReset'), {
          title: this.$t('modalTitleWarningReset'),
          okTitle: this.$t('buttonYes'),
          okVariant: 'danger',
          cancelTitle: this.$t('buttonNo')
        })
          .then(value => {
            if (value) {
              this.$store.dispatch('resetGridScore')
            }
          })
    },
    onSubmit: function (askConfirmation) {
      if (askConfirmation) {
        // Ask for confirmation, because this will overwrite the old settings
        this.$bvModal.msgBoxConfirm(this.$t('modalTextSaveSettings'), {
          title: this.$t('modalTitleSaveSettings'),
          okTitle: this.$t('buttonSave'),
          cancelTitle: this.$t('buttonCancel')
        }).then(value => {
          if (value) {
            this.save()
          } else {
            // If not, just return to the previous page
            if (this.storeDatasetId) {
              this.$router.push({ name: 'data' })
            } else {
              this.$router.push({ name: 'home' })
            }
          }
        })
      } else {
        this.save()
      }
    },
    save: function () {
      // Dispatch to the store
      if (this.tempUseGps !== this.storeUseGps) {
        this.$store.dispatch('setUseGps', this.tempUseGps)
      }
      if (this.tempUseSpeech !== this.storeUseSpeech) {
        this.$store.dispatch('setUseSpeech', this.tempUseSpeech)
      }
      if (this.tempContinuousInput !== this.storeContinuousInput) {
        this.$store.dispatch('setContinuousInput', this.tempContinuousInput)
      }
      if (this.tempGridLinesEvery !== this.storeGridLinesEvery) {
        this.$store.dispatch('setGridLinesEvery', this.tempGridLinesEvery)
      }
      if (this.tempInvertView !== this.storeInvertView) {
        this.$store.dispatch('setInvertView', this.tempInvertView)
      }
      if (this.tempInvertNumberingX !== this.storeInvertNumberingX) {
        this.$store.dispatch('setInvertNumberingX', this.tempInvertNumberingX)
      }
      if (this.tempInvertNumberingY !== this.storeInvertNumberingY) {
        this.$store.dispatch('setInvertNumberingY', this.tempInvertNumberingY)
      }
      if (this.tempShowStatsInTable !== this.storeShowStatsInTable) {
        this.$store.dispatch('setShowStatsInTable', this.tempShowStatsInTable)
      }
      if (this.tempHideToggledTraits !== this.storeHideToggledTraits) {
        this.$store.dispatch('setHideToggledTraits', this.tempHideToggledTraits)
      }
      if (this.tempHideMarkers !== this.storeHideMarkers) {
        this.$store.dispatch('setHideMarkers', this.tempHideMarkers)
      }
      if (this.tempColumnWidth !== this.storeColumnWidth) {
        this.$store.dispatch('setColumnWidth', this.tempColumnWidth)
      }
      if (this.tempIgnoreEmptyCells !== this.storeIgnoreEmptyCells) {
        this.$store.dispatch('setIgnoreEmptyCells', this.tempIgnoreEmptyCells)
      }

      if (this.tempColors.length !== this.storeTraitColors.length || !this.tempColors.every((value, index) => value === this.storeTraitColors[index])) {
        this.$store.dispatch('setTraitColors', this.tempColors)
      }

      if (this.storeDatasetId) {
        this.$router.push({ name: 'data' })
      } else {
        this.$router.push({ name: 'home' })
      }
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
.settings-form .settings-colors .input-group,
.settings-form .settings-colors input[type=color] {
  display: inline-flex;
  width: revert;
}
</style>
