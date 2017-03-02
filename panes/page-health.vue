<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/typography';
  @import '../styleguide/panes';

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

    color: $red;
    padding: 0 0 20px;
  }

  .warning-message {
    @include primary-text();

    color: $scheduled;
    padding: 0 0 20px;
  }

  .publish-error {
    @include pane-border-before();
    @include primary-text();

    padding: 20px 0;
  }

  .error-label {
    color: $red;
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
    @include secondary-text();

    font-style: italic;
    margin-left: 5px;
  }
</style>

<template>
  <div class="health-pane">
    <div v-if="isValid" class="publish-valid">
      <icon name="publish-check" class="publish-valid-icon"></icon>
      <p class="publish-valid-message">Checks pass! This is good to publish.</p>
    </div>

    <div v-if="hasErrors" class="error-message">This page is missing things needed to publish.<br />Address the following and try publishing again.</div>
    <div v-for="error in errors" class="publish-error">
      <span class="error-label">{{ error.label }}:</span>
      <span class="error-description">{{ error.description }}</span>
      <ul class="validation-items">
        <li v-for="item in error.items" class="validation-item">
          <span class="validation-item-location" :class="{ 'validation-item-link': item.uri && item.field }" @click="openLocation(item.uri, item.field)">{{ item.location }}</span> <span v-if="item.preview" class="validation-item-preview">{{ item.preview }}</span>
        </li>
      </ul>
    </div>

    <div v-if="hasWarnings" class="warning-message">This page has some warnings. Please review before publishing.</div>
    <div v-for="warning in warnings" class="publish-warning">
      <span class="warning-label">{{ warning.label }}:</span>
      <span class="warning-description">{{ warning.description }}</span>
      <ul class="validation-items">
        <li v-for="item in warning.items" class="validation-item">
          <span class="validation-item-location" :class="{ 'validation-item-link': item.uri && item.field }" @click="openLocation(item.uri, item.field)">{{ item.location }}</span> <span v-if="item.preview" class="validation-item-preview">{{ item.preview }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>


<script>
  import _ from 'lodash';
  import { mapState } from 'vuex';
  import { find } from '@nymag/dom';
  import { getSchema } from '../lib/core-data/components';
  import { displayProp, groupsProp, refAttr, editAttr } from '../lib/utils/references';

  function getSettingsPath(field, schema) {
    if (_.get(schema, `${field}[${displayProp}]`) === 'settings') {
      return 'settings';
    }
  }

  function getGroupPath(field, schema) {
    // find the field in a group
    // note: this will find it in a manually-specified settings group
    // if the field doesn't itself have _display: settings
    if (schema[groupsProp]) {
      return _.findKey(schema[groupsProp], (group) => _.includes(group.fields, field));
    }
  }

  function getPathFromField(uri, field) {
    const schema = getSchema(uri);

    // if it's a field in settings, return settings (easiest check)
    // otherwise see if it's in a group
    // otherwise return the field itself
    return getSettingsPath(field, schema) || getGroupPath(field, schema) || field;
  }

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
      openLocation(uri, field) {
        const path = getPathFromField(uri, field),
          el = find(`[${refAttr}="${uri}"][${editAttr}="${path}"]`) || find(`[${refAttr}="${uri}"] [${editAttr}="${path}"]`);

        this.$store.dispatch('closePane');
        this.$store.dispatch('focus', { uri, path, el });
      }
    }
  };
</script>
