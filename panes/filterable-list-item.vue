<style lang="sass">
  @import '../styleguide/buttons';

  .filterable-list-item {
    display: flex;
    align-items: center;

    button {
      appearance: none;
      background: transparent;
      border: none;
      cursor: pointer;
    }

    &-btn {
      flex-grow: 1;
      font-size: 14px;
      line-height: 1.4;
      padding: 15px 0;
      text-align: left;
    }

    &-delete {
      padding: 14px 17px;
    }

    &-settings {
      padding: 14px 15px;
    }
  }
</style>

<template>
  <li class="filterable-list-item">
    <button
      type="button"
      class="filterable-list-item-btn"
      @click.stop="onClick(item.id)">
      {{ item.title }}
    </button>
    <button v-if="onSettings" type="button" class="filterable-list-item-settings" @click.stop="onSettings(item.id)">
      <icon name="settings"></icon>
    </button>
    <button v-if="onDelete" type="button" class="filterable-list-item-delete" @click.stop="onDelete(item.id)">
      <icon name="delete"></icon>
    </button>
  </li>
</template>

<script>
  import _ from 'lodash';
  import icon from '../lib/utils/icon.vue';

  export default {
    props: ['item', 'onClick', 'onSettings', 'onDelete'],
    data() {
      return {}
    },
    computed: {},
    components: {
      icon
    }
  };
</script>
