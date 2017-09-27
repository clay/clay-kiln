<template>
  <component is="wysiwyg" :name="name" :data="data" :schema="schema" :args="args"></component>
</template>

<script>
  import wysiwyg from './wysiwyg.vue';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    components: {
      wysiwyg
    }
  };
</script>
