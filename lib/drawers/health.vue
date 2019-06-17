<template>
  <div class="health-drawer">
    <div v-if="isValid" class="publish-valid">
      <span class="valid-label">Checks pass!</span>
      <span class="valid-description">This is good to publish.</span>
    </div>
    <health-item :errors="errors" errorLevel="error" errorKey="error" />
    <health-item :errors="kilnjsErrors" errorLevel="error" errorKey="kilnjs-error" />
    <health-item :errors="warnings" errorLevel="warning" errorKey="warning" />
    <health-item :errors="kilnjsWarnings" errorLevel="warning" errorKey="kilnjs-warning" />
    <health-item :errors="metadataErrors" errorLevel="error" errorKey="metadata-error" :openItem="false" />
    <health-item :errors="metadataWarnings" errorLevel="warning" errorKey="metadata-warnings" :openItem="false" />
  </div>
</template>


<script>
  import { mapState } from 'vuex';
  import UiIcon from 'keen/UiIcon';
  import healthItem from './health-item';

  export default {
    data() {
      return {};
    },
    computed: mapState({
      errors: (state) => state.validation.errors,
      warnings: (state) => state.validation.warnings,
      kilnjsErrors: (state) =>  state.validation.kilnjsErrors.filter((error) => error.type === 'error'),
      kilnjsWarnings: (state) =>  state.validation.kilnjsErrors.filter((error) => error.type === 'warning'),
      metadataErrors: (state) => state.validation.metadataErrors,
      metadataWarnings: (state) => state.validation.metadataWarnings,
      hasErrors() {
        return this.errors.length > 0 || this.metadataErrors.length > 0;
      },
      hasWarnings() {
        return this.warnings.length > 0 || this.metadataWarnings.length > 0;
      },
      isValid() {
        return !this.hasErrors && !this.hasWarnings;
      }
    }),
    components: {
      UiIcon,
      healthItem
    }
  };
</script>

<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';

  .health-drawer {
    height: 100%;
    overflow-y: scroll;
    padding: 16px 0;

    .validation-info {
      @include type-caption();

      color: $text-color;
      font-weight: bold;
      margin: 16px 0 8px 16px;
      text-transform: uppercase;
    }

    .validation-items {
      list-style: none;
      margin: 0 0 0 16px;
      padding: 0;
    }

    .validation-item {
      padding-left: 16px;
      position: relative;

      &:before {
        color: $brand-primary-color;
        content: '• ';
        left: 0;
        position: absolute;
        top: 2px;
      }
    }

    .validation-item + .validation-item {
      margin-top: 8px;
    }

    .validation-item-location {
      @include type-body();

      &.validation-item-link {
        color: $brand-primary-color;
        cursor: pointer;
        font-weight: bold;
        text-decoration: underline;
      }
    }

    .validation-item-preview {
      @include type-caption();

      font-style: italic;
      margin-left: 4px;
    }
  }

  .publish-valid {
    display: flex;
    flex-direction: column;
    padding: 0 16px;

    .valid-label {
      @include type-subheading();

      color: $md-green;
      // font-weight: bold;
      margin-bottom: 8px;
      // text-transform: uppercase;
    }

    .valid-description {
      @include type-caption();
    }
  }

  .publish-error,
  .publish-metadata-errors {
    border-bottom: 1px solid $divider-color;
    display: flex;
    flex-direction: column;
    padding: 16px;



    .error-label {
      @include type-subheading();

      color: $md-red;
      // font-weight: bold;
      margin-bottom: 8px;
      // text-transform: uppercase;
    }

    .error-description {
      @include type-caption();
    }
  }

  .publish-warning,
  .publish-metadata-warnings {
    border-bottom: 1px solid $divider-color;
    display: flex;
    flex-direction: column;
    padding: 16px;



    .warning-label {
      @include type-subheading();

      color: $md-orange;
      // font-weight: bold;
      margin-bottom: 8px;
      // text-transform: uppercase;
    }

    .warning-description {
      @include type-caption();
    }
  }
</style>
