<style lang="sass">
  .status-selector {
    align-items: center;
    display: flex;

    .status-selector-radio {
      margin-left: 16px;
    }

    &.is-vertical {
      align-items: flex-start;
      flex-direction: column;
      padding: 8px 16px;

      .status-selector-radio {
        margin-left: 0;
      }

      .status-selector-radio + .status-selector-radio {
        margin-top: 8px;
      }
    }
  }
</style>

<template>
  <div class="status-selector" :class="{ 'is-vertical': vertical }">
    <ui-radio class="status-selector-radio" color="accent" label="All" :value="selectedStatus" trueValue="all" @input="input"></ui-radio>
    <ui-radio class="status-selector-radio" color="accent" label="Draft" :value="selectedStatus" trueValue="draft" @input="input"></ui-radio>
    <ui-radio class="status-selector-radio" color="accent" label="Scheduled" :value="selectedStatus" trueValue="scheduled" @input="input"></ui-radio>
    <ui-radio class="status-selector-radio" color="accent" label="Published" :value="selectedStatus" trueValue="published" @input="input"></ui-radio>
    <ui-radio class="status-selector-radio" color="accent" label="Archived" :value="selectedStatus" trueValue="archived" @input="input"></ui-radio>
  </div>
</template>

<script>
  import UiRadio from 'keen/UiRadio';

  export default {
    props: ['selectedStatus', 'vertical'],
    methods: {
      input(status) {
        this.$emit('select', status);
      }
    },
    components: {
      UiRadio
    }
  };
</script>
