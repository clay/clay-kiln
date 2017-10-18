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
    border-radius: 50%;
    flex: 0 0 40px;
    height: 40px;
    margin-right: 16px;
    width: 40px;

    &.person-default-image {
      align-items: center;
      background-color: $md-grey-500;
      color: $pure-white;
      display: flex;
      justify-content: center;
    }
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
  }
</style>

<template>
  <div class="person-item" :class="{ 'has-primary-action': hasPrimaryAction }">
    <img v-if="image" class="person-image" :src="image" @click.stop="onClick" />
    <div v-else class="person-image person-default-image" @click.stop="onClick">
      <ui-icon icon="person"></ui-icon>
    </div>
    <div class="person-text" @click.stop="onClick">
      <span v-if="name" class="person-name">{{ name }}</span>
      <span v-if="subtitle" class="person-subtitle">{{ subtitle }}</span>
    </div>
    <div v-if="hasActions" class="person-actions">
      <ui-switch v-if="hasToggle" :value="toggled" @input="onToggle"></ui-switch>
      <ui-icon-button v-if="hasSecondaryAction" type="secondary" color="default" :icon="secondaryActionIcon" @click.stop="onSecondaryAction"></ui-icon-button>
    </div>
  </div>
</template>

<script>
  import UiSwitch from 'keen/UiSwitch';
  import UiIconButton from 'keen/UiIconButton';
  import UiIcon from 'keen/UiIcon';

  export default {
    props: ['id', 'image', 'name', 'subtitle', 'hasPrimaryAction', 'hasToggle', 'toggled', 'hasSecondaryAction', 'secondaryActionIcon'],
    computed: {
      hasActions() {
        return this.hasToggle || this.hasSecondaryAction;
      }
    },
    methods: {
      onClick() {
        this.$emit('primary-click', this.id);
      },
      onToggle(val) {
        this.$emit('toggle', this.id, val);
      },
      onSecondaryAction() {
        this.$emit('secondary-click', this.id);
      }
    },
    components: {
      UiSwitch,
      UiIconButton,
      UiIcon
    }
  };
</script>
