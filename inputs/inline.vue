<docs>
  # `inline`

  A multi-line text input which allows a rich editing experience, but appears inline rather than in a form. It will inherit styles from the component you're editing, rather than looking like a Kiln text input. [It supports exactly the same arguments as `wysiwyg`.](inputs.md#wysiwyg)
</docs>

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
