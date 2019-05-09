<template>
  <div class="sort-selector" :class="{ 'is-vertical': vertical }">
    <ui-radio class="sort-selector-radio" color="accent" label="Recently Updated" :value="selectedSort" trueValue="updateTime" @input="input" />
    <ui-radio class="sort-selector-radio" color="accent" label="Recently Published" :value="selectedSort" trueValue="publishTime" @input="input" />
    <ui-radio class="sort-selector-radio" color="accent" label="Recently Scheduled" :value="selectedSort" trueValue="scheduledTime" @input="input" />
  </div>
</template>

<script>
  import UiRadio from 'keen/UiRadio';

  export default {
    props: ['selectedSort', 'vertical'],
    methods: {
      input(sortField) {
        this.$emit('select', sortField);
      }
    },
    components: {
      UiRadio
    }
  };
</script>

<style lang="sass">
  .sort-selector {
    align-items: center;
    display: flex;

    .sort-selector-radio {
      margin-left: 16px;
    }

    &.is-vertical {
      align-items: flex-start;
      flex-direction: column;
      padding: 8px 16px;

      .sort-selector-radio {
        margin-left: 0;
      }

      .sort-selector-radio + .sort-selector-radio {
        margin-top: 8px;
      }
    }
  }
</style>
