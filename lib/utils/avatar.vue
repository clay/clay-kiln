<style lang="sass">
  @import '../../styleguide/colors';

  .avatar {
    border-radius: 50%;
    flex: 0 0 40px;
    height: 40px;
    width: 40px;

    &.avatar-small {
      flex: 0 0 24px;
      height: 24px;
      width: 24px;
    }

    &.avatar-default {
      align-items: center;
      background-color: $md-grey-500;
      color: $pure-white;
      display: flex;
      justify-content: center;
    }
  }
</style>

<template>
  <img v-if="url" class="avatar" :class="'avatar-' + size" :src="url" />
  <div v-else class="avatar avatar-default" :class="'avatar-' + size">
    <ui-icon icon="person"></ui-icon>
  </div>
</template>

<script>
  import UiIcon from 'keen/UiIcon';

  export default {
    props: ['url', 'size'],
    components: {
      UiIcon
    }
  };
</script>
