<template>
  <button class="kiln-toolbar-button" @click.stop="handleClick">
    <div class="button-flex-inner">
      <ui-icon :ariaLabel="text" :icon="iconName"></ui-icon>
      <span class="text" v-if="text" v-html="text"></span>
    </div>
  </button>
</template>

<script>
  import UiIcon from 'keen-ui/src/UiIcon.vue';

  export default {
    props: ['iconName', 'name', 'text'],
    data() {
      return {};
    },
    methods: {
      handleClick() {
        this.$emit('click', this.name || this.iconName, this.$el);
      }
    },
    components: {
      UiIcon
    }
  };
</script>
