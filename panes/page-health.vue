<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/typography';
  @import '../styleguide/panes';

  .health-pane {
    padding: 15px;
  }

  .publish-valid {
    align-items: center;
    display: flex;
    padding: 0;
  }

  .publish-valid-icon {
    margin-right: 16px;

    svg {
      display: inline-block;
      fill: $published;
      height: 24px;
      width: 24px;
    }
  }

  .publish-valid-message {
    color: $published;
    margin: 4px 0; // vertically center with the icon (24px - 16px)
  }

  .error-message {
    @include primary-text();

    color: $bright-error;
    padding: 0 0 20px;
  }

  .warning-message {
    @include primary-text();

    color: $warning;
    padding: 0 0 20px;
  }

  .publish-error {
    @include pane-border-before();
    @include primary-text();

    padding: 20px 0;
  }

  .publish-warning + .publish-warning {
    margin-top: 20px;
  }

  .error-label {
    color: $bright-error;
    text-transform: uppercase;
  }

  .warning-label {
    color: $scheduled;
  }

  .validation-items {
    margin: 10px 0 0 20px;
    padding: 0;
  }

  .validation-item {
    margin-top: 5px;
  }

  .validation-item-location {
    @include primary-text();
  }

  .validation-item-link {
    cursor: pointer;
    text-decoration: underline;
  }

  .validation-item-preview {
    @include tertiary-text();

    margin-left: 5px;
  }
</style>

<template>
  <div class="health-pane">
    <div v-if="isValid" class="publish-valid">
      <ui-icon icon="check" class="publish-valid-icon"></ui-icon>
      <p class="publish-valid-message">Checks pass! This is good to publish.</p>
    </div>

    <div v-if="hasErrors" class="error-message">This page is missing things needed to publish.<br />Address the following and try publishing again.</div>
    <div v-for="error in errors" class="publish-error">
      <span class="error-label">{{ error.label }}:</span>
      <span class="error-description">{{ error.description }}</span>
      <ul class="validation-items">
        <li v-for="item in error.items" class="validation-item">
          <span class="validation-item-location" :class="{ 'validation-item-link': item.uri && item.field }" @click="openLocation(item.uri, item.path, item.location)">{{ item.location }}</span> <span v-if="item.preview" class="validation-item-preview">{{ item.preview }}</span>
        </li>
      </ul>
    </div>

    <div v-if="hasWarnings" class="warning-message">This page has some warnings. Please review before publishing.</div>
    <div v-for="warning in warnings" class="publish-warning">
      <span class="warning-label">{{ warning.label }}:</span>
      <span class="warning-description">{{ warning.description }}</span>
      <ul class="validation-items">
        <li v-for="item in warning.items" class="validation-item">
          <span class="validation-item-location" :class="{ 'validation-item-link': item.uri && item.field }" @click="openLocation(item.uri, item.path, item.location)">{{ item.location }}</span> <span v-if="item.preview" class="validation-item-preview">{{ item.preview }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>


<script>
  import { mapState } from 'vuex';
  import { getFieldEl, getComponentEl } from '../lib/utils/component-elements';
  import UiIcon from 'keen/UiIcon';

  export default {
    data() {
      return {};
    },
    computed: mapState({
      errors: (state) => state.validation.errors,
      warnings: (state) => state.validation.warnings,
      hasErrors() {
        return this.errors.length > 0;
      },
      hasWarnings() {
        return this.warnings.length > 0;
      },
      isValid() {
        return !this.hasErrors && !this.hasWarnings;
      }
    }),
    methods: {
      openLocation(uri, path, location) {
        const el = getFieldEl(uri, path),
          componentEl = el && getComponentEl(el);

        this.$store.commit('OPEN_VALIDATION_LINK', location);
        this.$store.dispatch('closePane');
        if (componentEl) {
          // component exists and is in the body (not a head component)
          this.$store.dispatch('select', componentEl);
        }
        this.$store.dispatch('focus', { uri, path, el });
      }
    },
    components: {
      UiIcon
    }
  };
</script>
