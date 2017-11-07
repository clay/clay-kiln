<template>
  <page-list :isMyPages="true"></page-list>
</template>

<script>
  import pageList from './page-list.vue';

  export default {
    components: {
      'page-list': pageList
    }
  };
</script>
