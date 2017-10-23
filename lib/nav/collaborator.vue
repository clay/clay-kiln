<style lang="sass">
  .collaborator {
    position: relative;
  }

  .collaborator + .collaborator {
    margin-left: 8px;
  }
</style>

<template>
  <div class="collaborator">
    <avatar class="collaborator-image" :url="user.imageUrl" size="small" ref="avatar"></avatar>
    <ui-tooltip trigger="avatar" position="bottom left">{{ user.name || user.username }}</ui-tooltip>
  </div>
</template>

<script>
  import UiTooltip from 'keen/UiTooltip';
  import avatar from '../utils/avatar.vue';

  export default {
    props: ['user'],
    components: {
      UiTooltip,
      avatar
    }
  };
</script>
