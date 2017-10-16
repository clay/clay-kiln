<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/buttons';
  @import '../../styleguide/typography';

  .filtered-add {
    align-items: center;
    border-bottom: 1px solid $pane-list-divider;
    display: flex;
  }

  .filtered-add-button {
    @include primary-text();

    align-items: flex-start;
    appearance: none;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    flex-grow: 1;
    line-height: 1.4;
    padding: 15px 0;
    text-align: left;

    &:focus {
      outline: none;
    }
  }

  .list-add-icon {
    @include icon-button($text, 24px);

    flex: 0 0 auto;
    height: 24px;
    margin: 0 10px 0 0;
    padding: 0;
  }

  .filtered-add-title {
    @include primary-text();

    flex: 1 0 auto;
  }
</style>

<template>
  <li class="filtered-add" @click.stop="onClick">
    <button class="filtered-add-button" :title="addTitle">
      <icon name="add-to-list" class="list-add-icon"></icon>
      <span class="filtered-add-title">{{ addTitle }}</span>
    </button>
  </li>
</template>

<script>
  import icon from './icon.vue';

  export default {
    props: ['onClick', 'title'],
    data() {
      return {};
    },
    computed: {
      addTitle() {
        return this.title || 'Add To List';
      }
    },
    components: {
      icon
    }
  };
</script>
