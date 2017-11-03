<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';

  .person-item {
    align-items: center;
    cursor: default;
    display: flex;
    justify-content: flex-start;
    padding: 12px 0;
    width: 100%;

    &.has-primary-action {
      cursor: pointer;
    }
  }

  .person-image {
    margin-right: 16px;
  }

  .person-text {
    align-items: flex-start;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    justify-content: center;
    // semi-hack to allow text to collapse
    min-width: 0;
  }

  .person-name {
    @include type-body();

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }

  .person-subtitle {
    @include type-caption();

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }

  .person-actions {
    align-items: center;
    color: $text-color;
    display: flex;
    flex: 0 0 auto;
    margin-left: 16px;

    & > * + * {
      margin-left: 4px;
    }
  }
</style>

<template>
  <div class="person-item" :class="{ 'has-primary-action': hasPrimaryAction }">
    <avatar class="person-image" :url="image" @click.stop="onClick"></avatar>
    <div class="person-text" @click.stop="onClick">
      <span v-if="name" class="person-name">{{ name }}</span>
      <span v-if="subtitle" class="person-subtitle">{{ subtitle }}</span>
    </div>
    <div v-if="hasActions" class="person-actions">
      <ui-switch v-if="hasToggle" ref="toggle" color="accent" :disabled="disabled" :value="toggled" @input="onToggle"></ui-switch>
      <ui-tooltip v-if="hasToggle && toggleTitle" trigger="toggle">{{ toggleTitle }}</ui-tooltip>
      <ui-icon-button v-if="hasSecondaryAction" :disabled="disabled" type="secondary" color="default" :icon="secondaryActionIcon" @click.stop="onSecondaryAction"></ui-icon-button>
    </div>
  </div>
</template>

<script>
  import UiSwitch from 'keen/UiSwitch';
  import UiIconButton from 'keen/UiIconButton';
  import UiTooltip from 'keen/UiTooltip';
  import avatar from './avatar.vue';

  export default {
    props: ['id', 'image', 'name', 'subtitle', 'hasPrimaryAction', 'hasToggle', 'toggled', 'hasSecondaryAction', 'secondaryActionIcon', 'disabled', 'toggleTitle'],
    computed: {
      hasActions() {
        return this.hasToggle || this.hasSecondaryAction;
      }
    },
    methods: {
      onClick() {
        if (!this.disabled) {
          this.$emit('primary-click', this.id);
        }
      },
      onToggle(val) {
        if (!this.disabled) {
          this.$emit('toggle', this.id, val);
        }
      },
      onSecondaryAction() {
        if (!this.disabled) {
          this.$emit('secondary-click', this.id);
        }
      }
    },
    components: {
      UiSwitch,
      UiIconButton,
      UiTooltip,
      avatar
    }
  };
</script>
